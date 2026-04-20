---
description: Apply when tasks involve frontend architecture, module boundaries, routing, domain logic, authorization, workflow status, or cross-cutting concerns.
applyTo: "app/**/*.{js,jsx,ts,tsx},src/**/*.{js,jsx,ts,tsx}"
---

# Multi-Module Architecture Instructions

Use these instructions when generating code, proposing refactors, answering architecture questions, or reviewing changes in this repository.

## Core Goal

Preserve a scalable multi-module frontend architecture organized by business domains, with clear boundaries and minimal coupling.

## Required Rules

1. Organize code by business domain, not by generic file-type buckets.
2. Keep route files thin.
3. Keep business logic inside domain modules.
4. Preserve internal layers inside each module.
5. Separate generic UI from domain UI.
6. Use capability-based authorization.
7. Treat workflow status as a first-class domain model.
8. Prefer server-first rendering and data loading.
9. Centralize cross-cutting concerns.
10. Protect module boundaries.
11. Favor choices that scale as domains grow.

## Detailed Guidance

### 1) Organize by Business Domain

- Group features by domain ownership and business capability.
- Avoid introducing new global folders that mix unrelated domains.
- When adding a feature, place it in the owning domain module first.

### 2) Keep the Routing Layer Thin

- Route entries should do routing concerns only: params, composition, and hand-off.
- Do not place core business rules, state transitions, or workflow decisions in route files.

### 3) Keep Business Logic Inside Modules

- Domain modules are the source of truth for business behavior.
- Keep rules, validations, and workflows in module-level application/domain code.
- Reject changes that spread domain behavior into unrelated shared files.

### 4) Enforce Internal Module Layers

Within a domain module, separate responsibilities:

- UI layer: screens, forms, tables, dialogs, filters, view composition.
- Application layer: use-case orchestration and action flows.
- Domain layer: pure rules, invariants, validations, transitions.
- Infrastructure layer: repositories, API clients, persistence, external adapters.

Do not collapse these layers into a single mixed file unless the change is truly trivial and temporary.

### 5) Separate Generic UI from Domain UI

- Keep design-system and generic components business-agnostic.
- Keep domain-specific presentation inside the owning domain module.
- Avoid leaking domain terms into generic shared UI primitives.

### 6) Use Capability-Based Authorization

- Gate UI and actions using capabilities/permissions, not hardcoded role names.
- Keep authorization checks explicit and reusable.
- Prefer centralized authorization helpers over ad hoc checks.

### 7) Model Workflow Status Centrally

- Define status values, labels, and transitions in one domain-owned place.
- Avoid duplicating raw status strings across routes/components.
- Ensure badges, action availability, and transitions use the same status model.

### 8) Prefer Server-First Rendering and Data Loading

- Default to server-first rendering for read-heavy views.
- Use client components only when interaction requires client runtime.
- Keep data-fetching decisions consistent with performance and maintainability.

### 9) Centralize Cross-Cutting Concerns

- Reuse common platform capabilities instead of re-implementing in each domain.
- Typical shared concerns include authentication, authorization, notifications, files/attachments, auditing, and exports.

### 10) Protect Module Boundaries

- Do not import another domain's internals directly.
- If sharing is required, consume only small explicit public interfaces.
- Prefer loose coupling and clear contracts between modules.

### 11) Build for Growth

- Choose structures that make future domains easy to add.
- Avoid shortcuts that create long-term architectural debt.

## Code Generation Checklist

Before finalizing code, verify:

- The feature is placed in the correct domain module.
- Route files remain orchestration-only.
- Business rules are in application/domain layers.
- Authorization is capability-based.
- Workflow status logic is centralized.
- Cross-cutting concerns use shared platform modules.
- No forbidden cross-module internal imports were introduced.

## Review Checklist

When reviewing pull requests, flag as issues:

- Business logic in route files.
- Domain logic moved into global shared utilities without ownership.
- Role-name checks replacing capability checks.
- New scattered status literals or transition logic.
- Duplicate implementations of cross-cutting concerns.
- Cross-module imports of internal implementation files.

If a proposed change conflicts with these instructions, prefer architectural consistency and suggest a compliant alternative.