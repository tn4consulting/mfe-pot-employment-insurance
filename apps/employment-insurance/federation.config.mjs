import { withNativeFederation } from '@softarc/native-federation/config';
import {
  sharedFederationRuntimeDependency,
  sharedReactFederationDependencies,
} from '@tn4consulting/shared-federation-config/react';

// React remote -- imports the framework-agnostic core's config API, not
// the Angular wrapper's re-export. Shares react/react-dom (both exposed
// entries mount directly inside a host's own React tree) plus
// shared-federation-runtime (only `./EiReportingStatusWidget` actually
// needs this -- it's loaded via a widget-loader Context, whose identity
// has to cross the federation boundary -- but sharing it for the whole
// app is harmless and simpler than splitting shared config per expose).
//
// Only `./Component` and `./EiReportingStatusWidget` are exposed now --
// no `./RemoteProviders`. That export existed only to carry Angular DI
// providers across the federation boundary for RemoteRouteHost to apply
// via a child EnvironmentInjector. A React remote has no DI tree for a
// host to populate -- both exposed components do all of their own setup
// on mount instead (see App.tsx and ReportingStatus.tsx).
export default withNativeFederation({
  name: 'employment-insurance',

  exposes: {
    './Component': './apps/employment-insurance/src/app/App.tsx',
    './EiReportingStatusWidget': './apps/employment-insurance/src/app/ReportingStatus.tsx',
  },

  shared: {
    ...sharedReactFederationDependencies,
    ...sharedFederationRuntimeDependency,
  },
});
