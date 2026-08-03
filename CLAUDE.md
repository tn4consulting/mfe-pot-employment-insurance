# mfe-pot-employment-insurance

## What this is

The **EI application, claim status, and EI reporting** frontend for the mfe-pot Government of Canada MFE proof-of-technology. Federated as a remote into `mfe-pot-shell`. The second app extracted from the platform repo, following job-bank's proven recipe.

**This repo doesn't carry its own architecture doc.** Full rationale — bilingual/WCAG/GCDS requirements, the Native Federation setup, the federation-sharing policy, security model, i18n mechanism, the BFF pattern, hosting/Helm pattern, and every non-obvious gotcha behind the code in this repo — lives in **`../mfe-pot-platform/CLAUDE.md`**. Read it before making any architectural change here; this file only covers what's specific to this repo. See `../CLAUDE.md` (the `mfe-pot` meta repo) for the full 6-repo map.

## What's in this repo

- `apps/employment-insurance` — the frontend, federated on port `4204` in local dev.
- `apps/employment-insurance-bff` — this app's dedicated BFF (port `3002`), plain Express/TypeScript, routes carry the `/api` prefix internally (`/api/applications`, `/api/claims`, `/api/reports`, `/health` at root).
- `libs/feature-claims`, `libs/feature-reporting`, `libs/feature-applications` — the real component/business logic. `libs/data-access` — `EmploymentInsuranceApiClient`.
- `charts/employment-insurance` — deploys the frontend+BFF pair as one Helm release, following job-bank's chart shape exactly (this app had no Dockerfile or chart yet in the platform repo before extraction — both were authored fresh here).

Depends on published packages from GitHub Packages: `@tn4consulting/shared-auth`, `shared-content-client`, `shared-federation-config`, `shared-i18n`, `shared-runtime-config` (pinned in `package.json`; keep in sync with `platform-versions.json` in `mfe-pot-platform`).

## Repo-specific things worth knowing

- **`App` (`apps/employment-insurance/src/app/app.ts`) renders a CMS-driven intro block** (`employment-insurance.intro` key, fetched via `ContentClient` -- `content-client.token.ts`, same pattern as `mfe-pot-dashboard`'s own `content-client.token.ts`) above the `feature-applications`/`feature-claims`/`feature-reporting` sections, re-fetched on cross-remote locale change. `runtime-config.ts`'s `strapiBaseUrl` points at `mfe-pot-platform`'s `charts/strapi` in a real deployment (`http://cms.mfe-pot.local`, browser-to-server, not in-cluster Service DNS). The feature libraries' own section headings/buttons/status text are still hardcoded English (not yet Transloco- or CMS-driven) -- a separate, pre-existing gap, not touched by this.

- **`tsconfig.base.json` explicitly sets `"types": ["node"]`** — a defensive fix for a gotcha found during this app's own extraction: TypeScript's implicit `@types` auto-inclusion silently failed to pick up `@types/node` when `ts-node` compiled `jest.config.cts` through the plain `tsconfig.json` (root cause never fully isolated — likely an interaction between TS's auto-inclusion and pnpm's symlinked `node_modules/@types` layout under `moduleResolution: "bundler"`). Don't remove this line without confirming the underlying TS/pnpm interaction is actually fixed upstream.
- **`.tool-versions` and `pnpm-workspace.yaml` matter more than they look**: this repo's own extraction briefly lost both in a copy-paste from job-bank's file list, which silently fell back to the global default Node (22.7.0) and reproduced the exact `"require() of ES Module ... not supported"` error the platform CLAUDE.md documents as a Node<22.12 symptom — a real error pointing at the wrong root cause. If a build here ever throws that error, check these two files exist and are correct before chasing a native-federation/ESM theory.
- **`dashboardBffBaseUrl`-style same-origin pattern**: `runtime-config.ts`'s `employmentInsuranceBffBaseUrl` dev default is `http://localhost:3002`; the chart overrides it to `/api` — same-origin Ingress path rule, not a second hostname.
- **CI** (`.github/workflows/ci.yml`): lint/test/build (including `employment-insurance-bff`'s separately-run `eslint:lint` target), then builds both images, spins up an ephemeral `kind` cluster, `helm install`s this chart, and curls the Ingress-routed hostname to confirm it serves. See `README.md` for local install/serve/build/Docker/Helm instructions.

## Renovate

`renovate.json` extends `github>tn4consulting/mfe-pot-platform` — the shared preset (groups `@angular/*`, `@schematics/angular`, `listr2` into one coordinated pinned bump). Don't hand-roll Angular version bumps here independently of the other 5 repos; `platform-versions.json` in `mfe-pot-platform` is the source of truth for what version they should all be on.
