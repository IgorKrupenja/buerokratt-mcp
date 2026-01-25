---
appliesTo:
  projects:
    - buerokratt/Training-Module
    - buerokratt/Analytics-Module
    - buerokratt/Buerokratt-Chatbot
description: SQL UPDATE and DELETE restrictions for modules that require immutable data
---

## SQL Restrictions

- **UPDATE and DELETE Statements**: UPDATE and DELETE statements are NOT ALLOWED. Use INSERT statements with SELECT
  from existing records as a workaround:
  - Copy all fields from existing record
  - Modify only the fields that need to change
  - Use `ORDER BY id DESC LIMIT 1` to get latest record
