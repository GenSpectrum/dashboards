# AGENTS.md — Website (Frontend)

Astro + React frontend (TypeScript). All commands run from `website/`.

---

## Build & Dev Commands

```bash
npm run dev           # Start dev server (http://localhost:4321)
npm run build         # Production build
npm run preview       # Preview production build
```

## Lint & Format

```bash
npm run check         # Run all checks (format + types + astro + lint)
npm run format        # Auto-fix: ESLint + Prettier
```

## Tests

```bash
npm test                          # Run all vitest tests (node + browser)

# Run a single test file:
npx vitest run src/path/to/file.spec.ts

# Run a single test by name pattern:
npx vitest run --reporter=verbose -t "test name pattern"

# End-to-end tests (requires running dev server):
npm run e2e                       # All Playwright e2e tests
```

Check the package.json for more details execution commands.

**Test file conventions:**

- Unit tests: `*.spec.ts` or `*.spec.tsx` (co-located with source)
- Browser component tests: `*.browser.spec.tsx` (for testing things that involve React)
- E2e tests: `tests/` directory

---

## Code Style

Format with prettier. Use eslint to check code style issues.

### React & Astro

- Use **Astro** for static/server-rendered pages; use **React** for interactive components.
  Most of the pages are interactive, i.e. we only use Astro for routing. Most of the rendering happens in React.
- Prefer **CSS / Tailwind** over JavaScript for interactivity (modals, dropdowns, etc.).
- No `console.*` calls in production code (`no-console` is an error); use the logger instead.
- No React import needed in JSX files (`react/react-in-jsx-scope` is off).

### Constants / Magic Values

Use typed constant collections instead of raw string literals:

```typescript
export const myConstants = {
    value1: 'value1',
    value2: 'value2',
} as const;
// Usage: myConstants.value1  (not the string 'value1' directly)
```

### Logging

Server-side only — use `getInstanceLogger`:

```typescript
import { getInstanceLogger } from '../logger.ts';
const logger = getInstanceLogger('my-module');
logger.info('message', { extraContext: 'value' });
```

For client-side logging, use `getClientLogger` instead.

### Error Handling

- API responses are validated with Zod schemas; invalid responses throw typed errors.
- Use `UserFacingError` for errors that should be shown to the user.
- HTTP errors from the backend follow the RFC 9457 `ProblemDetail` format.
