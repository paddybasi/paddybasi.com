---
title: Mirroring the cloud locally with emulators and LocalStack
description: A docker-compose setup that gives every developer Firestore, Cloud Storage, S3 and SQS on their laptop, with no cloud credentials needed.
pubDate: 2026-05-19
tags: [Docker, GCP, AWS, DX]
---

On both the HM Passport Office's Lost, Stolen & Recovered passports service (AWS) and the DfT Connectivity Planning Tool (GCP), one decision paid off early: **developers never needed real cloud resources to work on the app.** Everything the code talks to runs locally in docker-compose, and the app finds it purely through environment variables.

## The compose file

```yaml
services:
  firestore:
    image: gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators
    command: gcloud emulators firestore start --host-port=0.0.0.0:8080
    ports: ['8080:8080']

  gcs:
    image: fsouza/fake-gcs-server
    command: -scheme http -port 4443 -external-url http://localhost:4443
    ports: ['4443:4443']
    volumes: ['./fixtures/buckets:/data']

  localstack:
    image: localstack/localstack
    ports: ['4566:4566']
    environment:
      SERVICES: s3,sqs,lambda
```

The `fixtures/buckets` folder is seeded with sample GeoJSON or XML, so the app starts with realistic data and nobody shares a dev bucket.

## Pointing the SDKs at it

The trick is that **production code doesn't change**. Only configuration does.

**Firestore**: the Google client library checks `FIRESTORE_EMULATOR_HOST` automatically:

```sh
FIRESTORE_EMULATOR_HOST=localhost:8080
```

**Cloud Storage**: pass an endpoint only when one is configured:

```ts
import { Storage } from '@google-cloud/storage';

export const storage = new Storage(
  process.env.GCS_ENDPOINT ? { apiEndpoint: process.env.GCS_ENDPOINT, projectId: 'local' } : {},
);
```

**AWS SDK v3**: the same pattern, plus path-style URLs so bucket names don't need DNS:

```ts
import { S3Client } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'eu-west-2',
  ...(process.env.AWS_ENDPOINT && { endpoint: process.env.AWS_ENDPOINT, forcePathStyle: true }),
});
```

## Why it's worth the setup

- **Onboarding in minutes.** `docker compose up`, `npm run dev`, done.
- **Real integration tests.** Jest or Playwright suites run against the emulators in CI, exercising actual SDK calls rather than mocks that drift from reality.
- **Safe experiments.** Purge a queue, corrupt a bucket, reset in seconds. Nothing shared breaks.
- **Twelve-factor by necessity.** If the code can't run against an emulator, it usually has a hard-coded environment assumption that would hurt later anyway.

## Know the limits

Emulators are not the cloud. IAM policies, quotas, eventual-consistency edge cases and managed-service behaviour (IAP, Lambda cold starts) still need a real preview environment. On the HMCTS and Ministry of Justice projects we used per-pull-request preview environments on Kubernetes for exactly that. Local emulators cover the inner loop; preview environments cover the last mile.
