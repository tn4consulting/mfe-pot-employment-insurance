import { share, withNativeFederation } from '@softarc/native-federation/config';
import {
  sharedFederationRuntimeDependency,
  sharedReactFederationDependencies,
  sharedUiScdsCoreFederationDependency,
} from '@tn4consulting/shared-federation-config/react';

// TEMP LOCAL ADDITION (not yet in the published shared-federation-config):
// register-scds.ts imports `defineCustomElements` from the Stencil-generated
// '@tn4consulting/shared-ui-scds-core/loader' subpath, not just the bare
// package -- but sharedUiScdsCoreFederationDependency's
// `includeSecondaries: false` (deliberately set to dodge the same
// jsx-runtime-style auto-discovery bug documented in
// shared-federation-config/react.js) means only the bare specifier is in
// the shared import map, so this subpath was never resolvable ("Unable to
// resolve specifier '@tn4consulting/shared-ui-scds-core/loader'") --
// confirmed live against dashboard's identical setup: its federated
// `./Component` failed to load entirely (RemoteErrorBoundary fallback)
// until this was added. Same fix as job-bank's/dashboard's
// federation.config.mjs, until this can be folded into the published
// package properly.
const sharedUiScdsCoreLoader = share({
  '@tn4consulting/shared-ui-scds-core/loader': {
    singleton: true,
    strictVersion: true,
    requiredVersion: 'auto',
    includeSecondaries: false,
  },
});

// React remote -- imports the framework-agnostic core's config API, not
// the Angular wrapper's re-export. Shares react/react-dom (both exposed
// entries mount directly inside a host's own React tree) plus
// shared-federation-runtime (only `./EiReportingStatusWidget` actually
// needs this -- it's loaded via a widget-loader Context, whose identity
// has to cross the federation boundary -- but sharing it for the whole
// app is harmless and simpler than splitting shared config per expose)
// plus shared-ui-scds-core (this app renders `scds-card` directly in
// Applications.tsx/Claims.tsx/ReportingStatus.tsx -- GCDS has been
// removed from the family entirely, closing a real pre-existing gap: this
// app never shared either design-system singleton despite rendering one
// directly).
//
// Only `./Component` and `./EiReportingStatusWidget` are exposed now --
// no `./RemoteProviders`. That export existed only to carry Angular DI
// providers across the federation boundary for RemoteRouteHost to apply
// via a child EnvironmentInjector. A React remote has no DI tree for a
// host to populate -- both exposed components do all of their own setup
// on mount instead (see App.tsx and ReportingStatus.tsx).
export default withNativeFederation({
  name: 'employment-insurance-mfe',

  exposes: {
    './Component': './apps/employment-insurance-mfe/src/app/App.tsx',
    './EiReportingStatusWidget': './apps/employment-insurance-mfe/src/app/ReportingStatus.tsx',
  },

  shared: {
    ...sharedReactFederationDependencies,
    ...sharedFederationRuntimeDependency,
    ...sharedUiScdsCoreFederationDependency,
    ...sharedUiScdsCoreLoader,
  },
});
