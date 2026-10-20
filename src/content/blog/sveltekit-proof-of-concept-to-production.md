---
title: From proof-of-concept to production with SvelteKit on Cloud Run
description: What it took to turn a promising Svelte prototype into a secure, tested planning tool on Google Cloud.
pubDate: 2026-07-08
tags: [SvelteKit, GCP, Cloud Run, Testing]
---

At the Department for Transport I inherited a Svelte proof-of-concept for the Connectivity Planning Tool: a map-heavy app that helps planners explore transport connectivity. The prototype proved the idea. The job was to make it something a department could run, secure and change with confidence. These were the steps that mattered most.

## Start with the architecture the prototype skipped

The prototype was a client-only Svelte app. Moving to **SvelteKit** gave us server-side rendering for fast first paint and a proper server boundary. With that we could keep secrets and service-account credentials off the client, and run authorisation logic before any HTML went out. Client-side hydration then takes over for the interactive map.

## Configure like a twelve-factor app

Every environment difference became an environment variable, read through SvelteKit's `$env/dynamic/private` so the same container image runs in every environment:

```ts
// src/lib/server/config.ts
import { env } from '$env/dynamic/private';

export const config = {
  projectId: env.GCP_PROJECT_ID,
  geoBucket: env.GEOJSON_BUCKET,
};
```

Built with `adapter-node`, the app listens on the `PORT` that Cloud Run injects, so the Dockerfile stays boring.

## Let Identity-Aware Proxy do authentication

Rather than building a login flow, we put the service behind **Google Identity-Aware Proxy (IAP)**. IAP authenticates users before requests ever reach the container and forwards their identity in headers. A SvelteKit `handle` hook turns that into `event.locals.user` for every route:

```ts
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const header = event.request.headers.get('x-goog-authenticated-user-email');
  event.locals.user = header ? { email: header.replace('accounts.google.com:', '') } : null;
  return resolve(event);
};
```

In production, also verify the signed `x-goog-iap-jwt-assertion` header against Google's public keys, so a request that somehow bypasses the proxy can't spoof the email header.

## Small, purposeful persistence

User preferences such as saved map views needed a home, but not a database server. **Firestore**, accessed from the same server hooks with a service account, was the right size: no connection pooling, no migrations, and per-user documents keyed by the IAP identity.

## Accessible maps are a design problem

We used **MapLibre GL** with Svelte for the mapping UI, styled to the GOV.UK Design System, with GeoJSON layers loaded from Cloud Storage. A map can't be the only way to get information, so every map interaction has a non-visual equivalent: focusable controls, text summaries of the selected area, and data tables a screen reader can navigate.

## Tests at three levels, in CI from the start

- **Vitest** for pure logic and server utilities
- **Testing Library** for Svelte components, queried by role and label, as a user would
- **Playwright** for end-to-end journeys against the built app

All three run in **GitHub Actions** on every pull request. Turning the prototype into production code took far less courage once we had a red/green signal for every change.

## Local development that mirrors the cloud

Finally, docker-compose and the official emulators gave every developer a local Firestore and Storage, so nobody needed cloud credentials to work on a feature. I've written that setup up separately in [mirroring the cloud locally](/blog/mirroring-the-cloud-locally).
