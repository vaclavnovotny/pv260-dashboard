const request = require('supertest');
process.env.DB_PATH = ':memory:';
const { resetDb } = require('../src/db');
const app = require('../index');

let courseId;

beforeEach(async () => {
  resetDb();
  const res = await request(app).post('/api/courses').send({ name: 'TestCourse' });
  courseId = res.body.id;
});

test('upload creates teams and scores', async () => {
  const res = await request(app)
    .post(`/api/courses/${courseId}/upload`)
    .send({ increment: 1, teams: [{ name: 'Alpha', points: 10 }, { name: 'Beta', points: 20 }] });
  expect(res.status).toBe(200);
  expect(res.body.upserted).toBe(2);
});

test('upload overwrites existing scores for same increment', async () => {
  await request(app)
    .post(`/api/courses/${courseId}/upload`)
    .send({ increment: 2, teams: [{ name: 'Alpha', points: 5 }] });
  const res = await request(app)
    .post(`/api/courses/${courseId}/upload`)
    .send({ increment: 2, teams: [{ name: 'Alpha', points: 99 }] });
  expect(res.status).toBe(200);
  expect(res.body.upserted).toBe(1);
});

test('upload returns 400 if increment missing', async () => {
  const res = await request(app)
    .post(`/api/courses/${courseId}/upload`)
    .send({ teams: [{ name: 'Alpha', points: 1 }] });
  expect(res.status).toBe(400);
});

test('upload returns 404 for unknown course', async () => {
  const res = await request(app)
    .post('/api/courses/9999/upload')
    .send({ increment: 1, teams: [{ name: 'X', points: 1 }] });
  expect(res.status).toBe(404);
});
