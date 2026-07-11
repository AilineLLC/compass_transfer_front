import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { AuthService } from '../auth-service';
import { ApiErrorType } from '../client';

const BASE = 'http://localhost:3001';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AuthService.login', () => {
  it('returns data on successful login', async () => {
    server.use(
      http.post(`${BASE}/Auth/login`, () =>
        HttpResponse.json({ message: 'OK', user: { id: '1', email: 'admin@test.com' } }),
      ),
    );
    const result = await AuthService.login({ email: 'admin@test.com', password: 'pass123' });
    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
  });

  it('returns auth error on 401', async () => {
    server.use(
      http.post(`${BASE}/Auth/login`, () => new HttpResponse(null, { status: 401 })),
    );
    const result = await AuthService.login({ email: 'bad@test.com', password: 'wrong' });
    expect(result.error).toBeDefined();
    expect(result.error?.type).toBe(ApiErrorType.Auth);
    expect(result.data).toBeUndefined();
  });

  it('returns validation error message from 400 response with errors field', async () => {
    server.use(
      http.post(`${BASE}/Auth/login`, () =>
        HttpResponse.json(
          { errors: { credentials: ['Неверный пароль'] } },
          { status: 400 },
        ),
      ),
    );
    const result = await AuthService.login({ email: 'a@b.com', password: '12345' });
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('Неверный пароль');
    expect(result.error?.type).toBe(ApiErrorType.Validation);
  });

  it('returns error with field-level errors from 400 response', async () => {
    server.use(
      http.post(`${BASE}/Auth/login`, () =>
        HttpResponse.json(
          { errors: { password: ['Пароль должен содержать минимум 6 символов'] } },
          { status: 400 },
        ),
      ),
    );
    const result = await AuthService.login({ email: 'a@b.com', password: '1' });
    expect(result.error).toBeDefined();
    expect(result.error?.errors?.password).toContain('Пароль должен содержать минимум 6 символов');
  });
});

describe('AuthService.logout', () => {
  it('calls POST /Auth/logout and returns data', async () => {
    let called = false;
    server.use(
      http.post(`${BASE}/Auth/logout`, () => {
        called = true;
        return HttpResponse.json({ message: 'Logged out' });
      }),
    );
    const result = await AuthService.logout();
    expect(called).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns server error on 500', async () => {
    server.use(
      http.post(`${BASE}/Auth/logout`, () => new HttpResponse(null, { status: 500 })),
    );
    const result = await AuthService.logout();
    expect(result.error).toBeDefined();
    expect(result.error?.type).toBe(ApiErrorType.Server);
  });
});

describe('AuthService.changePassword', () => {
  it('returns success with updated credentials', async () => {
    server.use(
      http.patch(`${BASE}/Auth/manage/credentials`, () =>
        HttpResponse.json({ email: 'user@test.com', isEmailConfirmed: true }),
      ),
    );
    const result = await AuthService.changePassword({
      oldPassword: 'oldPass123',
      newPassword: 'newPass456',
    });
    expect(result.error).toBeUndefined();
    expect(result.data?.email).toBe('user@test.com');
  });

  it('returns error when old password is wrong', async () => {
    server.use(
      http.patch(`${BASE}/Auth/manage/credentials`, () =>
        HttpResponse.json(
          { errors: { oldPassword: ['Неверный текущий пароль'] } },
          { status: 400 },
        ),
      ),
    );
    const result = await AuthService.changePassword({
      oldPassword: 'wrongOld',
      newPassword: 'newPass456',
    });
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('Неверный текущий пароль');
  });

  it('sends the request body with oldPassword and newPassword fields', async () => {
    let body: unknown;
    server.use(
      http.patch(`${BASE}/Auth/manage/credentials`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ email: 'u@t.com', isEmailConfirmed: true });
      }),
    );
    await AuthService.changePassword({ oldPassword: 'old1', newPassword: 'new1' });
    expect(body).toMatchObject({ oldPassword: 'old1', newPassword: 'new1' });
  });
});

describe('AuthService.registerPartner', () => {
  const validData = {
    email: 'partner@test.com',
    password: 'pass123',
    fullName: 'Иван Иванов',
    companyName: 'ООО Транспорт',
    legalAddress: 'г. Бишкек, ул. Примерная, д. 1',
  };

  it('returns success on valid registration', async () => {
    server.use(
      http.post(`${BASE}/Auth/register/partner`, () =>
        HttpResponse.json({ message: 'Registration successful', success: true }, { status: 201 }),
      ),
    );
    const result = await AuthService.registerPartner(validData);
    expect(result.error).toBeUndefined();
    expect(result.data?.success).toBe(true);
  });

  it('returns error when email is already registered', async () => {
    server.use(
      http.post(`${BASE}/Auth/register/partner`, () =>
        HttpResponse.json(
          { errors: { email: ['Email уже используется'] } },
          { status: 409 },
        ),
      ),
    );
    const result = await AuthService.registerPartner({ ...validData, email: 'taken@test.com' });
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('Email уже используется');
  });

  it('sends all required fields in request body', async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/Auth/register/partner`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ message: 'OK', success: true });
      }),
    );
    await AuthService.registerPartner(validData);
    expect(body).toMatchObject({
      email: 'partner@test.com',
      fullName: 'Иван Иванов',
      companyName: 'ООО Транспорт',
      legalAddress: 'г. Бишкек, ул. Примерная, д. 1',
    });
  });
});
