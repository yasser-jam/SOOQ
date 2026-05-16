# Development Guidelines for SOOQ Frontend Project

## Environment Status

**IMPORTANT**: This project is NOT in production. This is a development environment.
- Database operations (DELETE, DROP, TRUNCATE, etc.) are safe to use
- Data can be freely modified, added, or deleted without fear of data loss
- No production data exists in this environment

**مهم**: هذا المشروع ليس في بيئة الإنتاج. هذه بيئة تطوير.
- عمليات قاعدة البيانات (حذف، إسقاط، تفريغ، إلخ) آمنة للاستخدام
- يمكن تعديل البيانات وإضافتها أو حذفها بحرية دون الخوف من فقدان البيانات
- لا توجد بيانات إنتاج في هذه البيئة

## Project Structure Compliance
- **Strictly follow the existing project structure** - do not create new directories or files outside the established patterns
- Use the monorepo structure with `apps/web/` for the main application
- Place shared components in `packages/ui/src/components/`
- Follow the established file naming conventions and organization

## React Best Practices
- **Adhere to React best practices** at all times
- Use functional components with hooks
- Implement proper state management with React hooks (useState, useEffect, etc.)
- Follow the component composition pattern
- Use TypeScript for all components and utilities
- Implement proper error boundaries and error handling

## Code Standards
- **Do not invent custom solutions** - use established patterns and libraries already in the project
- Follow the existing code style and formatting (Prettier, ESLint)
- Use shadcn/ui components as provided - do not create custom UI components unless absolutely necessary
- Maintain consistency with existing code patterns

## Git & Version Control
- **DO NOT PUSH TO GIT** without explicit permission from KarmoVsky
- All commits must be reviewed and approved before pushing
- Use descriptive commit messages following the established convention
- Create branches for new features following the project's branching strategy

## Communication
- **Address me as "KarmoVsky" or "كرموفيسكي"** in all communications
- Ask for clarification when requirements are unclear
- Provide progress updates regularly
- Report any blockers or issues immediately

## Additional Guidelines

### Performance
- Optimize components for performance (use React.memo, useMemo, useCallback when appropriate)
- Implement lazy loading for routes and components
- Monitor bundle size and optimize imports

### Security
- Follow security best practices for React applications
- Validate all user inputs
- Use proper authentication and authorization patterns
- Keep dependencies updated and secure

### Testing
- Write unit tests for components and utilities
- Implement integration tests for critical user flows
- Maintain test coverage above the project threshold

### Documentation
- Document complex logic and business rules
- Update README when adding new features
- Comment code where necessary for clarity

### Dependencies
- Do not add new dependencies without approval
- Prefer existing libraries over new ones
- Keep package.json clean and organized

## Code Review Process
1. Self-review code before requesting review
2. Ensure all tests pass
3. Check for TypeScript errors
4. Verify ESLint and Prettier compliance
5. Request review from KarmoVsky

---

**Remember**: Quality over quantity. It's better to take time and do it right than rush and create technical debt.

**Contact**: KarmoVsky (كرموفيسكي) for any questions, approvals, or guidance.
