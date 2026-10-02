import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDb } from '../src/config/db.js';

describe('Campus AI Assistant & Answer-Guide-Connect Pipeline', () => {
  let app;

  before(async () => {
    await initDb(true);
    app = createApp();
  });

  it('POST /ai/hint - should return guided hint for a question', async () => {
    const res = await request(app)
      .post('/ai/hint')
      .send({ questionId: 'q1' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.hint);
    assert.ok(typeof res.body.data.hint === 'string');
  });

  it('POST /ai/explain - should return concept walkthrough', async () => {
    const res = await request(app)
      .post('/ai/explain')
      .send({ questionId: 'q1' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.explanation.includes('Concept walkthrough'));
  });

  it('POST /ai/similar-questions - should return related questions', async () => {
    const res = await request(app)
      .post('/ai/similar-questions')
      .send({ questionId: 'q1' });

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  it('POST /ai/query - Simple Academic Doubt returns immediate direct answer', async () => {
    const res = await request(app)
      .post('/ai/query')
      .send({ query: 'What is photosynthesis?', subject: 'Biology' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.category, 'SIMPLE_DOUBT');
    assert.ok(res.body.data.answer.toLowerCase().includes('photosynthesis'));
  });

  it('POST /ai/query - Campus Navigation queries database campus resources without fabricating', async () => {
    const res = await request(app)
      .post('/ai/query')
      .send({ query: 'Where do I submit my project proposal?', subject: 'Academic Affairs' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.category, 'CAMPUS_NAVIGATION');
    assert.ok(res.body.data.resource);
    assert.ok(res.body.data.answer.includes('Room 310') || res.body.data.answer.includes('Project'));
  });

  it('POST /ai/query - Task Guidance returns structured steps from database workflow', async () => {
    const res = await request(app)
      .post('/ai/query')
      .send({ query: 'What do I need to do for project submission?', subject: 'Academic Affairs' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.category, 'TASK_GUIDANCE');
    assert.ok(res.body.data.answer.includes('1.'));
    assert.ok(res.body.data.task);
  });

  it('POST /ai/query - Complex Doubt returns AI_UNCERTAIN with hints and routes to mentors', async () => {
    const res = await request(app)
      .post('/ai/query')
      .send({
        query: 'How can I rigorously prove the convergence rate of stochastic gradient descent with non-convex loss surfaces?',
        subject: 'Computer Science',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.status, 'AI_UNCERTAIN');
    assert.strictEqual(res.body.data.canRequestHumanHelp, true);
    assert.ok(Array.isArray(res.body.data.recommendedMentors));
    assert.ok(res.body.data.recommendedMentors.length > 0);
  });

  it('POST /ai/query - Campus Navigation fallback when resource does not exist', async () => {
    const res = await request(app)
      .post('/ai/query')
      .send({ query: 'Where is the secret subterranean observatory venue room?', subject: 'Physics' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.status, 'AI_UNCERTAIN');
    assert.ok(res.body.data.answer.includes("couldn't find this information in the campus directory"));
  });

  it('POST /ai/chat - Situation A (Simple Academic Doubt) returns direct concise answer', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .send({ prompt: 'What is photosynthesis?' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.situation, 'simple_academic');
    assert.strictEqual(res.body.data.responseType, 'quick');
    assert.strictEqual(res.body.data.badgeLabel, '⚡ Quick Answer');
    assert.ok(res.body.data.text.includes('Photosynthesis'));
  });

  it('POST /ai/chat - Situation C (Campus Navigation) returns verified resource', async () => {
    const res = await request(app)
      .post('/ai/chat')
      .send({ prompt: 'Where do I submit my capstone project proposal?' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.situation, 'campus_navigation');
    assert.strictEqual(res.body.data.responseType, 'campus_guidance');
    assert.strictEqual(res.body.data.badgeLabel, '🧭 Campus Guidance');
    assert.ok(res.body.data.campusResource);
    assert.ok(res.body.data.text.includes('Location'));
  });

  it('POST /ai/chat - Situation D (Task Guidance) returns actionable workflow checklist', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .send({ prompt: 'What should I do next for project submission?' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.situation, 'task_guidance');
    assert.strictEqual(res.body.data.responseType, 'task_guidance');
    assert.strictEqual(res.body.data.badgeLabel, '📋 Task Guidance');
    assert.ok(res.body.data.taskGuidance);
    assert.ok(Array.isArray(res.body.data.taskGuidance.steps));
  });

  it('POST /ai/chat - Situation B (Complex/Uncertain) returns concept and routes to mentor', async () => {
    const res = await request(app)
      .post('/ai/chat')
      .send({
        prompt: 'How does steric hindrance influence the aldol condensation enolate pathway?',
        context: { subject: 'Chemistry' },
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.situation, 'complex_uncertain');
    assert.strictEqual(res.body.data.responseType, 'ai_uncertain');
    assert.strictEqual(res.body.data.canRequestHumanHelp, true);
    assert.ok(res.body.data.recommendedMentor);
    assert.ok(res.body.data.recommendedFaculty);
  });
});
