import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const BASE = 'http://localhost:3001';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Each test calls vi.resetModules() so module-level state in client.ts
// (isRefreshing, isRedirectingToLogin, failedQueue) resets to initial values.
describe('401 interceptor', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('retries the original request after successful token refresh', async () => {
    let profileCallCount = 0;

    server.use(
      http.get(`${BASE}/User/self/profile`, () => {
        profileCallCount++;
        if (profileCallCount === 1) return new HttpResponse(null, { status: 401 });
        return HttpResponse.json({ id: 'user-1', email: 'ok@test.com' });
      }),
      http.post(`${BASE}/Auth/refresh`, () => HttpResponse.json({}, { status: 200 })),
    );

    const { apiGet } = await import('../client');
    const result = await apiGet<{ id: string; email: string }>('/User/self/profile');

    expect(profileCallCount).toBe(2);
    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ id: 'user-1', email: 'ok@test.com' });
  });

  it('initiates logout sequence when refresh token endpoint returns 401', async () => {
    let logoutCalled = false;

    server.use(
      http.get(`${BASE}/User/self/profile`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/Auth/refresh`, () => new HttpResponse(null, { status: 401 })),
      // redirectToLogin() calls this via native fetch before navigating
      http.post(`${BASE}/Auth/logout`, () => {
        logoutCalled = true;
        return new HttpResponse(null, { status: 200 });
      }),
    );

    const { apiGet } = await import('../client');
    const result = await apiGet('/User/self/profile');

    // redirectToLogin() is fire-and-forget — wait for the async logout fetch
    await vi.waitFor(() => expect(logoutCalled).toBe(true), { timeout: 2000 });

    expect(result.error).toBeDefined();
    expect(result.error?.statusCode).toBe(401);
  });

  it('does not attempt token refresh for /Auth/ endpoints', async () => {
    let refreshCalled = false;

    server.use(
      http.post(`${BASE}/Auth/login`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/Auth/refresh`, () => {
        refreshCalled = true;
        return HttpResponse.json({}, { status: 200 });
      }),
    );

    const { apiPost } = await import('../client');
    const result = await apiPost('/Auth/login', { email: 'a@b.com', password: 'wrong' });

    expect(refreshCalled).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.statusCode).toBe(401);
  });

  it('returns error without looping when a retried request also returns 401', async () => {
    // Refresh succeeds but the retried protected request still returns 401.
    // The _retry flag prevents re-entry into the refresh block.
    let logoutCalled = false;

    server.use(
      // Always 401 — both first attempt and retry after refresh
      http.get(`${BASE}/User/self/profile`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/Auth/refresh`, () => HttpResponse.json({}, { status: 200 })),
      http.post(`${BASE}/Auth/logout`, () => {
        logoutCalled = true;
        return new HttpResponse(null, { status: 200 });
      }),
    );

    const { apiGet } = await import('../client');
    const result = await apiGet('/User/self/profile');

    expect(result.error).toBeDefined();
    await vi.waitFor(() => expect(logoutCalled).toBe(true), { timeout: 2000 });
  });

  it('calls logout only once when multiple 401s occur after isRedirectingToLogin is set', async () => {
    let logoutCallCount = 0;

    server.use(
      http.get(`${BASE}/User/self/profile`, () => new HttpResponse(null, { status: 401 })),
      http.get(`${BASE}/User/other`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/Auth/refresh`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/Auth/logout`, () => {
        logoutCallCount++;
        return new HttpResponse(null, { status: 200 });
      }),
    );

    const { apiGet } = await import('../client');

    // First request triggers the full redirect flow
    await apiGet('/User/self/profile');
    await vi.waitFor(() => expect(logoutCallCount).toBe(1), { timeout: 2000 });

    // Second 401 — isRedirectingToLogin is now true so redirectToLogin() is a no-op
    await apiGet('/User/other');
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(logoutCallCount).toBe(1);
  });
});
