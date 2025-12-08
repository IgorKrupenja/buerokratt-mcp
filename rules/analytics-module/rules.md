---
modules:
  - analytics-module
tags:
  - backend
  - sql
  - database
description: Analytics module specific rules
---

# SQL Rules

- **UPDATE and DELETE Statements**: UPDATE and DELETE statements are NOT ALLOWED in the `analytics/` folder. Use INSERT
  statements with SELECT from existing records as a workaround:
  - Copy all fields from existing record
  - Modify only the fields that need to change
  - Use `ORDER BY id DESC LIMIT 1` to get latest record

