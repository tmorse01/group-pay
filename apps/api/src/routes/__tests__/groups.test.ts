import { test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createApp } from '../../app.js';
import { prisma } from '../../lib/prisma.js';

let server: FastifyInstance;
let authCookies: string;
let testUserId: string;

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
  await prisma.expense.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  // Create test user and get auth cookies
  const response = await server.inject({
    method: 'POST',
    url: '/auth/register',
    payload: {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    },
  });

  authCookies = response.cookies.map((c) => `${c.name}=${c.value}`).join('; ');
  const body = JSON.parse(response.body);
  testUserId = body.user.id;
});

test('POST /groups - should create new group', async () => {
  const response = await server.inject({
    method: 'POST',
    url: '/groups',
    headers: { cookie: authCookies },
    payload: {
      name: 'Test Group',
      currency: 'USD',
    },
  });

  expect(response.statusCode).toBe(201);
  const body = JSON.parse(response.body);
  expect(body.group.name).toBe('Test Group');
  expect(body.group.currency).toBe('USD');
  expect(body.group.memberCount).toBe(1);
  expect(body.group).toHaveProperty('id');
  expect(body.group).toHaveProperty('createdAt');
});

test('POST /groups - should reject unauthenticated request', async () => {
  const response = await server.inject({
    method: 'POST',
    url: '/groups',
    payload: {
      name: 'Test Group',
      currency: 'USD',
    },
  });

  expect(response.statusCode).toBe(401);
});

test('GET /groups - should return user groups', async () => {
  // Create a group first
  await server.inject({
    method: 'POST',
    url: '/groups',
    headers: { cookie: authCookies },
    payload: {
      name: 'Test Group',
      currency: 'USD',
    },
  });

  const response = await server.inject({
    method: 'GET',
    url: '/groups',
    headers: { cookie: authCookies },
  });

  expect(response.statusCode).toBe(200);
  const body = JSON.parse(response.body);
  expect(body.groups).toHaveLength(1);
  expect(body.groups[0].name).toBe('Test Group');
  expect(body.groups[0].memberCount).toBe(1);
  expect(body.groups[0].expenseCount).toBe(0);
});

test('GET /groups/:groupId - should return group details', async () => {
  // Create a group first
  const createResponse = await server.inject({
    method: 'POST',
    url: '/groups',
    headers: { cookie: authCookies },
    payload: {
      name: 'Detailed Group',
      currency: 'USD',
    },
  });

  const createBody = JSON.parse(createResponse.body);
  const groupId = createBody.group.id;

  const response = await server.inject({
    method: 'GET',
    url: `/groups/${groupId}`,
    headers: { cookie: authCookies },
  });

  expect(response.statusCode).toBe(200);
  const body = JSON.parse(response.body);
  expect(body.group.name).toBe('Detailed Group');
  expect(body.group.members).toHaveLength(1);
  expect(body.group.members[0].role).toBe('OWNER');
  expect(body.group.members[0].user.id).toBe(testUserId);
  expect(body.group.expenses).toHaveLength(0);
});

test('GET /groups/:groupId - should return 404 for non-existent group', async () => {
  const response = await server.inject({
    method: 'GET',
    url: '/groups/550e8400-e29b-41d4-a716-446655440000',
    headers: { cookie: authCookies },
  });

  expect(response.statusCode).toBe(404);
});

test('PUT /groups/:groupId - should update group', async () => {
  // Create a group first
  const createResponse = await server.inject({
    method: 'POST',
    url: '/groups',
    headers: { cookie: authCookies },
    payload: {
      name: 'Original Name',
      currency: 'USD',
    },
  });

  const createBody = JSON.parse(createResponse.body);
  const groupId = createBody.group.id;

  // Update the group
  const response = await server.inject({
    method: 'PUT',
    url: `/groups/${groupId}`,
    headers: { cookie: authCookies },
    payload: {
      name: 'Updated Name',
      currency: 'EUR',
    },
  });

  expect(response.statusCode).toBe(200);
  const body = JSON.parse(response.body);
  expect(body.group.name).toBe('Updated Name');
  expect(body.group.currency).toBe('EUR');
});

test('POST /groups/:groupId/members - should add member to group', async () => {
  // Create another user
  await server.inject({
    method: 'POST',
    url: '/auth/register',
    payload: {
      email: 'member@example.com',
      password: 'password123',
      name: 'New Member',
    },
  });

  // Create a group
  const groupResponse = await server.inject({
    method: 'POST',
    url: '/groups',
    headers: { cookie: authCookies },
    payload: {
      name: 'Test Group',
      currency: 'USD',
    },
  });

  const groupBody = JSON.parse(groupResponse.body);
  const groupId = groupBody.group.id;

  // Add member to group
  const response = await server.inject({
    method: 'POST',
    url: `/groups/${groupId}/members`,
    headers: { cookie: authCookies },
    payload: {
      email: 'member@example.com',
    },
  });

  expect(response.statusCode).toBe(200);
  const body = JSON.parse(response.body);
  expect(body.member.role).toBe('MEMBER');
  expect(body.member.user.email).toBe('member@example.com');
});

test('POST /groups/:groupId/members - should reject adding non-existent user', async () => {
  // Create a group
  const groupResponse = await server.inject({
    method: 'POST',
    url: '/groups',
    headers: { cookie: authCookies },
    payload: {
      name: 'Test Group',
      currency: 'USD',
    },
  });

  const groupBody = JSON.parse(groupResponse.body);
  const groupId = groupBody.group.id;

  // Try to add non-existent user
  const response = await server.inject({
    method: 'POST',
    url: `/groups/${groupId}/members`,
    headers: { cookie: authCookies },
    payload: {
      email: 'nonexistent@example.com',
    },
  });

  expect(response.statusCode).toBe(404);
});

test('DELETE /groups/:groupId - should delete group (owner only)', async () => {
  // Create a group
  const createResponse = await server.inject({
    method: 'POST',
    url: '/groups',
    headers: { cookie: authCookies },
    payload: {
      name: 'Group to Delete',
      currency: 'USD',
    },
  });

  const createBody = JSON.parse(createResponse.body);
  const groupId = createBody.group.id;

  // Delete the group
  const response = await server.inject({
    method: 'DELETE',
    url: `/groups/${groupId}`,
    headers: { cookie: authCookies },
  });

  expect(response.statusCode).toBe(200);
  const body = JSON.parse(response.body);
  expect(body.success).toBe(true);

  // Verify group is deleted
  const getResponse = await server.inject({
    method: 'GET',
    url: `/groups/${groupId}`,
    headers: { cookie: authCookies },
  });

  expect(getResponse.statusCode).toBe(404);
});
