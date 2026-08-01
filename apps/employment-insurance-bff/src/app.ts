import cors from 'cors';
import express, { Express } from 'express';
import { createClaim, createReport, getClaim } from './data';

/**
 * Employment Insurance's own dedicated backend -- realistic shape for a
 * distinct bounded context (applications, claim status, biweekly
 * reporting). See CLAUDE.md's "Backends: BFF pattern" section.
 */
export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/applications', (req, res) => {
    const { applicantSub } = req.body as { applicantSub?: string };
    if (!applicantSub) {
      res.status(400).json({ error: 'applicantSub is required' });
      return;
    }
    res.status(201).json(createClaim(applicantSub));
  });

  app.get('/api/claims', (req, res) => {
    const applicantSub = req.query['applicantSub'];
    if (typeof applicantSub !== 'string') {
      res.status(400).json({ error: 'applicantSub query parameter is required' });
      return;
    }
    const claim = getClaim(applicantSub);
    if (!claim) {
      res.status(404).json({ error: 'No claim on file' });
      return;
    }
    res.json(claim);
  });

  app.post('/api/reports', (req, res) => {
    const { claimId, applicantSub, periodStart, periodEnd, workedHours, earnings } = req.body as {
      claimId?: string;
      applicantSub?: string;
      periodStart?: string;
      periodEnd?: string;
      workedHours?: number;
      earnings?: number;
    };
    if (!claimId || !applicantSub || !periodStart || !periodEnd) {
      res
        .status(400)
        .json({ error: 'claimId, applicantSub, periodStart, and periodEnd are required' });
      return;
    }
    res
      .status(201)
      .json(
        createReport(claimId, applicantSub, periodStart, periodEnd, workedHours ?? 0, earnings ?? 0),
      );
  });

  return app;
}
