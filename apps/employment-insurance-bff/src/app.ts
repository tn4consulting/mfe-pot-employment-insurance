import cors from 'cors';
import express, { Express } from 'express';
import { sessionCache } from './config';
import { createClaim, createReport, getClaim, getReports } from './data';
import { computeReportingStatus } from './reporting-status';

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

  app.post('/api/applications', async (req, res) => {
    const { applicantSub } = req.body as { applicantSub?: string };
    if (!applicantSub) {
      res.status(400).json({ error: 'applicantSub is required' });
      return;
    }
    res.status(201).json(await createClaim(applicantSub));
  });

  app.get('/api/claims', async (req, res) => {
    const applicantSub = req.query['applicantSub'];
    if (typeof applicantSub !== 'string') {
      res.status(400).json({ error: 'applicantSub query parameter is required' });
      return;
    }
    const claim = await getClaim(applicantSub);
    if (!claim) {
      res.status(404).json({ error: 'No claim on file' });
      return;
    }
    res.json(claim);
  });

  app.get('/api/reporting-status', async (req, res) => {
    const applicantSub = req.query['applicantSub'];
    if (typeof applicantSub !== 'string') {
      res.status(400).json({ error: 'applicantSub query parameter is required' });
      return;
    }
    const claim = await getClaim(applicantSub);
    if (!claim) {
      res.status(404).json({ error: 'No claim on file' });
      return;
    }
    res.json(computeReportingStatus(claim, await getReports(claim.id)));
  });

  app.post('/api/reports', async (req, res) => {
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
        await createReport(claimId, applicantSub, periodStart, periodEnd, workedHours ?? 0, earnings ?? 0),
      );
  });

  // PoT-only, no auth -- unlocks a repeatable `pnpm demo:reset` (see
  // mfe-pot/TODO.md) by clearing this BFF's own Redis-backed state between
  // local/CI runs and live demos.
  app.post('/api/reset', async (_req, res) => {
    await sessionCache.reset();
    res.status(204).send();
  });

  return app;
}
