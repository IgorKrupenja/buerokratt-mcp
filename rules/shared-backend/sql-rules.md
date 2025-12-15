---
modules:
  - Service-Module
tags:
  - backend
  - database
  - migrations
  - sql
  - dsl
description: SQL rules for DSL-based backends (migrations and queries)
---

## Database Migrations

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

## SQL Queries

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
  - Most modules (Training-Module, Analytics-Module, Buerokratt-Chatbot) do NOT allow UPDATE/DELETE statements (see
    sql-restrictions.md)
  - Service-Module is an exception and allows UPDATE/DELETE in the `services/` folder (see Service-Module rules)
- **Query Structure**:
  - Use CTEs (WITH clauses) for complex queries
  - Include pagination with `OFFSET` and `LIMIT`
- **HTTP Method Folders**: Organize by HTTP method (`GET/`, `POST/`) within database folders
- **Container Restart**: After making any changes to SQL files in `DSL/Resql/`, you MUST restart the Docker container named "resql" running in docker compose. Use `docker compose restart resql` to apply the changes

## Database Connection

To connect to the PostgreSQL database for debugging or direct queries, extract connection details from the `resql` service configuration in the relevant `docker-compose.yml` file:

1. **Find the JDBC URL**: Look for `sqlms.datasources.[0].jdbcUrl` in the `resql` service environment variables
2. **Extract connection details**: Parse the JDBC URL format: `jdbc:postgresql://[host]:[port]/[database][?params]`
3. **Get credentials**: Find `sqlms.datasources.[0].username` and `sqlms.datasources.[0].password` in the same service

**Connection Methods:**

- **From Host Machine** (for local Docker connections):
  - If JDBC URL uses `database:5432`, the database is accessible from host at `localhost` with the mapped port
  - Check the `database` service `ports` mapping (e.g., `5433:5432` means use port `5433` from host)
  - Connect using: `PGPASSWORD=[password] psql -h localhost -p [mapped_port] -U [username] -d [database]`

- **Remote Connections**:
  - If JDBC URL uses an IP address (e.g., `171.22.247.13:5435`), connect directly:
  - `PGPASSWORD=[password] psql -h [host] -p [port] -U [username] -d [database]`
