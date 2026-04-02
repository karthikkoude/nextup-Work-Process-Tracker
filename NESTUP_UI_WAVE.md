# NestUp UI/UX Wave — Design System + Visual Implementation

> **When to use this file:** Insert this as Wave 2.5 — after Gate 2 (dependency engine
> passes FeatureHealth), before Wave 3 (component building begins).
> Every agent in this wave reads NESTUP_PROJECT.md first, then this file.
> This wave defines the visual language every component in Wave 3 must follow.

---

## UI Direction — What This App Should Feel Like

NestUp is a **professional work management tool** — not a startup landing page, not
a consumer app. The UI must feel like Linear or Notion: calm, dense, trustworthy.

**Three words that define the visual tone:** Structured. Clear. Purposeful.

| Principle | What It Means for NestUp |
|-----------|--------------------------|
| **Data first** | Numbers, statuses, and progress are always the hero. No decorative elements competing with data. |
| **Status at a glance** | Color is reserved exclusively for status (red=blocked, amber=in-progress, green=done). Never used decoratively. |
| **Calm neutrals** | Background and surfaces are neutral slate/gray. Color moments are rare and meaningful. |
| **Dense but breathable** | Dashboard packs information but uses consistent spacing so nothing feels cramped. |
| **Zero AI aesthetic** | No gradient buttons. No glowing blobs. No icon-in-colored-circle pattern. No centered hero layouts. |

---

## Design Tokens — Tailwind Config Extension

**Agent instruction:** Add these to `tailwind.config.ts` under `theme.extend`.
Every component must use these tokens — no hardcoded hex values in className strings.

```typescript
// tailwind.config.ts — theme.extend section
colors: {
  // Surfaces (neutral slate base)
  surface: {
    base:    '#f8fafc',   // page background
    card:    '#ffffff',   // card / panel background
    offset:  '#f1f5f9',   // subtle section bg, table zebra stripe
    border:  '#e2e8f0',   // all borders and dividers
    hover:   '#f8fafc',   // row hover, button ghost hover
  },
  // Text hierarchy
  ink: {
    primary: '#0f172a',   // headings, labels
    body:    '#334155',   // body text, descriptions
    muted:   '#64748b',   // secondary text, placeholders
    faint:   '#94a3b8',   // timestamps, helper text
    inverse: '#f8fafc',   // text on dark backgrounds
  },
  // Status colors — ONLY use for work item status, never decoratively
  status: {
    blocked:     '#ef4444',   // red-500
    blockedBg:   '#fef2f2',   // red-50
    blockedBorder:'#fecaca',  // red-200
    progress:    '#f59e0b',   // amber-500
    progressBg:  '#fffbeb',   // amber-50
    progressBorder:'#fde68a', // amber-200
    done:        '#22c55e',   // green-500
    doneBg:      '#f0fdf4',   // green-50
    doneBorder:  '#bbf7d0',   // green-200
  },
  // Priority colors — muted, not as loud as status
  priority: {
    critical:   '#dc2626',    // red-600
    high:       '#ea580c',    // orange-600
    medium:     '#ca8a04',    // yellow-600
    low:        '#16a34a',    // green-600
  },
  // Primary action (teal — used only for CTAs and active states)
  brand: {
    DEFAULT:    '#0d9488',    // teal-600
    hover:      '#0f766e',    // teal-700
    active:     '#115e59',    // teal-800
    subtle:     '#f0fdfa',    // teal-50 (selected state bg)
    border:     '#99f6e4',    // teal-200 (active border)
  },
  // Danger (for destructive actions only)
  danger: {
    DEFAULT:    '#dc2626',
    hover:      '#b91c1c',
    subtle:     '#fef2f2',
  },
},
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
},
fontSize: {
  '2xs': ['0.625rem', { lineHeight: '0.875rem' }],  // 10px — tiny labels only
  xs:   ['0.75rem',  { lineHeight: '1rem' }],        // 12px — badges, timestamps
  sm:   ['0.875rem', { lineHeight: '1.25rem' }],     // 14px — body, table cells
  base: ['1rem',     { lineHeight: '1.5rem' }],      // 16px — standard body
  lg:   ['1.125rem', { lineHeight: '1.75rem' }],     // 18px — section headings
  xl:   ['1.25rem',  { lineHeight: '1.75rem' }],     // 20px — page titles
  '2xl':['1.5rem',   { lineHeight: '2rem' }],        // 24px — dashboard KPI numbers
},
borderRadius: {
  sm:   '0.25rem',   // 4px  — badges, chips
  DEFAULT:'0.375rem',// 6px  — inputs, buttons
  md:   '0.5rem',    // 8px  — cards, modals
  lg:   '0.75rem',   // 12px — large panels
  xl:   '1rem',      // 16px — full-page modals
  full: '9999px',    // pill — avatars, pill badges
},
boxShadow: {
  card:  '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
  panel: '0 4px 16px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)',
  modal: '0 20px 60px rgba(15,23,42,0.16), 0 4px 12px rgba(15,23,42,0.08)',
},
```

---

## Typography Rules

Load Inter from Google Fonts in `app/layout.tsx`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

| Element | Classes |
|---------|---------|
| Page title (h1) | `text-xl font-semibold text-ink-primary tracking-tight` |
| Section heading (h2) | `text-lg font-semibold text-ink-primary` |
| Card title | `text-sm font-semibold text-ink-primary` |
| Body text | `text-sm text-ink-body` |
| Muted / helper text | `text-xs text-ink-muted` |
| Timestamp | `text-xs text-ink-faint font-mono` |
| KPI number | `text-2xl font-bold text-ink-primary tabular-nums` |
| Table header | `text-xs font-semibold text-ink-muted uppercase tracking-wider` |
| Table cell | `text-sm text-ink-body` |

**Rule:** `tabular-nums` on every number that changes dynamically — KPIs, progress %, scores.

---

## Layout System

### Page Shell
```
┌─────────────────────────────────────────────────────┐
│  TopNav (h-14, border-b border-surface-border)      │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Sidebar  │  Main Content Area                       │
│  w-56    │  flex-1, overflow-y-auto                 │
│ (admin)  │  px-6 py-6                               │
│          │                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

- **TopNav:** Logo left, user info + logout right. Height fixed `h-14`. Background `bg-surface-card`. Border bottom `border-surface-border`.
- **Sidebar (admin only):** Fixed left, `w-56`. Nav items with active state using `bg-brand-subtle text-brand border-r-2 border-brand`. Background `bg-surface-card`.
- **Main content:** Single scroll region (`overflow-y-auto` on main only). No nested scrolling. `max-w-7xl mx-auto` for content max width.
- **Member dashboard:** No sidebar. Full-width single column with `max-w-3xl mx-auto`.

### Grid Patterns

**KPI row:** `grid grid-cols-2 md:grid-cols-4 gap-4`

**Admin dashboard sections order:**
1. KPI Row
2. Bottleneck Banner (conditional — only when items exist)
3. Process Flow Diagram (full width)
4. Two-column: Workload Table (left 60%) + Quick Actions (right 40%)

**Member dashboard sections order:**
1. "Your Tasks" heading + item count badge
2. Task list (single column, full width)
3. "Blocking Others" section (conditional)

---

## Component Specifications

### Wave 2.5A — Surgical Agent — Design Tokens File

**Session prompt:**
```
Read NESTUP_PROJECT.md and NESTUP_UI_WAVE.md completely, then:
1. Add the full color, fontSize, borderRadius, boxShadow, and fontFamily
   tokens from NESTUP_UI_WAVE.md Design Tokens section into tailwind.config.ts
   under theme.extend.
2. Create app/globals.css with:
   - @tailwind base/components/utilities
   - Inter font import via @import or link (use Google Fonts)
   - CSS variable for React Flow override: .react-flow__background { background: #f8fafc; }
   - One custom utility: .tabular-nums { font-variant-numeric: tabular-nums; }
3. Verify: does `text-ink-primary` resolve? Does `bg-status-blockedBg` resolve?
   Run tsc --noEmit. No errors before finishing.
```

---

### Wave 2.5B — Build Agent — Base Component Library

**Session prompt:**
```
Read NESTUP_PROJECT.md and NESTUP_UI_WAVE.md completely, then:
Create components/ui/ with these base components using only Tailwind tokens
defined in NESTUP_UI_WAVE.md. No inline hex values. No hardcoded colors.

1. components/ui/Button.tsx
   Variants: primary (brand bg), secondary (surface-card border), ghost (transparent),
   danger (danger bg). Sizes: sm, md (default). Always: rounded font-medium
   transition-colors focus-visible:ring-2. Disabled: opacity-50 cursor-not-allowed.

2. components/ui/PriorityBadge.tsx
   Props: priority ('low'|'medium'|'high'|'critical')
   Style: pill shape (rounded-full), text-2xs font-semibold uppercase tracking-wide
   Colors map: critical→red, high→orange, medium→yellow, low→green
   Use priority token colors from design tokens.

3. components/ui/StatusChip.tsx
   Props: status ('blocked'|'in-progress'|'done')
   Style: rounded-sm px-2 py-0.5 text-xs font-medium border
   Colors: use status token bg + border + text colors exactly.
   Icons: blocked→XCircle, in-progress→Clock, done→CheckCircle (lucide-react)

4. components/ui/KPICard.tsx
   Props: label, value, color ('red'|'amber'|'green'|'default')
   Style: bg-surface-card shadow-card rounded-md p-4
   Value: text-2xl tabular-nums font-bold
   Label: text-xs text-ink-muted uppercase tracking-wider

5. components/ui/Modal.tsx
   Props: isOpen, onClose, title, children, size ('sm'|'md'|'lg')
   Style: fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center
   Panel: bg-surface-card shadow-modal rounded-xl
   Always include: title bar, X close button, Escape key handler

6. components/ui/EmptyState.tsx
   Props: icon (lucide component), title, description, action (optional button)
   Style: flex col items-center text-center py-16 text-ink-muted
   Rule: never render raw "No items" text anywhere — always use this component

After writing, verify: all colors reference Tailwind tokens, no hardcoded hex values,
tsc --noEmit passes.
```

---

### Wave 2.5C — Build Agent — Layout Shell

**Session prompt:**
```
Read NESTUP_PROJECT.md and NESTUP_UI_WAVE.md completely, then:
Build the app shell layout components:

1. components/layout/TopNav.tsx
   Left: NestUp logo (SVG inline — simple geometric N mark, teal color)
   Right: user email + role badge + logout button (ghost variant)
   Style: h-14 px-6 flex items-center justify-between bg-surface-card
   border-b border-surface-border sticky top-0 z-30

2. components/layout/Sidebar.tsx (admin only)
   Nav items: Overview, Work Items, Dependencies, Team
   Active state: bg-brand-subtle text-brand border-r-2 border-brand font-medium
   Inactive: text-ink-muted hover:bg-surface-hover hover:text-ink-body
   Bottom: small version number text-xs text-ink-faint

3. components/layout/AdminShell.tsx
   Wraps: TopNav + Sidebar + main content area
   Main: flex-1 overflow-y-auto bg-surface-base px-6 py-6

4. components/layout/MemberShell.tsx
   Wraps: TopNav + full-width main content
   Main: max-w-3xl mx-auto px-6 py-6 bg-surface-base

The NestUp SVG logo must be custom — not a placeholder. Simple geometric shape.
Teal color using brand.DEFAULT token (#0d9488).
```

---

### Wave 2.5D — Surgical Agent — React Flow Custom Nodes

**Session prompt:**
```
Read NESTUP_PROJECT.md and NESTUP_UI_WAVE.md completely, then:
Create components/admin/FlowNode.tsx — the custom node for React Flow diagram.

This is the most visually important component in the entire app.
Use Context7 MCP to verify @xyflow/react v12 custom node API before writing.

Node must display:
- Top: work item title (font-semibold text-sm, truncate at 24 chars)
- Middle row: PriorityBadge component + assigned member name (text-xs text-ink-muted)
- Bottom: progress bar + progress % number (tabular-nums)

Node visual states (use status token colors):
- blocked:     border-2 border-status-blocked bg-status-blockedBg
- in-progress: border-2 border-status-progressBorder bg-status-progressBg
- done:        border-2 border-status-doneBorder bg-status-doneBg opacity-75

Progress bar inside node:
- Track: bg-surface-border h-1.5 rounded-full
- Fill: width = progress%, color matches status
  blocked→bg-status-blocked, in-progress→bg-status-progress, done→bg-status-done

Node size: w-48 (fixed width). Height: auto.
Border radius: rounded-md (8px).
Shadow: shadow-card on default, shadow-panel on selected.
Handle positions: source=Right, target=Left (left-to-right dagre layout).

Click handler: receives onNodeClick prop, calls it with the WorkItem data.
Selected state: ring-2 ring-brand ring-offset-1.

After writing, create a FlowEdge.tsx for custom edges:
- Full dependency: solid line, strokeWidth=2, color=#64748b (ink-muted)
- Partial dependency: strokeDasharray="6 3", strokeWidth=2, color=#94a3b8
- Edge label: small pill bg-surface-card border border-surface-border
  text-2xs text-ink-muted px-1.5 py-0.5 rounded-sm
  Text: "Full" or "Partial 50%" depending on type and threshold
```

---

### Wave 2.5 GATE — Codereview Agent

**Session prompt:**
```
Read NESTUP_PROJECT.md and NESTUP_UI_WAVE.md completely, then:
Review all files created in Wave 2.5 (tailwind.config.ts, globals.css,
components/ui/*, components/layout/*, components/admin/FlowNode.tsx,
components/admin/FlowEdge.tsx).

Check for:
1. No hardcoded hex values in any component — all colors must use Tailwind token classes
2. All text sizes use the defined scale (text-xs through text-2xl only)
3. Status colors ONLY on StatusChip and FlowNode — not used decoratively anywhere else
4. EmptyState component exists and is the only way to show empty content
5. Modal has Escape key handler and X button
6. FlowNode handles all 3 status states with correct token colors
7. TopNav has custom SVG logo (not placeholder text)
8. tsc --noEmit passes with zero errors

Report PASS/FAIL per file with line numbers for failures.
Confirm: is the visual language consistent across all components?
Are there any color inconsistencies between StatusChip and FlowNode status colors?
```

---

## States & Feedback Rules

Every agent in Wave 3 must implement these states for every data-fetching component.
These are NOT optional — the founder will see these states during the demo.

### Loading States
- Skeleton shimmer pattern only — no spinners inside content areas
- Tailwind shimmer: `animate-pulse bg-surface-offset rounded`
- KPI row loading: 4 skeleton cards same size as real KPIs
- Table loading: 5 skeleton rows with 4 columns each
- Process flow diagram loading: single centered text "Loading dependency graph..."

### Empty States
Always use `components/ui/EmptyState.tsx`. Content per section:

| Section | Icon | Title | Description | Action |
|---------|------|-------|-------------|--------|
| Work Items (admin) | `ClipboardList` | "No work items yet" | "Create the first work item to start building your dependency chain." | "Create Work Item" button |
| Process Flow | `GitBranch` | "No dependencies mapped" | "Add dependencies between work items to see the process flow." | "Add Dependency" button |
| Member tasks | `CheckSquare` | "No tasks assigned" | "You have no work items assigned to you yet." | none |
| Blocking Others | `Users` | "Not blocking anyone" | "You are not blocking any tasks right now." | none |

### Error States
- Inline red alert banner: `bg-danger-subtle border border-danger rounded-md px-4 py-3`
- Icon: `AlertCircle` from lucide-react in `text-danger`
- Never raw error text. Never console.log only.
- Use for: cycle detection rejection, failed Supabase mutations, auth errors

### Success Feedback
- Inline green confirmation banner that auto-dismisses after 3 seconds
- `bg-status-doneBg border border-status-doneBorder rounded-md px-4 py-3`
- Use for: work item created, dependency added, progress saved

---

## Responsive Rules

This is a demo app — desktop (1280px+) is the primary target.
Mobile must not break but doesn't need to be perfect.

| Component | Desktop | Mobile (375px) |
|-----------|---------|----------------|
| Sidebar | Fixed left w-56 | Hidden, hamburger toggle |
| KPI row | 4 columns | 2 columns |
| Process flow diagram | Full width, 500px height | Full width, 300px height, touch pan enabled |
| Workload table | Side by side with actions panel | Stacked, full width |
| Modals | Centered, max-w-lg | Bottom sheet style, rounded-t-xl |
| Task cards | Single column max-w-3xl | Full width, px-4 |

---

## Specific Anti-Patterns — Do NOT Do These

These are the exact patterns that will make the demo look like a generic template:

- **No colored card borders** — `border-l-4 border-red-500` style. Use bg color instead.
- **No gradient buttons** — `bg-gradient-to-r from-teal-500 to-blue-500`. Use solid brand color.
- **No icon-in-colored-circle pattern** — icons inside rounded colored squares. Use icons directly.
- **No centered text in dashboard cards** — all card content left-aligned.
- **No rainbow status system** — only 3 status colors exist. Never add purple, pink, indigo for any status.
- **No toast for cycle rejection** — must be inline persistent banner.
- **No percentage text without tabular-nums** — numbers jumping width on change looks broken.
- **No hover effects on the React Flow canvas background** — only on nodes.

---

## React Flow Canvas Specific Rules

```
Background: BackgroundVariant.Dots, color=#e2e8f0, gap=20, size=1
Canvas bg: bg-surface-offset (#f1f5f9)
MiniMap: nodeColor based on status, maskColor rgba(248,250,252,0.8)
Controls: bottom-left, style bg-surface-card shadow-card rounded-md border border-surface-border
Node click: shows side panel sliding in from right (NOT a modal)
  Side panel: fixed right-0 top-14 h-[calc(100vh-3.5rem)] w-80 bg-surface-card
  shadow-panel border-l border-surface-border overflow-y-auto p-5
  Close: X button top-right, also closes on canvas click
```

Side panel content when node is clicked:
- Item title (text-xl font-semibold)
- StatusChip + PriorityBadge in a row
- Assigned to: member name + skills tags
- Progress: large progress bar + % number
- Description (if exists)
- "Predecessors" list: items blocking this one
- "Successors" list: items this one is blocking
- Edit button (opens WorkItemForm pre-filled)
