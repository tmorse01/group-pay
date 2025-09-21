import { test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createApp } from '../../app.js';
import { prisma } from '../../lib/prisma.js';

let server: FastifyInstance;

beforeAll(async () => {
  server = await createApp();
  await server.ready();
});

afterAll(async () => {
  await prisma.$disconnect();
  await server.close();
});

beforeEach(async () => {
  // Clean up database before each test
  await prisma.user.deleteMany();
});

test('POST /auth/register - should create new user', async () => {
  const userData = {
    email: 'test@example.com',
    password: 'securepassword123',
    name: 'Test User',
  };

  const response = await server.inject({
    method: 'POST',
    url: '/auth/register',
    payload: userData,
  });

  expect(response.statusCode).toBe(201);
  const body = JSON.parse(response.body);

  expect(body.user).toHaveProperty('id');
  expect(body.user.email).toBe(userData.email);
  expect(body.user.name).toBe(userData.name);
  expect(body.user).toHaveProperty('createdAt');

  // Should set cookies
  const cookies = response.cookies;
  expect(cookies).toHaveLength(2);

  const accessTokenCookie = cookies.find((c) => c.name === 'accessToken');
  const refreshTokenCookie = cookies.find((c) => c.name === 'refreshToken');

  expect(accessTokenCookie).toBeDefined();
  expect(refreshTokenCookie).toBeDefined();
  expect(accessTokenCookie?.httpOnly).toBe(true);
  expect(refreshTokenCookie?.httpOnly).toBe(true);
});

test('POST /auth/register - should reject duplicate email', async () => {
  const userData = {
    email: 'duplicate@example.com',
    password: 'password123',
    name: 'User One',
  };

  // Create first user
  await server.inject({
    method: 'POST',
    url: '/auth/register',
    payload: userData,
  });

  // Try to create duplicate
  const response = await server.inject({
    method: 'POST',
    url: '/auth/register',
    payload: userData,
  });

  expect(response.statusCode).toBe(400);
  const body = JSON.parse(response.body);
  expect(body.code).toBe('VALIDATION_ERROR');
});

test('POST /auth/login - should authenticate user', async () => {
  const userData = {
    email: 'login@example.com',
    password: 'password123',
    name: 'Login User',
  };

  // First register user
  await server.inject({
    method: 'POST',
    url: '/auth/register',
    payload: userData,
  });

  // Then login
  const response = await server.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: userData.email,
      password: userData.password,
    },
  });

  expect(response.statusCode).toBe(200);
  const body = JSON.parse(response.body);
  expect(body.user.email).toBe(userData.email);
  expect(body.user.name).toBe(userData.name);

  // Should set cookies
  const cookies = response.cookies;
  expect(cookies).toHaveLength(2);
  expect(cookies.some((c) => c.name === 'accessToken')).toBe(true);
  expect(cookies.some((c) => c.name === 'refreshToken')).toBe(true);
});

test('POST /auth/login - should reject invalid credentials', async () => {
  const response = await server.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: 'nonexistent@example.com',
      password: 'wrongpassword',
    },
  });

  expect(response.statusCode).toBe(401);
  const body = JSON.parse(response.body);
  expect(body.code).toBe('UNAUTHORIZED');
});

test('GET /auth/me - should return current user', async () => {
  const userData = {
    email: 'me@example.com',
    password: 'password123',
    name: 'Me User',
  };

  // Register and get cookies
  const registerResponse = await server.inject({
    method: 'POST',
    url: '/auth/register',
    payload: userData,
  });

  const cookies = registerResponse.cookies
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  // Call /me endpoint
  const response = await server.inject({
    method: 'GET',
    url: '/auth/me',
    headers: {
      cookie: cookies,
    },
  });

  expect(response.statusCode).toBe(200);
  const body = JSON.parse(response.body);
  expect(body.user.email).toBe(userData.email);
  expect(body.user.name).toBe(userData.name);
});

test('GET /auth/me - should reject unauthenticated request', async () => {
  const response = await server.inject({
    method: 'GET',
    url: '/auth/me',
  });

  expect(response.statusCode).toBe(401);
  const body = JSON.parse(response.body);
  expect(body.code).toBe('UNAUTHORIZED');
});

test('POST /auth/refresh - should refresh access token', async () => {
  const userData = {
    email: 'refresh@example.com',
    password: 'password123',
    name: 'Refresh User',
  };

  // Register and get cookies
  const registerResponse = await server.inject({
    method: 'POST',
    url: '/auth/register',
    payload: userData,
  });

  const refreshTokenCookie = registerResponse.cookies.find(
    (c) => c.name === 'refreshToken'
  );

  expect(refreshTokenCookie).toBeDefined();

  // Call refresh endpoint
  const response = await server.inject({
    method: 'POST',
    url: '/auth/refresh',
    headers: {
      cookie: `refreshToken=${refreshTokenCookie!.value}`,
    },
  });

  expect(response.statusCode).toBe(200);
  const body = JSON.parse(response.body);
  expect(body.success).toBe(true);

  // Should set new access token cookie
  const cookies = response.cookies;
  expect(cookies.some((c) => c.name === 'accessToken')).toBe(true);
});

test('POST /auth/logout - should clear cookies', async () => {
  const response = await server.inject({
    method: 'POST',
    url: '/auth/logout',
  });

  expect(response.statusCode).toBe(200);
  const body = JSON.parse(response.body);
  expect(body.success).toBe(true);

  // Should clear cookies (set to empty value)
  const cookies = response.cookies;
  expect(cookies).toHaveLength(2);
  expect(cookies.every((c) => c.value === '')).toBe(true);
});
