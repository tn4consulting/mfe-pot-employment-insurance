import request from 'supertest';
import { createApp } from './app';

describe('employment-insurance-bff', () => {
  const app = createApp();

  it('reports healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('rejects an application missing applicantSub', async () => {
    const res = await request(app).post('/api/applications').send({});
    expect(res.status).toBe(400);
  });

  it('creates a claim on application', async () => {
    const res = await request(app)
      .post('/api/applications')
      .send({ applicantSub: 'mock-citizen-001' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ applicantSub: 'mock-citizen-001', status: 'approved' });
  });

  it('returns 404 when there is no claim on file', async () => {
    const res = await request(app).get('/api/claims').query({ applicantSub: 'nobody' });
    expect(res.status).toBe(404);
  });

  it('returns the most recent claim for an applicant', async () => {
    const created = await request(app)
      .post('/api/applications')
      .send({ applicantSub: 'mock-citizen-002' });

    const res = await request(app).get('/api/claims').query({ applicantSub: 'mock-citizen-002' });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });

  it('rejects a report missing required fields', async () => {
    const res = await request(app).post('/api/reports').send({ claimId: 'claim-1' });
    expect(res.status).toBe(400);
  });

  it('submits a biweekly report', async () => {
    const res = await request(app).post('/api/reports').send({
      claimId: 'claim-1',
      applicantSub: 'mock-citizen-001',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-14',
      workedHours: 0,
      earnings: 0,
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ claimId: 'claim-1', applicantSub: 'mock-citizen-001' });
  });
});
