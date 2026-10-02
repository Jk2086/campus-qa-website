import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDb } from '../src/config/db.js';

describe('Authentication & User Management APIs', () => {
  let app;

  before(async () => {
    await initDb(true);
    app = createApp();
  });

  it('POST /auth/login - should authenticate with email and password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        identifier: 'ananya.iyer@university.edu',
        password: 'campus2026',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.email, 'ananya.iyer@university.edu');
    assert.ok(res.body.data.token, 'Token should be returned');
  });

  it('POST /auth/login - should authenticate with studentId', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        identifier: 'CS22B041',
        password: 'campus2026',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.id, 'u1');
  });

  it('POST /auth/login - should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        identifier: 'ananya.iyer@university.edu',
        password: 'wrongpassword',
      });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /auth/register - should create a new student account', async () => {
    const uniqueEmail = `newstudent_${Date.now()}@university.edu`;
    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Tara Sharma',
        email: uniqueEmail,
        studentId: `ST${Date.now().toString().slice(-6)}`,
        password: 'securepassword123',
        role: 'student',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.name, 'Tara Sharma');
    assert.strictEqual(res.body.data.role, 'student');
    assert.ok(res.body.data.token);
  });

  it('POST /auth/demo-login - should provide instant demo login for hackathon walkthrough', async () => {
    const res = await request(app)
      .post('/auth/demo-login')
      .send({ role: 'mentor' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.role, 'mentor');
    assert.ok(res.body.data.token);
  });

  it('GET /auth/me - should reject unauthenticated requests', async () => {
    const res = await request(app).get('/auth/me');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('GET /auth/me - should return profile for authenticated user', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        identifier: 'ananya.iyer@university.edu',
        password: 'campus2026',
      });

    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.body.success, true);
    assert.strictEqual(meRes.body.data.email, 'ananya.iyer@university.edu');
  });

  it('GET /users - should list users with role and department details', async () => {
    const res = await request(app).get('/users?role=mentor');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.every((u) => u.role === 'mentor'));
    assert.ok(res.body.data[0].department);
  });

  it('GET /users/:id - should fetch a specific user profile', async () => {
    const res = await request(app).get('/users/u2');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.id, 'u2');
    assert.strictEqual(res.body.data.role, 'faculty');
  });

  it('PATCH /users/:id/availability - should update availability status', async () => {
    const res = await request(app)
      .patch('/users/u3/availability')
      .send({ availability: 'busy' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.availability, 'busy');
  });
});
