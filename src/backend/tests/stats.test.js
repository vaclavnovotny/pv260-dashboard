const request = require('supertest');
process.env.DB_PATH = ':memory:';
const { resetDb } = require('../src/db');
const app = require('../index');

let courseId;

beforeEach(async () => {
  resetDb();
  const res = await request(app).post('/api/courses').send({ name: 'StatsCourse' });
  courseId = res.body.id;
  await request(app).post(`/api/courses/${courseId}/upload`).send({
    increment: 1, teams: [{ name: 'A', points: 10 }, { name: 'B', points: 20 }]
  });
  await request(app).post(`/api/courses/${courseId}/upload`).send({
    increment: 2, teams: [{ name: 'A', points: 30 }, { name: 'B', points: 5 }]
  });
});

test('stats returns correct increments list', async () => {
  const res = await request(app).get(`/api/courses/${courseId}/stats`);
  expect(res.status).toBe(200);
  expect(res.body.increments).toEqual([1, 2]);
});

test('stats returns team scores by increment', async () => {
  const res = await request(app).get(`/api/courses/${courseId}/stats`);
  const teamA = res.body.teams.find(t => t.name === 'A');
  expect(teamA.scores['1']).toBe(10);
  expect(teamA.scores['2']).toBe(30);
  expect(teamA.total).toBe(40);
});

test('stats returns global totals per increment', async () => {
  const res = await request(app).get(`/api/courses/${courseId}/stats`);
  expect(res.body.global['1']).toBe(30); // 10 + 20
  expect(res.body.global['2']).toBe(35); // 30 + 5
});

test('stats returns 404 for unknown course', async () => {
  const res = await request(app).get('/api/courses/9999/stats');
  expect(res.status).toBe(404);
});

test('stats returns empty data for course with no uploads', async () => {
  const res2 = await request(app).post('/api/courses').send({ name: 'EmptyCourse' });
  const res = await request(app).get(`/api/courses/${res2.body.id}/stats`);
  expect(res.status).toBe(200);
  expect(res.body.increments).toEqual([]);
  expect(res.body.teams).toEqual([]);
  expect(res.body.global).toEqual({});
});
