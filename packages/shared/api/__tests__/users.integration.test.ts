import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { usersApi } from '../users';

const BASE = 'http://localhost:3001';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const mockProfile = {
  id: 'user-1',
  email: 'admin@test.com',
  role: 'Admin',
  fullName: 'Test Admin',
  status: 'Active',
  profile: { position: 'Manager' },
};

describe('usersApi.getSelfProfile', () => {
  it('returns profile data on success', async () => {
    server.use(
      http.get(`${BASE}/User/self/profile`, () => HttpResponse.json(mockProfile)),
    );
    const data = await usersApi.getSelfProfile();
    expect(data.id).toBe('user-1');
    expect(data.email).toBe('admin@test.com');
    expect(data.fullName).toBe('Test Admin');
  });

  it('throws error when profile not found (404)', async () => {
    server.use(
      http.get(`${BASE}/User/self/profile`, () =>
        HttpResponse.json({ title: 'Not Found' }, { status: 404 }),
      ),
    );
    await expect(usersApi.getSelfProfile()).rejects.toThrow();
  });

  it('throws error on server error (500)', async () => {
    server.use(
      http.get(`${BASE}/User/self/profile`, () => new HttpResponse(null, { status: 500 })),
    );
    await expect(usersApi.getSelfProfile()).rejects.toThrow();
  });
});

describe('usersApi.updateAdmin', () => {
  it('sends PUT request with correct data and returns updated profile', async () => {
    let receivedBody: unknown;
    server.use(
      http.put(`${BASE}/User/Admin/user-1`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ ...mockProfile, fullName: 'Updated Admin' });
      }),
    );
    const result = await usersApi.updateAdmin('user-1', { fullName: 'Updated Admin' });
    expect(result.fullName).toBe('Updated Admin');
    expect(receivedBody).toMatchObject({ fullName: 'Updated Admin' });
  });

  it('throws when update fails with validation error', async () => {
    server.use(
      http.put(`${BASE}/User/Admin/user-1`, () =>
        HttpResponse.json(
          { errors: { fullName: ['ФИО не может быть пустым'] } },
          { status: 400 },
        ),
      ),
    );
    await expect(usersApi.updateAdmin('user-1', { fullName: '' })).rejects.toThrow(
      'ФИО не может быть пустым',
    );
  });
});

describe('usersApi.getUserById', () => {
  it('returns user data for given id', async () => {
    server.use(
      http.get(`${BASE}/User/user-42`, () =>
        HttpResponse.json({ id: 'user-42', email: 'user@test.com', fullName: 'User 42' }),
      ),
    );
    const result = await usersApi.getUserById('user-42');
    expect(result.id).toBe('user-42');
    expect(result.email).toBe('user@test.com');
  });

  it('throws when user not found', async () => {
    server.use(
      http.get(`${BASE}/User/nonexistent`, () =>
        HttpResponse.json({ title: 'Not Found' }, { status: 404 }),
      ),
    );
    await expect(usersApi.getUserById('nonexistent')).rejects.toThrow();
  });
});

describe('usersApi.getUsers', () => {
  it('returns paginated user list', async () => {
    const mockList = {
      data: [
        { id: 'u1', email: 'u1@test.com', fullName: 'User 1' },
        { id: 'u2', email: 'u2@test.com', fullName: 'User 2' },
      ],
      totalCount: 2,
      pageSize: 20,
      hasPrevious: false,
      hasNext: false,
    };
    server.use(http.get(`${BASE}/User`, () => HttpResponse.json(mockList)));
    const result = await usersApi.getUsers();
    expect(result.data).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.data[0].id).toBe('u1');
  });

  it('passes filter params in query string', async () => {
    let receivedUrl: string | undefined;
    server.use(
      http.get(`${BASE}/User`, ({ request }) => {
        receivedUrl = request.url;
        return HttpResponse.json({ data: [], totalCount: 0, pageSize: 20, hasPrevious: false, hasNext: false });
      }),
    );
    await usersApi.getUsers({ role: 'Admin', size: 10 });
    expect(receivedUrl).toContain('role=Admin');
    expect(receivedUrl).toContain('size=10');
  });
});

describe('usersApi.deleteUser', () => {
  it('sends DELETE request to correct endpoint', async () => {
    let called = false;
    server.use(
      http.delete(`${BASE}/User/user-1`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await usersApi.deleteUser('user-1');
    expect(called).toBe(true);
  });

  it('throws when delete fails', async () => {
    server.use(
      http.delete(`${BASE}/User/protected`, () =>
        HttpResponse.json({ title: 'Forbidden' }, { status: 403 }),
      ),
    );
    await expect(usersApi.deleteUser('protected')).rejects.toThrow();
  });
});
