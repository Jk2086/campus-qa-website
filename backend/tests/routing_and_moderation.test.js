import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDb } from '../src/config/db.js';

describe('Mentor Routing, Moderation & Global Search APIs', () => {
  let app;
  let adminToken;
  let studentToken;

  before(async () => {
    await initDb(true);
    app = createApp();

    // Login admin u8
    const aLogin = await request(app)
      .post('/auth/login')
      .send({
        identifier: 'moderation@university.edu',
        password: 'campus2026',
      });
    adminToken = aLogin.body.data.token;

    // Login student u1
    const sLogin = await request(app)
      .post('/auth/login')
      .send({
        identifier: 'ananya.iyer@university.edu',
        password: 'campus2026',
      });
    studentToken = sLogin.body.data.token;
  });

  it('GET /mentors - should return mentors with hydrated user details', async () => {
    const res = await request(app).get('/mentors');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 4);
    assert.ok(res.body.data[0].user.name);
    assert.ok(res.body.data[0].expertise);
  });

  it('GET /mentors/:id - should return single mentor profile', async () => {
    const res = await request(app).get('/mentors/m1');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.id, 'm1');
    assert.strictEqual(res.body.data.user.name, 'Dr. Meera Raghavan');
  });

  it('GET /mentors/route - should find mentors matching subject and topic', async () => {
    const res = await request(app).get('/mentors/route?subject=Computer Science&topic=Data Structures');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.some((m) => m.expertise.includes('Computer Science')));
  });

  it('POST /reports - should submit content for moderation', async () => {
    const res = await request(app)
      .post('/reports')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        contentId: 'q2',
        contentType: 'question',
        excerpt: 'How do I calculate electric field...',
        reason: 'Duplicate question posted in the same subject',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'pending');
  });

  it('GET /admin/reports - should return moderation queue for admin', async () => {
    const res = await request(app)
      .get('/admin/reports')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 4);
  });

  it('PUT /admin/reports/:id - should update report status and log action', async () => {
    const res = await request(app)
      .put('/admin/reports/rep1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'dismissed',
        actionTaken: 'Verified to be distinct from existing question.',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.status, 'dismissed');

    // Verify audit logs
    const logsRes = await request(app)
      .get('/moderation/logs')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(logsRes.status, 200);
    assert.ok(logsRes.body.data.some((l) => l.report_id === 'rep1'));
  });

  it('GET /search - should perform unified search across questions, mentors, resources, and knowledge', async () => {
    const res = await request(app).get('/search?q=Library');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.results);
    assert.ok(res.body.data.results.resources.length > 0);
  });

  it('GET /notifications & PUT /notifications/:id/read - should manage user notifications', async () => {
    const listRes = await request(app)
      .get('/notifications?userId=u1')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(listRes.status, 200);
    assert.ok(Array.isArray(listRes.body.data));
    assert.ok(listRes.body.data.length > 0);

    const firstId = listRes.body.data[0].id;
    const readRes = await request(app)
      .put(`/notifications/${firstId}/read`)
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(readRes.status, 200);
    assert.strictEqual(readRes.body.data.read, true);
  });
});
