# Tests Report

**Date:** 2026-05-12  
**Project:** compass_transfer_front (monorepo)

---

## Coverage Summary

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Statements | 3.35% (479/14286) | 5.02% (718/14286) | +1.67% |
| Branches | 2.49% (267/10713) | 3.11% (334/10713) | +0.62% |
| Functions | 3.60% (116/3218) | 4.84% (156/3218) | +1.24% |
| Lines | 3.42% (461/13476) | 5.13% (692/13476) | +1.71% |

**Total tests:** 220 (up from 171)  
**Test files:** 25

---

## Per-Module Coverage

| Module | Statements |
|--------|-----------|
| `features/auth/hooks` | 74.19% |
| `shared/api/client.ts` | 82.63% |
| `shared/api/auth-service.ts` | 57.14% |
| `shared/hooks/use-saved-filters.ts` | 96.22% |
| `entities/services/model/validation/ui.ts` | ~90% |

---

## Test Files Inventory

### Task 1 — Unit Tests (9 files)

| File | Tests |
|------|-------|
| `packages/shared/lib/__tests__/utils.test.ts` | |
| `packages/shared/lib/__tests__/api-error.test.ts` | |
| `packages/shared/hooks/__tests__/use-debounce.test.ts` | |
| `packages/shared/hooks/__tests__/use-pagination.test.ts` | |
| `packages/entities/orders/model/__tests__/` | |
| `packages/entities/locations/model/__tests__/` | |
| `packages/entities/services/model/validation/__tests__/ui.test.ts` | |
| `packages/shared/hooks/__tests__/use-saved-filters.test.ts` | |
| `packages/shared/api/__tests__/handle-api-error.test.ts` | |

### Task 2 — Form / Component Tests (7 files)

| File | Tests |
|------|-------|
| `packages/features/auth/components/__tests__/login-form.test.tsx` | |
| `packages/features/auth/components/__tests__/change-password-modal.test.tsx` | |
| `packages/features/auth/components/__tests__/forgot-password-form.test.tsx` | |
| `packages/features/auth/components/__tests__/reset-password-form.test.tsx` | |
| `packages/features/auth/components/__tests__/register-partner-form.test.tsx` | |
| `packages/entities/services/components/__tests__/` | |
| `packages/entities/orders/components/__tests__/` | |

### Task 3 — Integration Tests (3 files)

| File | Tests | Coverage area |
|------|-------|---------------|
| `packages/shared/api/__tests__/auth.integration.test.ts` | 12 | AuthService (login, logout, changePassword, registerPartner) via MSW |
| `packages/shared/api/__tests__/users.integration.test.ts` | 8 | usersApi (getSelfProfile, updateAdmin, getUserById, getUsers, deleteUser) via MSW |
| `packages/shared/api/__tests__/client-401.integration.test.ts` | 5 | 401 interceptor: retry, refresh failure → logout, auth endpoint skip, no loop |

### Task 4 — Auth Hook Tests + Coverage Gaps (6 new files, 2 updated)

| File | Tests | Notes |
|------|-------|-------|
| `packages/features/auth/hooks/__tests__/useLogin.test.ts` | 5 | Fake timers, 1000ms internal delay |
| `packages/features/auth/hooks/__tests__/useLogout.test.ts` | 6 | leaveQueue integration, 500ms delay |
| `packages/features/auth/hooks/__tests__/useForgotPassword.test.ts` | 5 | Redirect to reset-password with email param |
| `packages/features/auth/hooks/__tests__/useResetPassword.test.ts` | 7 | VALID_CODE=123456, redirect to /auth/login |
| `packages/features/auth/hooks/__tests__/useChangePassword.test.ts` | 8 | Mocked AuthService.changePassword |
| `packages/features/auth/hooks/__tests__/useRegisterPartner.test.ts` | 7 | Redirect after 2s, fieldErrors.email for duplicate |
| `packages/shared/hooks/__tests__/use-saved-filters.test.ts` | +3 | Error catch paths (QuotaExceeded, Security error) |
| `packages/entities/services/model/validation/__tests__/ui.test.ts` | +3 | ForUpdate: whitespace desc, empty required fields |

---

## Key Infrastructure

### Test Stack
- **vitest** with jsdom environment
- **@testing-library/react** (`renderHook`, `act`)
- **MSW v2** (`msw/node`) — intercepts axios + fetch in Node/jsdom
- **@vitest/coverage-v8** — V8 coverage provider

### Patterns Used

**MSW server per file:**
```typescript
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Fake timers for hooks with setTimeout:**
```typescript
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
// Inside test:
await act(async () => {
  result.current.someAction();
  await vi.runAllTimersAsync();
});
```

**`vi.hoisted()` for mock variables:**
```typescript
const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
```

**Module state reset for 401 interceptor:**
```typescript
beforeEach(() => vi.resetModules());
// Inside test:
const { apiGet } = await import('../client'); // fresh singleton state
```

**MSW-based redirect detection (jsdom can't stub `window.location`):**
```typescript
let logoutCalled = false;
server.use(
  http.post(`${BASE}/Auth/logout`, () => {
    logoutCalled = true;
    return new HttpResponse(null, { status: 200 });
  }),
);
await vi.waitFor(() => expect(logoutCalled).toBe(true), { timeout: 2000 });
```

---

## Remaining Uncovered Areas

| Area | Reason |
|------|--------|
| UI components (pages, widgets) | Require full Next.js app context; integration tested in browser |
| `shared/lib/utils.ts` lines 28-32 | Dead code — `catch` block in `createDateTimeTransform`; `new Date()` never throws |
| `shared/api/orders-api.ts`, `locations-api.ts` | Same pattern as users-api; covered by architecture |
| SignalR hooks (`useOrdersHub`, etc.) | Require real WebSocket; no viable mock without full server |
| Server actions (`packages/server/**`) | Next.js server-side; outside vitest scope |
| Most `pages/**` components | App-level routing; covered by E2E tests |

---

## Notable Bugs Found During Testing

1. **`handleApiError` ignores `title` field for 4xx responses** — the switch case overwrites the message if `errors` is absent. Custom messages must use `{ errors: { field: ['msg'] } }` format, not `{ title: 'msg' }`.

2. **`vi.stubGlobal('location', ...)` is ineffective in jsdom** — `window.location` has special internal protection in jsdom. Detection must be done indirectly via MSW handler side effects.

3. **Module-level state (`isRefreshing`, `isRedirectingToLogin`, `failedQueue`) in `client.ts` persists across tests** — requires `vi.resetModules()` + dynamic import per test case.
