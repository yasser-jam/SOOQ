# Multi-Module Architecture Instructions

Use this file when implementing, refactoring, or reviewing frontend code in this repository.

## When To Apply

Apply these instructions for work involving:

- domain/module structure
- route design
- business logic placement
- authorization checks
- workflow status modeling
- shared platform concerns
- cross-module dependencies

## Rules

1. Organize by business domain, not file type.
2. Keep route files thin and free of business logic.
3. Keep business rules inside domain modules.
4. Preserve module layering:
   - UI
   - Application
   - Domain
   - Infrastructure
5. Separate generic shared UI from domain-specific UI.
6. Use capability-based authorization, not hardcoded role names.
7. Centralize status values and transitions.
8. Prefer server-first rendering and data loading.
9. Centralize cross-cutting concerns in shared platform modules.
10. Protect module boundaries; consume explicit public interfaces only.
11. Build with future domain growth in mind.

## PR Review Expectations

Flag changes that:

- add business logic directly to route files
- scatter domain rules into unrelated shared/global files
- hardcode role checks where capabilities should be used
- duplicate status strings or transitions in UI files
- reimplement cross-cutting concerns per domain
- import another domain's internals directly

## Source Of Truth

The detailed source for these rules is:

- content/docs/multi-module-application-rules.mdx

For expanded operational guidance and applyTo targeting, see:

- .github/instructions/modular-project.instructions.md
