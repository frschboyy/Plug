# CampusMart — Testing Conventions

## Commands

```bash
npm test              # run all tests once
npm run test:watch    # watch mode during development
npm run test:coverage # run with coverage report (check src/coverage/)
npm run typecheck     # TypeScript strict check (zero tolerance)
```

## File locations

| What | Where |
|------|-------|
| Test setup & global mocks | `src/test/setup.ts` |
| MSW handlers & DB factories | `src/test/mocks/supabase.ts` |
| Unit tests (utils, schemas) | `src/test/unit/*.test.ts` |
| Component tests | `src/test/components/*.test.tsx` |

## Naming

- File: `[thing-under-test].test.ts` or `.test.tsx`
- Describe block: name of the module, function, or component
- Test: plain English sentence describing the behaviour from a user/caller perspective
  - ✓ `"rejects price_is_range=true when price_max is missing"`
  - ✗ `"calls setError with correct args"`

## What to test vs. what to skip

**Test:**
- Logic in `src/lib/utils.ts` — all pure functions, one test per branch
- Zod schemas — valid input, every invalid path, edge cases at the boundary
- Presentational components with non-trivial rendering logic (FreshnessBadge, StarRating)
- Accessibility semantics (role, aria-label, aria-checked, aria-current)

**Don't test:**
- Next.js App Router pages — they're Server Components; use Playwright for E2E
- Supabase client wrappers (`src/lib/supabase/`) — they're thin configs with no logic
- `useAuth()` and `useToast()` context providers directly — test them via the components that consume them

## Mocking strategy

**Supabase:** Use MSW (`src/test/mocks/supabase.ts`) to intercept HTTP calls at the network level. Prefer this over `vi.mock('@/lib/supabase/client')` — network-level mocks survive refactors, module mocks break silently.

**Browser APIs:** Defined in `src/test/setup.ts`:
- `URL.createObjectURL` / `revokeObjectURL` — stubbed globally
- `Image` constructor — fires `onload` asynchronously so `compressImage()` resolves
- `HTMLCanvasElement.toBlob` — returns a fake JPEG blob
- `navigator.clipboard` — stubbed with `configurable: true`

**Time:** Use `vi.useFakeTimers()` + `vi.setSystemTime()` in `beforeEach` and restore in `afterEach`. Any test involving `timeAgo()`, `daysUntilExpiry()`, or `isStale()` must pin the clock.

**Auth context:** When testing components that call `useAuth()` or `useOptionalAuth()`, wrap the component with a mock provider:

```tsx
const mockAuthValue = { user: null, session: null, profile: null, loading: false,
  signOut: vi.fn(), refreshProfile: vi.fn() };

render(
  <AuthContext.Provider value={mockAuthValue}>
    <ComponentUnderTest />
  </AuthContext.Provider>
);
```

## Coverage thresholds

Set in `vitest.config.ts`. Build fails below:
- Functions: 60%
- Branches: 55%
- Lines / Statements: 60%

These are intentionally low at project start. Raise them as coverage grows — never lower them.

## Characterization tests

When the audit flags code for refactoring, write characterization tests **before** the refactor. The test documents current behaviour (including bugs) and pins it. Then the refactor can proceed safely. See:
- `utils.test.ts` — `buildWhatsAppOrderLink()` characterization test for the missing `+` prefix (Audit W1)
- `ImageUpload.test.tsx` — regression guard for the preview desync bug (Audit W4)

When a bug is fixed, update the characterization test to assert the correct behaviour.
