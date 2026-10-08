# RidePulse web design language

RidePulse is a calm, route-led ride journal. Preserve the existing graphite, warm white, and electric-lime identity across the public site and authenticated companion. New features should look like part of the same product.

## Source of truth

- `src/styles.scss`: web color tokens, shared controls, cards, typography, and responsive shell.
- `../mobile/src/theme/colors.ts`: matching mobile palette, Manrope weights, and layout values. Web follows the graphite palette; Android also supports True Black.
- `src/app/shared/route-art.component.ts`: shared route artwork. Reuse this component rather than introducing another route illustration style.

## Color and type

| Role | Existing token | Use |
| --- | --- | --- |
| Canvas | `--background` | Near-black page background |
| Surfaces | `--surface`, `--surface-high`, `--elevated` | Cards, controls, and elevated content |
| Primary text | `--text` | Warm-white headings and key values |
| Supporting text | `--text-soft`, `--muted` | Descriptions, dates, labels |
| Accent | `--accent`, `--on-accent` | Primary actions and selected navigation |
| Subtle selection | `--accent-tint` | Active mobile navigation background |
| Boundaries | `--border`, `--border-strong` | Quiet separation and form controls |
| Status | `--danger`, `--success` | Errors/destructive actions and confirmed success |

Use Manrope throughout, including form controls. Keep large titles short, use sentence case for actions, and reserve uppercase letter-spaced kickers for section context. Use existing muted text for metadata. Keep blue/yellow accents in established route artwork and chart/status contexts.

## Components and layout

- Reuse `.primary-action`, `.secondary-action`, `.filter-bar`, `.search-field`, `.metric-card`, `.ride-row`, and `.empty-card` before adding a new visual variant.
- Primary actions use lime with dark text. Secondary actions use dark surfaces. Period/review filters retain their warm-white selected pill; navigation and section tabs use lime. These distinguish filtering from changing destinations.
- Layout tokens match the mobile system: `--radius-card: 24px`, `--radius-control: 18px`, `--radius-compact: 14px`, and `--touch-target: 44px`. Keep existing larger hero cards and pill buttons where their role warrants it.
- Use the established spacing rhythm: 8–12px inside control groups, 16–20px between cards or for compact padding, and 24–28px between sections. Keep content aligned to its page grid.
- Preserve subtle surface shading, thin borders, and soft elevation. Keep cinematic artwork in heroes and route previews; ordinary forms should stay quiet and legible.
- Desktop uses the sidebar; up to 1040px uses the five-item rounded bottom navigation. It occupies its own layout row, so it does not cover content. Retain safe-area spacing and keep the same destination names: Home, Plan, Journal, Insights, Account.
- Below 680px, stack complex layouts and make filters easy to tap. Compact metrics may remain two columns; below 380px they stack. Wrap long user content without pushing controls off screen.

## Interaction and content

- Every control needs a visible focus state, a useful accessible name, and an explicit selected state where applicable. Icon-only actions need labels.
- Use the shared loading indicator. Preserve visible rows while loading another page. Show recoverable errors beside the action that failed and retain user input.
- Keep empty results distinct from network failures. Give filtered empty states a clear reset action.
- Respect reduced motion, including route transitions. Avoid decorative movement that delays access to content.
- Keep descriptions rider-facing. Use technical implementation details only when they help a rider decide what to do.
- Changes must preserve API contracts, private rider data, and existing functions. GPS ride recording remains Android-only.

## Review before finishing

Check populated, empty, loading, and error states where affected. Review narrow phones (320/390px), tablet (768/1024px), and desktop (1280/1440px), including a short desktop window. Check keyboard access, long titles, dialog recovery, and navigation after scrolling. Use synthetic data for local browser checks and state clearly when real devices or production APIs have not been verified.
