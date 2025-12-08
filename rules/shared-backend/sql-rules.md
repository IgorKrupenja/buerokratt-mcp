---
modules:
  - service-module
tags:
  - backend
  - database
  - migrations
  - sql
  - dsl
description: SQL rules for DSL-based backends (migrations and queries)
---

# Database Migrations

- **Migration Location**: SQL migrations are in `DSL/Liquibase/changelog/` folder
- **Migration Format**: Check latest files in `Liquibase/changelog` folder for current format
- **Three Files Required**: When creating migrations, ALWAYS create three files:
  - **XML file**: `YYYYMMDDHHMMSS_description.xml` in `changelog/` folder
  - **SQL file**: `YYYYMMDDHHMMSS_description.sql` in `changelog/migrations/` folder
  - **Rollback file**: `YYYYMMDDHHMMSS_rollback.sql` in `changelog/migrations/rollback/` folder
- **File Naming**: Use timestamp format `YYYYMMDDHHMMSS` followed by descriptive name
- **XML Structure**: Include proper XML headers and changeSet with sqlFile and rollback sections
- **Legacy Migrations**: Do NOT modify old migrations in legacy format (direct .sql files)
- **Local Execution**: Run migrations locally with `migrate.sh` in repo root
- **Author Format**: Use GitHub username in changeSet. Get username with `git remote get-url origin | sed 's/.*github.com[:/]\([^/]*\)\/.*/\1/'`

# SQL Queries

- **Location**: SQL files are under `DSL/Resql/` folder
- **Database Structure**:
  - `services/` - Main services database (most queries)
  - `training/` - Training database queries
  - `users/` - User management queries
- **IMPORTANT**: Always use snake_case for new SQL files (e.g., `get_services_list.sql`, `create_endpoint.sql`) -
  this is a strict requirement
- **Legacy Files**: Do NOT rename old files with incorrect naming conventions
- **Parameter Format**: Use colon-prefixed parameters: `:page_size`, `:search`, `:sorting`, `:page`, `:id`
- **Type Casting**: Use PostgreSQL type casting: `:value::uuid`, `:state::service_state`, `:data::json`
- **UPDATE and DELETE Statements**:
  - Most modules (training-module, analytics-module, buerokratt-chatbot) do NOT allow UPDATE/DELETE statements (see
    sql-restrictions.md)
  - service-module is an exception and allows UPDATE/DELETE in the `services/` folder (see service-module rules)
- **Query Structure**:
  - Use CTEs (WITH clauses) for complex queries
  - Include pagination with `OFFSET` and `LIMIT`
- **HTTP Method Folders**: Organize by HTTP method (`GET/`, `POST/`) within database folders

