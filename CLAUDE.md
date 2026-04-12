# devlog — project rules

## Design system first

This project consumes UI from the **stateinfra design system**
(`@stateinfra/design-system`, source at `~/Projects/stateinfra-design-system`).

Two hard rules when adding UI:

1. **Before adding any UI element, make sure it exists in the design system.**
   If the needed component (or variant) does not exist, create it in
   `~/Projects/stateinfra-design-system/packages/ui/src/` first, export it
   from `index.ts`, build and publish, and only then consume it here.

2. **When adding any UI element, use only components from the design system.**
   Do not hand-roll bespoke buttons, inputs, cards, modals, badges, etc.
   in this repo. Compose from DS primitives. One-off container `<div>`s for
   layout are fine; UI atoms and molecules are not.

### Quick checklist

- [ ] Is the element I'm adding already in `@stateinfra/design-system`?
  - **Yes** → import and use it.
  - **No** → add it to the DS first (component + story/docs + `index.ts`),
    build/publish, then consume.
- [ ] Am I using raw HTML form controls, custom buttons, or ad-hoc cards?
  Replace with DS components.
- [ ] Does the new variant I need belong upstream? If it is reusable, put
  it in the DS; if it is truly one-off (e.g. the editor's slash menu), keep
  it local but document why.

### What stays local

Editor-only widgets (slash menu, wiki-link menu, markdown guide), post
content renderers (PostContent, Mermaid, ImageLightbox), and other
devlog-domain components stay in this repo — they depend on app state
and are not reusable.

### What belongs in the DS

Generic atoms and molecules (Button, Input, Card, Modal, Avatar, Badge,
Tabs, Pagination, Spinner, Skeleton, EmptyState, DropdownMenu, Toggle,
Checkbox, Radio, Select, Tag, StatusDot, Sidebar, Stat, Sparkline,
Table, CodeBlock, ContributionHeatmap, SocialLinks, …).
