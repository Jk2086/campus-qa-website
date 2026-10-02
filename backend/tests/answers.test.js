import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDb } from '../src/config/db.js';

describe('Answers, Voting, Acceptance & Faculty Verification APIs', () => {
  let app;
  let studentToken;
  let facultyToken;

  before(async () => {
    await initDb(true);
    app = createApp();

    // Login student u1 (owner of q1)
    const sLogin = await request(app)
      .post('/auth/login')
      .send({
        identifier: 'ananya.iyer@university.edu',
        password: 'campus2026',
      });
    studentToken = sLogin.body.data.token;

    // Login faculty u2
    const fLogin = await request(app)
      .post('/auth/login')
      .send({
        identifier: 'meera.raghavan@university.edu',
        password: 'campus2026',
      });
    facultyToken = fLogin.body.data.token;
  });

  it('GET /questions/:id/answers - should retrieve answers for a question', async () => {
    const res = await request(app).get('/questions/q1/answers');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.strictEqual(res.body.data[0].id, 'a1');
    assert.strictEqual(res.body.data[0].isAccepted, true);
    assert.ok(Array.isArray(res.body.data[0].replies));
  });

  it('POST /questions/:id/answers - should create a new answer and update question count', async () => {
    const res = await request(app)
      .post('/questions/q2/answers')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        content: 'Use Coulomb’s constant k ≈ 8.99 × 10^9 N·m²/C². Remember that electric field vectors point radially outward for positive charges and radially inward for negative charges.',
        authorId: 'u1',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.questionId, 'q2');
    assert.strictEqual(res.body.data.isAccepted, false);

    // Verify question answer count incremented
    const qRes = await request(app).get('/questions/q2');
    assert.strictEqual(qRes.body.data.answerCount, 2);
  });

  it('POST /votes - should vote on content and toggle duplicate vote', async () => {
    // Upvote answer a2
    const vote1 = await request(app)
      .post('/votes')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        contentId: 'a2',
        contentType: 'answer',
        voteType: 1,
      });

    assert.strictEqual(vote1.status, 200);
    assert.strictEqual(vote1.body.data.myVote, 1);
    const initialUpvotes = vote1.body.data.upvotes;

    // Repeated upvote by same user toggles off
    const vote2 = await request(app)
      .post('/votes')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        contentId: 'a2',
        contentType: 'answer',
        voteType: 1,
      });

    assert.strictEqual(vote2.status, 200);
    assert.strictEqual(vote2.body.data.myVote, undefined);
    assert.strictEqual(vote2.body.data.upvotes, initialUpvotes - 1);
  });

  it('POST /answers/:id/accept - should allow question owner to accept answer and award reputation', async () => {
    // q1 is owned by u1 (studentToken). Accept a2.
    const res = await request(app)
      .post('/answers/a2/accept')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        questionId: 'q1',
        requesterId: 'u1',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.isAccepted, true);

    // Question status should now be solved
    const qRes = await request(app).get('/questions/q1');
    assert.strictEqual(qRes.body.data.status, 'solved');
  });

  it('POST /answers/:id/verify - should allow faculty to verify an answer', async () => {
    const res = await request(app)
      .post('/answers/a6/verify')
      .set('Authorization', `Bearer ${facultyToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.isVerified, true);
    assert.strictEqual(res.body.data.answerType, 'FACULTY_VERIFIED');
  });

  it('POST /answers/:id/verify - should reject student attempts to verify answers', async () => {
    const res = await request(app)
      .post('/answers/a6/verify')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /answers/:id/unverify - should allow faculty to unverify an answer', async () => {
    const res = await request(app)
      .post('/answers/a6/unverify')
      .set('Authorization', `Bearer ${facultyToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.isVerified, false);
    assert.strictEqual(res.body.data.answerType, 'PEER_ANSWER');
  });

  it('POST /answers/:id/unverify - should reject student attempt to unverify answer', async () => {
    const res = await request(app)
      .post('/answers/a6/unverify')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /answers/:id/replies - should add a threaded reply to an answer', async () => {
    const res = await request(app)
      .post('/answers/a1/replies')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        authorId: 'u1',
        content: 'Does tail recursion optimization apply with GCC -O2 automatically?',
      });

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.replies.some((r) => r.content.includes('tail recursion optimization')));
  });
});
