import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDb } from '../src/config/db.js';

describe('Questions API & Features', () => {
  let app;
  let studentToken;

  before(async () => {
    await initDb(true);
    app = createApp();

    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        identifier: 'ananya.iyer@university.edu',
        password: 'campus2026',
      });
    studentToken = loginRes.body.data.token;
  });

  it('GET /questions - should fetch list of questions', async () => {
    const res = await request(app).get('/questions');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 10);
  });

  it('GET /questions?subject=Physics - should filter by subject', async () => {
    const res = await request(app).get('/questions?subject=Physics');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.every((q) => q.subject === 'Physics'));
  });

  it('GET /questions?status=unanswered - should filter unanswered questions', async () => {
    const res = await request(app).get('/questions?status=unanswered');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.every((q) => q.answerCount === 0));
  });

  it('GET /questions/search - should perform keyword search', async () => {
    const res = await request(app).get('/questions/search?q=recursion');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.some((q) => q.title.toLowerCase().includes('recursion')));
  });

  it('GET /questions/similar - should identify similar questions', async () => {
    const res = await request(app).get('/questions/similar?title=How does recursion work in C language?&subject=Computer Science');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
  });

  it('GET /questions/:id - should retrieve question and increment views', async () => {
    const res = await request(app).get('/questions/q1');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.id, 'q1');
    assert.strictEqual(res.body.data.title, 'How does recursion work in C, and when does the stack overflow?');
  });

  it('POST /questions - should create a new question and route to mentors', async () => {
    const res = await request(app)
      .post('/questions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'How do virtual memory page tables work on x86?',
        description: 'I am reading about multi-level page tables and TLB caches. How does the MMU translate addresses without slow memory lookups?',
        subject: 'Computer Science',
        tags: ['OS', 'Memory', 'VirtualMemory'],
        authorId: 'u1',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.title, 'How do virtual memory page tables work on x86?');
    assert.strictEqual(res.body.data.status, 'open');
  });

  it('POST /questions/:id/urgent - should prioritize question', async () => {
    const res = await request(app)
      .post('/questions/q2/urgent')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.urgency, 'urgent');
  });

  it('POST /questions/:id/save & GET /me/saved - should bookmark questions for library', async () => {
    // Save q2
    const saveRes = await request(app)
      .post('/questions/q2/save')
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(saveRes.status, 200);

    // Fetch saved questions
    const getRes = await request(app)
      .get('/me/saved')
      .set('Authorization', `Bearer ${studentToken}`);
    assert.strictEqual(getRes.status, 200);
    assert.ok(getRes.body.data.some((q) => q.id === 'q2'));
  });

  it('GET /topics/popular - should return popular campus topics', async () => {
    const res = await request(app).get('/topics/popular');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.some((t) => t.label === 'Data Structures'));
  });
});
