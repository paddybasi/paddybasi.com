---
title: Hardening a Node.js frontend for government services
description: Security headers, caching rules, sessions and templating defaults I reach for when a Node/Express layer sits in front of sensitive data.
pubDate: 2026-09-22
tags: [Node.js, Express, Security, GOV.UK]
---

A lot of my recent work has been on Node.js layers that sit between citizens or court staff and a set of backend microservices. At HMCTS that meant consolidating several services behind one Express and Nunjucks application, deployed to Azure. The frontend isn't where the business rules live, but it _is_ where most of the security sharp edges are. Here is the checklist I now apply on day one.

## 1. Security headers with Helmet, including a real CSP

`helmet()` with defaults is a good start, but the Content Security Policy is the header that actually earns its keep. Most GOV.UK Frontend apps need a little inline script (`document.body.className += ' js-enabled'`), so generate a nonce per request rather than reaching for `'unsafe-inline'`:

```js
import crypto from 'node:crypto';
import express from 'express';
import helmet from 'helmet';

const app = express();

app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
        imgSrc: ["'self'", 'data:'],
      },
    },
  }),
);
```

Then in the Nunjucks layout: `<script nonce="{{ cspNonce }}">…</script>`.

## 2. Never let a cache hold personal data

Pages that show someone's case, claim or passport application should never be stored by the browser, a proxy or a CDN. That's a one-line middleware applied to every authenticated route:

```js
const noStore = (req, res, next) => {
  res.set('Cache-Control', 'no-store, max-age=0');
  next();
};

app.use('/case', requireAuth, noStore, caseRoutes);
```

Without it, pressing _Back_ after signing out on a shared computer can reveal the previous page.

## 3. Sessions that behave behind a load balancer

On Kubernetes there are always several pods, so in-memory sessions are out. Back them with Redis, and make sure the cookie flags are right when TLS terminates at the ingress:

```js
app.set('trust proxy', 1); // TLS ends at the ingress, so trust X-Forwarded-Proto

app.use(
  session({
    store: new RedisStore({ client: redis }),
    secret: process.env.SESSION_SECRET,
    name: '__Host-session',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 30 * 60 * 1000 },
  }),
);
```

The `__Host-` prefix makes the browser reject the cookie unless it is `Secure`, has no `Domain` and has `Path=/`, which is a free extra safety net.

## 4. Authentication belongs to a library, not to you

For OpenID Connect, use a certified client such as `openid-client` and let it handle discovery, PKCE, `state` and `nonce` validation, and token signature checks. The application code should only deal with "who is this user and what can they do". Keep tokens server-side in the session; the browser only ever sees the session cookie.

## 5. Template defaults that fail safe

Configure Nunjucks with `autoescape: true` (the default, but make it explicit) and treat every `| safe` filter as a code-review flag. Pair that with server-side validation on every form post: client-side validation is a usability feature, not a security control.

## 6. Make it testable

Each of these lends itself to a tiny integration test: request a page, then assert the headers. `supertest` with Jest or Vitest takes a few lines per check, and it stops a refactor from quietly removing `no-store` from a route.

None of this is glamorous, but it's the difference between a service that passes its IT health check first time and one that spends a sprint on remediation.
