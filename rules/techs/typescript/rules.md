---
appliesTo:
  languages:
    - typescript
tags:
  - typescript
  - code-quality
  - types
description: TypeScript-specific code quality rules and best practices
---

## TypeScript Code Quality

- **Avoid `any` and `unknown` types**: Avoid using `any` or `unknown` type if at all possible. Use proper TypeScript
  types instead
- **Type assertions**: When necessary, use type assertions with proper type guards rather than `any`
- **Promise Handling**: When encountering linter errors about unhandled Promises, ALWAYS analyze the context to
  determine the appropriate solution:
  - **Use `void` operator**: For fire-and-forget operations where you don't need to wait for completion or handle
    errors (e.g., clipboard operations, analytics tracking, logging)
  - **Use `async/await`**: When you need to wait for the Promise to complete or handle the result/error
  - **Consider the UX**: For UI operations, immediate feedback is often more important than waiting for async completion
