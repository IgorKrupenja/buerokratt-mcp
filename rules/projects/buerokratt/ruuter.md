---
appliesTo:
  projects:
    - buerokratt/Service-Module
description: Ruuter YAML business logic rules for DSL-based backends
---

## Business Logic (Ruuter YAML)

- **Location**: YAML files are under `DSL/Ruuter/` folder
- **Purpose**: YAML files define API endpoints and business logic
- **Structure**: Each YAML file represents one API endpoint
- **File Organization**:
  - `services/` - Main service endpoints
  - `training/` - Training-related endpoints
  - `users/` - User management endpoints
  - `TEMPLATES/` - Reusable template endpoints
- **HTTP Methods**: Organize by method (`GET/`, `POST/`) within service folders

### YAML Structure Patterns

```yaml
declaration:
  call: declare
  version: 0.1
  description: 'Description of the endpoint'
  method: post # or get
  accepts: json
  returns: json
  namespace: service
  allowlist:
    body:
      - field: paramName
        type: string|number|boolean|object
        description: 'Parameter description'
    params:
      - field: id
        type: string
        description: 'URL parameter'
    headers:
      - field: cookie
        type: string
        description: 'Header field'
```

**Note**: parameter names should be camelCase.

### Variable Assignment Pattern

```yaml
extract_request_data:
  assign:
    name: ${incoming.body.name}
    description: ${incoming.body.description}
    type: ${incoming.body.type.toUpperCase()}
    id: ${incoming.params.id}
  next: next_step_name
```

### Escaping Curly Brackets

- **Standard Syntax**: Use `${...}` for JavaScript expressions without curly brackets
- **Escaping Syntax**: Use `$= ... =` for JavaScript expressions that contain curly brackets `{}`
- **When to Use**: Use `$= ... =` when expressions contain:
  - Function definitions with function bodies: `$= (function() { return value; })() =`
  - Object literals: `$= {"key1":"value1","key2":"value2"} =`
  - Any other JavaScript code with curly brackets
- **Helper Function**: In front-end code, use `stringToEscapedTemplate()` from `src/utils/string-util.ts` when generating
  expressions that may contain curly brackets

**Examples:**

```yaml
assign:
  # Function with curly brackets - use $= ... =
  dateString: $= (function() { const d = new Date(); return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-'); })() =

  # Object literal - use $= ... =
  config: $= {"key1":"value1","key2":"value2"} =

  # Simple expression without curly brackets - use ${...}
  name: ${incoming.body.name}
```

### Conditional Logic Pattern

```yaml
check_for_required_parameters:
  switch:
    - condition: ${incoming.body.name == null || incoming.body.description == null}
      next: return_incorrect_request
    - condition: ${incoming.body.type === 'GET'}
      next: handle_get_type
  next: default_next_step
```

### HTTP Call Pattern

```yaml
service_add:
  call: http.post # or http.get
  args:
    url: '[#SERVICE_RESQL]/add'
    body:
      name: ${name}
      description: ${description}
      type: ${type}
    headers:
      cookie: ${incoming.headers.cookie}
  result: createdService
  next: next_step
```

### Response Pattern

```yaml
return_ok:
  reloadDsl: true # Optional: reload DSL after success
  status: 200
  return: ${results.response.body}
  next: end

return_error:
  status: 400
  return: 'Error message'
  next: end
```

### Debugging with Log Steps

For debugging purposes, you can use `log` steps to output values at any point in the execution flow. Log steps will output to the container logs.

```yaml
logVariable:
  log: ${variableName}
  next: next_step

logHttpResponse:
  log: ${results.createdService.response.body}
  next: next_step
```

**Examples:**

- Log incoming request body: `log: ${incoming.body}`
- Log URL parameters: `log: ${incoming.params}`
- Log headers: `log: ${incoming.headers}`
- Log assigned variables: `log: ${variableName}`
- Log HTTP call results: `log: ${results.resultName.response.body}`
- Log multiple values: Use `$= ... =` syntax with object literals to log multiple values at once

### Environment Variables and Configuration

- **Configuration File**: All environment variables and secrets for DSL/Ruuter projects are stored in `constants.ini` file at the root of each repository. They use use the format `KEY=value`.
- **Accessing in YAML**: Reference environment variables using `[#VARIABLE_NAME]` syntax (e.g., `[#SERVICE_RESQL]`, `[#CHATBOT_DMAPPER]`)

### Base64 Encoding with DataMapper

When you need to encode strings to base64 in Ruuter DSL (e.g., for Authorization headers), use the DataMapper encryption endpoint:

```yaml
encode_to_base64:
  call: http.post
  args:
    url: '[#CHATBOT_DMAPPER]/encryption/base64'
    body:
      content: ${stringToEncode}
  result: base64_result
  next: use_encoded_value

use_encoded_value:
  assign:
    encodedString: ${base64_result.response.body.cipher}
  next: next_step
```

Please note that the variable name (#CHATBOT_DMAPPER in the example above) varies depending on the module.

### Key Rules

- **JavaScript in ${}**: Everything inside `${}` is JavaScript code executed by Ruuter
- **Variable Access**: Use `incoming.body.field`, `incoming.params.field`, `incoming.headers.field`
- **Service URLs**: Use `[#SERVICE_NAME]` for service references (e.g., `[#SERVICE_RESQL]`, `[#SERVICE_DMAPPER]`)
- **Conditional Logic**: Use `switch` with `condition` for if/else logic
- **Step Flow**: Use `next` to define execution flow
- **Error Handling**: Always include error response patterns
- **Result Storage**: Use `result` to store HTTP call responses
- **Variable Assignment**: Use `assign` to create/modify variables
- **File Operations**: Use DMAPPER service for file operations
- **Database Operations**: Use RESQL service for database queries
- **HTTP Call Requirements**:
  - `result` is REQUIRED for all HTTP calls (endpoint fails without it). Always include `result` even if you don't plan
    to use the response
  - `next` is optional but useful for flow control
- **Container Restart**: After making any changes to Ruuter YAML files, you MUST restart the Docker container named "ruuter" running in docker compose. Use `docker compose restart ruuter` to apply the changes
