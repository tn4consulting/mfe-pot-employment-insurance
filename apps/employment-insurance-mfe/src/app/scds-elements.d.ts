import type { DetailedHTMLProps, HTMLAttributes } from 'react';

/**
 * Minimal JSX typing for the SCDS custom element this app renders
 * directly (no Angular wrapper -- see mfe-pot-platform's CLAUDE.md/
 * migration plan). Confirmed by inspecting `@tn4consulting/shared-ui-scds-core`'s
 * own compiled Stencil metadata directly: every prop used below has a
 * real kebab-case `attribute` mapping the component's own
 * `attributeChangedCallback` watches, so a plain HTML attribute in JSX is
 * enough -- same pattern already proven for GCDS in the shell repo.
 */
type ScdsElementProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;

/**
 * `data-field` (not a real SCDS attribute) is how `EiApplicationForm.tsx`
 * identifies which `FormDraft` key a `scdsChange`/`scdsInput` event came
 * from -- confirmed empirically that React 19 does **not** wire an
 * `onScdsChange`-shaped JSX prop to a real `addEventListener` call on a
 * custom element (unlike a recognized native event such as `onClick`); it
 * silently sets an inert same-named property instead. `EiApplicationForm`
 * therefore attaches one delegated `addEventListener('scdsChange', ...)` /
 * `addEventListener('scdsInput', ...)` pair on its own root ref and reads
 * `event.target`'s `data-field` attribute, rather than per-element
 * `onScdsChange` props (which would compile but silently never fire).
 * `msca-shell/AppFrame.tsx`'s existing `onScdsClose`/`scds-card`'s
 * `onScdsClick` usage elsewhere in the family rely on the same
 * never-fires JSX prop shape -- likely a pre-existing latent bug there,
 * out of scope to fix from this app.
 */
type ScdsFieldProps = { 'data-field'?: string };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'scds-card': ScdsElementProps & {
        'card-title'?: string;
        'card-title-tag'?: 'h3' | 'h4' | 'h5' | 'h6';
        description?: string;
        href?: string;
        rel?: string;
        target?: string;
        'img-src'?: string;
        'img-alt'?: string;
        tone?: 'info' | 'success' | 'warning' | 'danger';
        'tone-label'?: string;
      };
      'scds-breadcrumbs': ScdsElementProps;
      'scds-breadcrumbs-item': ScdsElementProps & { href?: string };
      'scds-progress-bar': ScdsElementProps & {
        current?: number;
        total?: number;
        'step-label'?: string;
      };
      'scds-text-input': ScdsElementProps &
        ScdsFieldProps & {
          label?: string;
          value?: string;
          type?: 'text' | 'tel' | 'email' | 'date';
          hint?: string;
          error?: string;
          required?: boolean;
          autocomplete?: string;
          placeholder?: string;
          maxlength?: number;
          disabled?: boolean;
        };
      'scds-currency-input': ScdsElementProps &
        ScdsFieldProps & {
          label?: string;
          value?: number;
          hint?: string;
          error?: string;
          required?: boolean;
          min?: number;
          max?: number;
          'currency-symbol'?: string;
          disabled?: boolean;
        };
      'scds-picker': ScdsElementProps &
        ScdsFieldProps & {
          label?: string;
          value?: string;
          display?: 'radio' | 'select';
          hint?: string;
          error?: string;
          required?: boolean;
          name?: string;
          placeholder?: string;
        };
      'scds-picker-option': ScdsElementProps & { value?: string };
    }
  }
}

export {};
