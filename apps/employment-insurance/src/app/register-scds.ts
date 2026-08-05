// Registers the SCDS custom elements (ScdsCard) once, as a side effect --
// same pattern as job-bank's own register-scds.ts. Stencil's own loader
// guards against double-registering (customElements.get(tag) ||
// customElements.define(...)), so importing this from multiple entry
// points (this app's own bootstrap.tsx, and the federation-exposed
// ./EiReportingStatusWidget which also renders scds-card) is harmless.
import { defineCustomElements } from '@tn4consulting/shared-ui-scds-core/loader';

defineCustomElements();
