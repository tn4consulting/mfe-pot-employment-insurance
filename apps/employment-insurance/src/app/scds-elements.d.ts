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
    }
  }
}

export {};
