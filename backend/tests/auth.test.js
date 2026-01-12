// =====================================================
// API Tests - Authentication Routes
// =====================================================

const request = require('supertest');
const app = require('../src/server');

describe('Authentication API', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'superadmin@wevote.com',
          password: 'super123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', 'superadmin@wevote.com');
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'superadmin@wevote.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'super123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register new user with valid data', async () => {
      const randomEmail = `test${Date.now()}@example.com`;
      
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: randomEmail,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          phoneNumber: '+1234567890'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', randomEmail);
    });

    it('should reject duplicate email', async () => {
      const email = 'duplicate@example.com';
      
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      // Second registration with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'password123',
          firstName: 'Test2',
          lastName: 'User2'
        });

      expect(res.statusCode).toBe(409);
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'superadmin@wevote.com',
          password: 'super123'
        });

      token = res.body.token;
    });

    it('should get current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('user');
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toBe(401);
    });
  });
});

describe('Health Check', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/health');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('timestamp');
  });
});
