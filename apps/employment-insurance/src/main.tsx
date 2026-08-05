// es-module-shims itself is loaded via a plain classic <script> tag in
// index.html, not imported here -- it has to already be active before this
// module (loaded via <script type="module-shim">) is even parsed. See
// index.html and build.mjs/serve.mjs for the rest of the wiring.
import { initFederation } from '@softarc/native-federation-orchestrator';

initFederation({ 'employment-insurance': './remoteEntry.json' })
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error(err));
