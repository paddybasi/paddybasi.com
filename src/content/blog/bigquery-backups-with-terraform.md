---
title: Automated BigQuery table backups, defined in Terraform
description: Daily snapshots of critical BigQuery tables using scheduled queries, with retention and permissions managed as code.
pubDate: 2026-03-03
tags: [GCP, BigQuery, Terraform, DevOps]
---

During a platform engineering stint with the Prices team at the Office for National Statistics, one of my tasks was making sure key BigQuery tables could be recovered if something went wrong: a bad load, an accidental `DELETE`, a pipeline bug. BigQuery's time travel only covers a short window (seven days at most), so we needed point-in-time copies that last longer, created automatically and owned by code rather than by someone's memory.

## Table snapshots are cheap insurance

A [table snapshot](https://cloud.google.com/bigquery/docs/table-snapshots-intro) is a read-only copy that only stores the bytes that differ from its base table, so daily snapshots of a mostly-append table cost very little. They can also expire automatically, which takes care of retention.

The scheduled query uses BigQuery scripting to build a dated snapshot name:

```sql
-- snapshot.sql
EXECUTE IMMEDIATE FORMAT("""
  CREATE SNAPSHOT TABLE `${project}.${backup_dataset}.${table}_%s`
  CLONE `${project}.${source_dataset}.${table}`
  OPTIONS (expiration_timestamp = TIMESTAMP_ADD(CURRENT_TIMESTAMP(), INTERVAL ${retention_days} DAY))
""", FORMAT_DATE('%Y%m%d', CURRENT_DATE()));
```

## Everything else in Terraform

The backup dataset, a dedicated service account with the narrowest roles that work, and one scheduled query per table:

```hcl
resource "google_bigquery_dataset" "backups" {
  dataset_id = "backups"
  location   = "europe-west2"
}

resource "google_service_account" "backup" {
  account_id   = "bq-backup"
  display_name = "BigQuery snapshot scheduler"
}

resource "google_bigquery_data_transfer_config" "snapshot" {
  for_each = toset(var.tables)

  display_name         = "snapshot-${each.key}"
  data_source_id       = "scheduled_query"
  location             = "europe-west2"
  schedule             = "every day 02:00"
  service_account_name = google_service_account.backup.email

  params = {
    query = templatefile("${path.module}/snapshot.sql", {
      project        = var.project_id
      source_dataset = var.source_dataset
      backup_dataset = google_bigquery_dataset.backups.dataset_id
      table          = each.key
      retention_days = var.retention_days
    })
  }
}
```

Adding a table to the backup set is now a one-line change to `var.tables`, reviewed in a pull request like any other code.

## Partitioned tables and longer retention

For large partitioned tables, the same pattern can copy only recent partitions. Where data needs to outlive the project itself, a small Cloud Function on a schedule can export snapshots to a Cloud Storage bucket with its own lifecycle and retention policy.

## Test the restore, not just the backup

A backup you've never restored is a hope, not a plan. Restoring is a `CREATE TABLE … CLONE` from the snapshot. Rehearse it, write the steps in the runbook, and time it, so the first restore doesn't happen during an incident.
