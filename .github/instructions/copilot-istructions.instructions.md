Use TypeScript and follow Next.js App Router best practices.

Prefer Server Components by default. Use Client Components only for interactivity, browser APIs, or client-only hooks. Keep "use client" boundaries minimal.

Use shadcn/ui as the primary UI system. Reuse existing components and patterns before creating new ones. Prefer composition over large configurable abstractions.

Use TanStack Query for server state. Keep query keys structured and consistent. Centralize API calls in dedicated utilities. Handle loading, empty, error, and success states explicitly.

Keep components small and focused. Separate UI, data fetching, validation, and feature logic when complexity grows. Avoid giant page files and unnecessary abstractions.

Prefer clarity over cleverness. Avoid premature optimization, over-memoization, and overuse of useEffect. Do not store derived state unnecessarily.

Maintain accessibility by default: semantic HTML, labels for controls, keyboard navigation, visible focus states, and accessible dialogs/menus/forms.

Do not add new dependencies unless explicitly asked or clearly justified. Reuse existing libraries, wrappers, hooks, and utilities.

When generating code, explain tradeoffs if architecture is unclear. For larger tasks, provide a short plan, file list, and edge cases before implementation.

Always preserve project naming conventions, folder structure, design consistency, and existing coding patterns.