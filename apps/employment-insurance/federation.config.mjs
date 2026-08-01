import { withNativeFederation } from '@angular-architects/native-federation/config';
import {
  sharedFederationDependencies,
  sharedFederationFeatures,
  sharedFederationSkip,
} from '@tn4consulting/shared-federation-config';

export default withNativeFederation({
  name: 'employment-insurance',

  exposes: {
    './Component': './apps/employment-insurance/src/app/app.ts',
    './RemoteProviders': './apps/employment-insurance/src/app/remote-providers.ts',
  },

  shared: sharedFederationDependencies,
  skip: sharedFederationSkip,

  // Please read our FAQ about sharing libs:
  // https://shorturl.at/jmzH0

  features: sharedFederationFeatures,
});
