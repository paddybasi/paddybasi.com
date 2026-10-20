---
title: 'Nearly two decades of JavaScript: what changed, and what never did'
description: From Flash socket servers and JavaScriptMVC to SvelteKit and Kubernetes, a look back at the tools I've shipped with and the lessons that outlived them.
pubDate: 2026-01-14
tags: [Career, JavaScript, Craft]
---

I started building websites professionally in 2007: PHP, MySQL, hand-written CSS and a bit of Flash. Since then I've shipped with almost every generation of JavaScript tooling, and the front end has changed beyond recognition. Some things haven't changed at all.

## The eras, roughly

**2007–2011: server-rendered everything.** PHP MVC apps, Smarty templates, custom CMSs and the occasional Flash socket server for real-time features. JavaScript was for progressive enhancement, and validating your markup against W3C was a point of pride.

**2011–2014: the first "real" front-end frameworks.** At Frogtrade I built virtual learning environment widgets with JavaScriptMVC, StealJS, HTML5 Canvas and the audio/video APIs, and we championed TDD with QUnit and FuncUnit. At Carphone Warehouse I built a real-time editorial CMS with Node.js and Socket.IO, back when running JavaScript on the server still raised eyebrows.

**2015–2018: AngularJS to Angular, and the rise of React.** Optimising AngularJS for mobile at William Hill. D3 charting at Slimming World. Angular 2+ with RxJS and NgRx at Red Box and Parexel, where I also worked on i18n for AOT-compiled apps and server-side rendering. React kept appearing in proofs of concept, and it was clearly where things were heading.

**2018–today: platforms, not just pages.** Government services for HMCTS, the Ministry of Justice, DWP, HM Passport Office, the Cabinet Office, DfT and ONS. The front end is often deliberately simple: Nunjucks rendering accessible HTML to the GOV.UK Design System. The complexity has moved into the platform: microservices, Kubernetes, Terraform, CI/CD, observability. More recently, SvelteKit and Next.js have brought server rendering back into fashion. In a way, we've come full circle.

## What never changed

**Tests are what let you move fast.** QUnit in 2011, Jasmine in 2016, Jest and Cypress in 2021, Vitest and Playwright today. The tools change every few years. The value of a fast, trustworthy test suite doesn't.

**HTML is the most durable technology in the stack.** The government services I've worked on render plain, accessible HTML first and enhance it afterwards. They work on old phones, on slow connections and with screen readers. Frameworks come and go; semantic markup from 2008 still renders today.

**Boring infrastructure is a feature.** Twelve-factor configuration, containers, health checks and structured logs aren't exciting, but they're why a service can be deployed on a Friday without anyone losing sleep.

**The hard problems are human.** Most of my best work has come from sitting with product owners, QA and users to understand the problem before writing code, and from mentoring others so the team can carry it on after I've gone.

## What's next

I'm still most at home in TypeScript, from the database to the browser, and I'm still happiest on projects that solve real problems for real people. If that sounds like your team, [let's talk](/#contact).
