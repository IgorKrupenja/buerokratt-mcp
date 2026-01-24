---
appliesTo:
  projects:
    - buerokratt/Service-Module
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

**IMPORTANT**: When you need to connect to the database for debugging or direct queries, **ALWAYS check the `resql` service configuration first**. The `resql` service's JDBC URL is the authoritative source for the active database connection, regardless of what local database containers may exist in the docker-compose file.

**Steps to extract connection details:**

1. **Find the `resql` service**: Locate the `resql` service in the `docker-compose.yml` file
2. **Find the JDBC URL**: Look for `sqlms.datasources.[0].jdbcUrl` in the `resql` service environment variables
3. **Extract connection details**: Parse the JDBC URL format: `jdbc:postgresql://[host]:[port]/[database][?params]`
4. **Get credentials**: Find `sqlms.datasources.[0].username` and `sqlms.datasources.[0].password` in the same `resql` service

**Connection Methods:**

- **Remote Database** (most common):
  - If JDBC URL uses an IP address or remote hostname (e.g., `171.22.247.13:5433`), connect directly using the host and port from the JDBC URL:
  - `PGPASSWORD=[password] psql -h [host] -p [port] -U [username] -d [database]`
  - **Note**: Do NOT try to map ports or use localhost - use the exact host and port from the JDBC URL

- **Local Docker Database** (less common):
  - If JDBC URL uses a container name like `database:5432` or `users_db:5432`, the database is running in a local Docker container
  - Check the corresponding database service `ports` mapping in docker-compose (e.g., `5433:5432` means use port `5433` from host)
  - Connect using: `PGPASSWORD=[password] psql -h localhost -p [mapped_port] -U [username] -d [database]`
  - **Alternative**: Use `docker exec` to connect directly to the container: `docker exec [container_name] psql -U [username] -d [database]`

**Example**: If `resql` service has `jdbc:postgresql://171.22.247.13:5433/byk?sslmode=require`, connect with:

```bash
PGPASSWORD=2nH09n6Gly psql -h 171.22.247.13 -p 5433 -U byk -d byk
```
