import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

// Simple mockup of the app for a basic health check test
const app = express();
app.get('/health', (req, res) => res.json({ status: 'ok' }));

describe('Backend API Tests', () => {
    it('should return a 200 OK on a health check route', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'ok' });
    });
});
