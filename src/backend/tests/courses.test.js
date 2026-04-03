const request = require('supertest');
process.env.DB_PATH = ':memory:';
const { resetDb } = require('../src/db');
const app = require('../index');

beforeEach(() => {
  resetDb();
});

describe('Courses API', () => {
  test('GET /api/courses returns empty array initially', async () => {
    const res = await request(app).get('/api/courses');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('POST /api/courses creates a course', async () => {
    const res = await request(app)
      .post('/api/courses')
      .send({ name: 'PV260' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: expect.any(Number), name: 'PV260' });
  });

  test('POST /api/courses duplicate returns 409', async () => {
    await request(app).post('/api/courses').send({ name: 'PV999' });
    const res = await request(app).post('/api/courses').send({ name: 'PV999' });
    expect(res.status).toBe(409);
  });

  test('POST /api/courses missing name returns 400', async () => {
    const res = await request(app).post('/api/courses').send({});
    expect(res.status).toBe(400);
  });
});
