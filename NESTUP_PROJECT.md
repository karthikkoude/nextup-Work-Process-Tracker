# NestUp Work Process Tracker -- Master Project Context

> **HOW TO USE THIS FILE**
> Every OpenCode agent session -- regardless of mode (Build, Plan, Surgical, Codereview,
> Debug, FeatureHealth) -- must read this file completely before writing any code.
> This file defines WHAT to build, WHY each decision was made, and HOW agents
> coordinate without conflicting. Never modify Section 07 (Shared Contracts) mid-build.

---

## 01 · What Is This Project?

NestUp is a **Work Management SaaS company**. This is their intern assignment:
build a **Work Process Tracker** -- a web app where admins manage tasks with
dependency chains, and members update their own task progress.

The unique intellectual challenge is the **dependency engine** -- tasks chain together
where Task B cannot start until Task A reaches a certain progress percentage. The system
auto-blocks and auto-unblocks tasks as members update progress. This logic is the
entire point of the assignment.

### Evaluation Weight (from assignment PDF)
- Dependency logic correctness → **Very High**
- System design + scalability thinking → **High**
- Correct auth + task output → **High**
- Edge case handling → **High**
- Code quality + readability → **Medium**
- Bonus features → **Positive signal**

### Demo Format
Live demo to the founder. Admin and member logins both shown. At least one partial
dependency chain + one full dependency chain demonstrated. Circular dependency rejection
shown on screen. Founder will ask: "explain the algorithm step by step."

---

## 02 · Users and Access

| Role | Login | Sees | Can Do |
|------|-------|------|--------|
| **Admin** | admin@nestup.com | Everything | Create items, assign members, link dependencies, view workload + bottlenecks |
| **Member** | any member email | Own assigned tasks only | Update progress, mark blocked with reason, see what they are blocking |

Route protection: `/admin` → admin role only. `/member` → member role only.
Unauthorized access redirects to `/login`.

---

## 03 · Tech Stack -- Decisions and Reasons

| Tool | Version | Why |
|------|---------|-----|
| Next.js | 14 (App Router) | Developer's existing expertise. App Router gives clean middleware-based route protection. |
| TypeScript | 5.x strict mode | Strict typing prevents runtime errors in dependency logic. No `any` allowed. |
| Supabase Auth | Latest | Real role-based auth -- not fake in-memory. Impresses founder vs prototype feel. |
| Supabase PostgreSQL | Latest | Persistent data with real foreign keys and RLS policies per role. |
| Supabase Realtime | Latest | Bonus: live dashboard updates when member changes progress. |
| Tailwind CSS | 3.x | Developer's existing expertise. No custom CSS files needed. |
| @xyflow/react | 12.x | Assignment requires visual process flow diagram. Purpose-built for node/edge graphs. |
| @dagrejs/dagre | Latest | Auto-layout for React Flow. Arranges nodes left-to-right by dependency chain. |

### Why NOT These Tools
- **Redux** -- boilerplate overkill. Server state lives in Supabase, no complex client state needed.
- **Zustand** -- valid but in-memory only. Supabase is real persistence and more impressive for demo.
- **Next.js Pages Router** -- App Router middleware is cleaner for role-based protection.
- **D3.js** -- React Flow already ships minimap, zoom, controls, and layout. D3 would take 10× longer.
- **Supabase Edge Functions for cascade** -- adds deployment complexity and demo risk. Use client-side cascade instead (simpler, easier to explain verbally).

---

## 04 · Exact Installation

Run these commands in order before opening OpenCode:

```bash
npx create-next-app@14 nestup-tracker --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd nestup-tracker
npm install @supabase/supabase-js @supabase/ssr
npm install @xyflow/react @dagrejs/dagre
npm install lucide-react
npm install -D @types/dagre
```

> **Package name warning:** The correct React Flow package is `@xyflow/react` (NOT `react-flow-renderer` which is deprecated). Always use `@xyflow/react` version 12.x.

---

## 05 · Environment Setup

Create `.env.local` in project root. Never commit this file.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Get these values from: Supabase Dashboard → Project Settings → API.

---

## 06 · Folder Structure

```
nestup-tracker/
├── NESTUP_PROJECT.md                   ← This file
├── .env.local                          ← Supabase keys (never commit)
├── middleware.ts                       ← Route protection (Supabase session + role check)
├── .agents/
│   └── skills/                         ← Custom OpenCode agent skill sets
├── supabase/
│   ├── schema.sql                      ← Table definitions + RLS policies
│   └── seed.sql                        ← Demo seed data (written by Plan agent)
├── lib/
│   ├── supabase-browser.ts             ← Browser client (createBrowserClient)
│   └── supabase-server.ts              ← Server client (createServerClient + cookies)
├── types/
│   └── index.ts                        ← All TypeScript interfaces -- SHARED CONTRACT
├── utils/
│   └── dependencyEngine.ts             ← Pure algorithm functions -- MOST CRITICAL FILE
├── components/
│   ├── auth/
│   │   └── LoginForm.tsx
│   ├── admin/
│   │   ├── WorkItemForm.tsx            ← Create/edit work items
│   │   ├── DependencyModal.tsx         ← Link items + cycle error display
│   │   ├── WorkloadTable.tsx           ← Member workload scores
│   │   ├── BottleneckBanner.tsx        ← Alert for blocking items
│   │   └── ProcessFlowDiagram.tsx      ← React Flow graph
│   ├── member/
│   │   ├── TaskCard.tsx                ← Task with progress slider
│   │   ├── BlockedModal.tsx            ← Reason input for blocked status
│   │   └── BlockingImpactView.tsx      ← Shows downstream tasks this member blocks
│   └── shared/
│       ├── PriorityBadge.tsx
│       └── StatusChip.tsx
└── app/
    ├── layout.tsx
    ├── page.tsx                        ← Redirects to /login, /admin, or /member by role
    ├── (auth)/
    │   └── login/
    │       └── page.tsx
    ├── admin/
    │   └── page.tsx                    ← AdminDashboard (protected)
    └── member/
        └── page.tsx                    ← MemberDashboard (protected)
```

---

## 07 · Shared Contracts -- READ-ONLY FOR ALL AGENTS

> **RULE:** These are the source of truth. No agent may change these values
> during any build wave. If a file needs different values, the agent must
> flag it for human review before proceeding.

### TypeScript Interfaces (types/index.ts)

```typescript
export type UserRole = 'admin' | 'member'

export type Priority = 'low' | 'medium' | 'high' | 'critical'

// Exactly 3 values -- not 4. Never add 'pending' or any other value.
export type WorkStatus = 'blocked' | 'in-progress' | 'done'

// full always has threshold=100. partial has admin-defined threshold.
export type DependencyType = 'partial' | 'full'

export interface User {
  id: string               // Supabase auth UUID
  name: string
  email: string
  role: UserRole
  skills: string[]         // e.g. ['React', 'Node.js']
}

export interface WorkItem {
  id: string               // UUID
  title: string
  description: string
  priority: Priority
  progress: number         // 0–100 integer
  status: WorkStatus       // derived, not manually set by members
  assigned_to: string      // User UUID
  required_skills: string[]
  blocked_reason?: string  // only set when status = 'blocked'
  created_at: string
  updated_at: string
}

export interface Dependency {
  id: string               // UUID
  from_id: string          // predecessor WorkItem UUID
  to_id: string            // successor WorkItem UUID (this one gets blocked)
  type: DependencyType
  threshold: number        // 0–100. Rule: threshold=0 → never blocks successor.
}
```

### Workload Score Formula
```
critical = 4 points
high     = 3 points
medium   = 2 points
low      = 1 point
overload threshold = 15 points (show red badge above this)
```

### Threshold Edge Case Rule
```
threshold = 0  → successor is NEVER blocked (treat as immediately unblocked)
threshold = 100 + type='full' → predecessor must be exactly done (progress = 100)
comparison: predecessor.progress < dependency.threshold → BLOCKED
            predecessor.progress >= dependency.threshold → unblocked
```

---

## 08 · Database Schema

**Agent instruction:** Use Context7 MCP to verify Supabase RLS syntax before writing.
Write the full schema in `supabase/schema.sql`.

### Tables Required

**public.users**
- id (uuid, primary key, references auth.users)
- name (text, not null)
- email (text, not null)
- role (text, check: 'admin' or 'member', not null)
- skills (text array, default empty)

**public.work_items**
- id (uuid, primary key, default gen_random_uuid())
- title, description (text)
- priority (text, check: low/medium/high/critical)
- progress (integer, check 0–100, default 0)
- status (text, check: blocked/in-progress/done, default 'in-progress')
- assigned_to (uuid, references public.users)
- required_skills (text array, default empty)
- blocked_reason (text, nullable)
- created_at, updated_at (timestamptz, default now())

**public.dependencies**
- id (uuid, primary key, default gen_random_uuid())
- from_id (uuid, references work_items, cascade delete)
- to_id (uuid, references work_items, cascade delete)
- type (text, check: partial/full)
- threshold (integer, check 0–100)
- constraint: from_id != to_id (no self-dependency)

### RLS Policy Rules
- Admins: full CRUD on all three tables
- Members: SELECT + UPDATE on work_items where assigned_to = auth.uid() only
- Members: SELECT on their own row in users only
- Members: no access to dependencies table (admin-only concern)

---

## 09 · Seed Data Specification

**Agent instruction:** Write `supabase/seed.sql` using this spec. Use
`supabase auth admin createuser` pattern or direct INSERT into auth.users
+ public.users. All passwords: `Demo1234!` for simplicity during demo.

### Users to Create
```
admin1:  admin@nestup.com    role=admin   skills=[Management, Planning]
admin2:  sarah@nestup.com    role=admin   skills=[Design, Management]
member1: alex@nestup.com     role=member  skills=[React, TypeScript, Node.js]
member2: priya@nestup.com    role=member  skills=[Python, Data, ML]
member3: carlos@nestup.com   role=member  skills=[Node.js, PostgreSQL, DevOps]
member4: nina@nestup.com     role=member  skills=[React, CSS, Figma]
```

### Work Items to Create
```
Item A: "UI Design Mockups"        nina     progress=60  status=in-progress  priority=high
Item B: "Frontend Development"     alex     progress=0   status=in-progress  priority=high
        (will be unblocked because A=60 already >= threshold 50)
Item C: "API Integration"          carlos   progress=0   status=blocked      priority=critical
Item D: "Data Pipeline Setup"      priya    progress=30  status=in-progress  priority=medium
        (no dependencies -- isolated item)
Item E: "QA Testing"               alex     progress=0   status=blocked      priority=high
Item F: "Performance Optimization" carlos   progress=0   status=blocked      priority=medium
Item G: "Deployment Prep"          carlos   progress=0   status=blocked      priority=low
        (used for circular rejection demo -- do NOT add any dependency for G in seed)
```

### Dependencies to Create
```
A → B : partial, threshold=50   (B unblocks when A >= 50%. A=60% so B is in-progress at load)
B → C : full,    threshold=100  (C only unblocks when B=100%)
C → E : full,    threshold=100  (E only unblocks when C=100%)
C → F : full,    threshold=100  (F only unblocks when C=100% -- makes C a bottleneck: blocks E+F)
```

> **Demo chain to verify on load:**
> A(60%) → B should be `in-progress` | C, E, F should be `blocked` | D independent.
> Item C is the bottleneck (blocks both E and F).
> Item G has zero dependencies -- use it to demo circular rejection by trying G → A.

---

## 10 · Dependency Engine -- Algorithm Specification

**File:** `utils/dependencyEngine.ts`
**Agent mode:** Surgical only. Build agent must never touch this file.
**Rule:** Pure functions ONLY. Zero Supabase imports. Zero React imports.
Zero side effects. Input arrays are never mutated -- always return new arrays.

### Function 1: hasCycle
```
Signature: hasCycle(deps: Dependency[], proposed: Dependency): boolean

Algorithm: DFS (Depth First Search)
- Build adjacency list from existing deps: { fromId → [toId, toId...] }
- Start DFS traversal from proposed.toId
- Maintain a visited set to prevent infinite loops
- If during traversal we reach proposed.fromId → cycle exists → return true
- If traversal completes without reaching fromId → no cycle → return false

Time complexity: O(V + E)
Must also return the cycle path as a separate helper for UI display.
```

### Function 2: isItemBlocked
```
Signature: isItemBlocked(itemId: string, items: WorkItem[], deps: Dependency[]): boolean

Algorithm: Direct predecessor evaluation
- Find all deps where dep.to_id === itemId (predecessors of this item)
- If no predecessors → return false (never blocked)
- For each predecessor dep:
    - Find predecessor WorkItem by dep.from_id
    - If predecessor.progress < dep.threshold → return true (BLOCKED)
    - Special case: if dep.threshold === 0 → skip this dep (never blocks)
- If all predecessors passed → return false

No DFS needed. Single-level check only.
```

### Function 3: cascadeStatusUpdate
```
Signature: cascadeStatusUpdate(
  changedItemId: string,
  items: WorkItem[],
  deps: Dependency[]
): WorkItem[]

Algorithm: BFS (Breadth First Search)
- Create mutable copy of items array (spread operator)
- Initialize BFS queue with changedItemId
- Initialize visited set (prevent processing same node twice)
- While queue is not empty:
    - Dequeue currentId
    - Find all deps where dep.from_id === currentId (successors)
    - For each successor:
        - Run isItemBlocked(successor.id, updatedItems, deps)
        - If blocked → set successor.status = 'blocked', clear blocked_reason if it was auto
        - If not blocked AND was previously blocked → set status = 'in-progress'
        - If progress === 100 → set status = 'done' (overrides block check)
        - Add successor.id to queue if not visited
        - Mark as visited
- Return the fully updated items array

Priority order: done > blocked > in-progress
```

### Function 4: detectBottlenecks
```
Signature: detectBottlenecks(items: WorkItem[], deps: Dependency[]): WorkItem[]

Algorithm:
- Count how many unique to_id values each from_id appears for in deps
- Return WorkItems where: outgoing successor count >= 2 AND status !== 'done'
- These are items blocking multiple others and not yet complete
```

### Function 5: getWorkloadScore
```
Signature: getWorkloadScore(memberId: string, items: WorkItem[]): number

Algorithm:
- Filter items where assigned_to === memberId AND status !== 'done'
- Sum scores: critical=4, high=3, medium=2, low=1
- Return total
```

### Function 6: suggestAssignees
```
Signature: suggestAssignees(requiredSkills: string[], users: User[], items: WorkItem[]): User[]

Algorithm:
- Filter users where role === 'member'
- Score each member: skill match count (higher is better) minus workload penalty
- Sort by: most skill matches first, then lowest workload score
- Return ranked array (admin picks from this list, not auto-assigned)
```

---

## 11 · Supabase Client Setup

**Agent instruction:** Use Context7 MCP to get the exact Next.js 14 App Router
+ @supabase/ssr pattern before writing these files. The @supabase/ssr package
replaced the deprecated auth-helpers-nextjs.

### lib/supabase-browser.ts
Use `createBrowserClient` from `@supabase/ssr`.
Export a singleton client. Used in Client Components.

### lib/supabase-server.ts
Use `createServerClient` from `@supabase/ssr` with Next.js `cookies()`.
Used in Server Components and Server Actions.

### middleware.ts
Use `createServerClient` in middleware context with `request`/`response` cookies.
Logic flow:
1. Get session from Supabase
2. If no session → redirect to /login (except /login itself)
3. If session exists → get user role from public.users
4. If path starts with /admin and role != 'admin' → redirect to /member
5. If path starts with /member and role != 'member' → redirect to /admin
6. Otherwise → continue

---

## 12 · Page Requirements

### /login
- Email + password fields
- On submit: Supabase signInWithPassword()
- On success: fetch role from public.users, redirect accordingly
- Show inline error (not toast) if credentials wrong
- No loading spinner on button -- disable button + change text to "Signing in..."

### /admin -- AdminDashboard
Must show all of these:

**KPI Row (top)**
- Total work items count
- Blocked items count (red)
- In-progress items count (amber)
- Done items count (green)

**Bottleneck Banner**
- Only visible when detectBottlenecks() returns items
- Red warning -- lists item titles that are blocking multiple others
- Dismissible per session

**Process Flow Diagram (React Flow)**
- Full width section
- Each WorkItem = one node
- Node background color: red=blocked, amber=in-progress, green=done
- Node content: title + priority badge + assigned member name + progress %
- Each Dependency = one edge
- Edge label: "Partial 50%" or "Full" depending on type
- Edge style: dashed line for partial, solid line for full
- Click a node → side panel slides in with full item details
- Auto-layout with dagre: left-to-right direction
- Include MiniMap + Controls from @xyflow/react
- Handle empty state (no items yet) gracefully

**Member Workload Table**
- One row per member
- Columns: Name, Skills, Active Tasks, Workload Score, Status
- Red badge on name if score > 15 (overload)
- Auto-assign suggestion uses this data

**Action Buttons**
- "Create Work Item" → opens WorkItemForm modal
- "Add Dependency" → opens DependencyModal

### WorkItemForm (modal)
- Fields: title, description, priority (dropdown), required skills (tag input), assign member
- When required skills are typed → show suggestAssignees() ranked list as dropdown
- On submit → INSERT to Supabase → refresh items list → close modal

### DependencyModal (modal)
- Dropdowns: From Item, To Item, Type (partial/full), Threshold (0–100, disabled if full)
- On submit → run hasCycle() BEFORE inserting to Supabase
- If cycle detected → show inline red alert banner (NOT a toast, NOT console.log):
  "⚠ Circular dependency detected: [ItemA title] → [ItemB title] → [ItemA title]. Rejected."
  Show the full cycle path reconstructed from DFS traversal.
- If no cycle → INSERT to Supabase → run cascadeStatusUpdate() → refresh all items

### /member -- MemberDashboard
Must show all of these:

**Your Tasks section**
- List of work items where assigned_to = current user
- Each task: title, priority badge, status chip, progress %
- Progress slider (range input 0–100) per task
- On slider change:
    1. UPDATE work_items set progress in Supabase
    2. If progress = 100 → set status = 'done'
    3. Run cascadeStatusUpdate() client-side
    4. Batch UPDATE all changed downstream items in Supabase
    5. Refresh UI

**Mark as Blocked button** (per task)
- Opens modal with text area for reason
- Sets status='blocked', blocked_reason=inputted reason in Supabase
- Only for tasks not already done

**Blocking Others section**
- Shows tasks where this member's item is a from_id in dependencies
- For each: downstream item title + how much more progress is needed to unblock it
- If none: show warm empty state "You are not blocking any tasks right now 🎉"

---

## 13 · Cascade Trigger -- Client-Side Decision

**Decision:** Cascade runs client-side after every Supabase mutation. Not Edge Functions.

**Reason:** Simpler to explain at demo. No deployment risk. No cold start delay.

**Pattern for every progress update:**
```
1. user changes progress slider
2. UPDATE Supabase work_items SET progress = X WHERE id = itemId
3. fetch fresh items + deps arrays from Supabase
4. run cascadeStatusUpdate(itemId, freshItems, deps)
5. collect all items where status changed
6. batch UPDATE those items in Supabase (single upsert call)
7. setState with updated array for immediate UI
```

Never optimistically update UI before Supabase confirms step 2.

---

## 14 · Bonus Features (implement after core is complete and tested)

| Feature | Where | Implementation Note |
|---------|-------|---------------------|
| Auto-assign suggestion | WorkItemForm | suggestAssignees() already in dependencyEngine.ts -- just wire to UI |
| Overload alert badge | WorkloadTable + MemberDashboard | getWorkloadScore() > 15 → red badge |
| Supabase Realtime | AdminDashboard | Subscribe to work_items INSERT/UPDATE -- refresh diagram live |
| Estimated completion | TaskCard | Store progress snapshots with timestamps. Calculate daily avg rate. Show "Est. X days" |

---

## 15 · Parallel Build Wave Map

> **RULE:** Agents within a wave may run simultaneously.
> Never start a new wave until the gate check passes.
> Gate = Codereview agent reviews all files from that wave + `npx tsc --noEmit` passes.

```
WAVE 1 -- Parallel (zero shared files)
├── Plan agent   → supabase/schema.sql + supabase/seed.sql
├── Plan agent   → types/index.ts (use Section 07 contracts exactly)
└── Build agent  → lib/supabase-browser.ts + lib/supabase-server.ts

  GATE 1: Codereview reviews all 4 files. tsc --noEmit passes. Commit.

WAVE 2 -- Solo (most critical file, no distractions)
└── Surgical agent → utils/dependencyEngine.ts
    Uses: types/index.ts (read-only)
    Does NOT touch: any component, any Supabase call

  GATE 2: FeatureHealth tests all 6 functions with edge cases.
          Verify: threshold=0 case, cycle detection, cascade BFS order.
          tsc --noEmit passes. Commit.

WAVE 3 -- Parallel (all read engine + types, none modify them)
├── Build agent  → middleware.ts + app/(auth)/login/
├── Build agent  → components/admin/* (WorkItemForm, DependencyModal,
│                  WorkloadTable, BottleneckBanner)
└── Build agent  → components/member/* (TaskCard, BlockedModal,
                   BlockingImpactView) + components/shared/*

  GATE 3: Codereview all components. Check: no engine reimplementation,
          no duplicate logic, correct import paths. tsc --noEmit passes. Commit.

WAVE 4 -- Solo (wires everything together)
└── Build agent  → app/admin/page.tsx + app/member/page.tsx
                   + ProcessFlowDiagram.tsx + app/page.tsx + app/layout.tsx
    Uses: all components from Wave 3 (read-only)

  GATE 4: Full app runs. Demo checklist in Section 17 verified manually.
          Debug agent fixes any runtime errors. Commit.

WAVE 5 -- Optional bonus (only if time permits)
└── Build agent  → Supabase Realtime subscription + bonus features
```

---

## 16 · Agent Mode Reference

| Mode | When to Use | Key Rule |
|------|-------------|----------|
| **Plan** | Schema, seed data, TypeScript interfaces | Must use Context7 MCP for Supabase syntax |
| **Surgical** | dependencyEngine.ts only | Pure functions, no imports from Supabase or React |
| **Build** | UI components, pages, routing, Supabase client | Use Context7 before any route or hook |
| **Codereview** | Every gate checkpoint | Check contracts match Section 07, no engine reimplementation |
| **FeatureHealth** | Gate 2 only -- dependency engine | Test all 6 scenarios in Section 17 |
| **Debug** | Gate 4 -- runtime errors | Fix only the specific error, do not refactor working code |

---

## 17 · Demo Day Checklist -- Every Item Must Pass

Run through these manually before demo. FeatureHealth agent verifies logic items.

**Auth**
- [ ] admin@nestup.com logs in → lands on /admin
- [ ] alex@nestup.com logs in → lands on /member, sees only his tasks
- [ ] Wrong password → inline error shown, no crash

**Seed Data Integrity (on first load)**
- [ ] Item B ("Frontend Development") is `in-progress`, NOT blocked (A=60% >= threshold 50%)
- [ ] Items C, E, F are `blocked`
- [ ] Item D ("Data Pipeline Setup") is independent, `in-progress`
- [ ] Item C is shown in bottleneck banner (blocks E and F)

**Dependency Logic**
- [ ] Set Item B progress to 100% → Item C automatically unblocks → becomes `in-progress`
- [ ] Set Item C to 100% → Items E and F both unblock simultaneously
- [ ] Try adding dependency: Item G → Item A (would create cycle) → red inline banner shows cycle path
- [ ] Set threshold=0 on any new dependency → successor is never blocked

**Admin Dashboard**
- [ ] KPI numbers are correct and live
- [ ] Process flow diagram shows correct node colors
- [ ] Edge between A and B is dashed + labeled "Partial 50%"
- [ ] Edge between B and C is solid + labeled "Full"
- [ ] Clicking a node shows side panel with item details
- [ ] Workload table shows all members with scores

**Member Dashboard**
- [ ] Progress slider updates Supabase and cascades immediately
- [ ] "Blocking Others" section shows downstream impact
- [ ] "Mark as Blocked" saves reason to DB

---

## 18 · Demo Questions -- Know These Cold

**Q: Explain the dependency algorithm step by step.**
> When a new dependency A→B is proposed, I run DFS starting from B through all
> its successors. If the traversal ever reaches A, a cycle would form -- I reject
> immediately and show the cycle path. For cascade updates: when any item's progress
> changes, I run BFS from that item through all successors and re-evaluate each
> one's blocked status using the threshold comparison. Both run in O(V+E) time.

**Q: What breaks if threshold is set to 0?**
> Without special handling, a threshold of 0 would permanently block the successor
> because predecessor.progress starts at 0, and 0 < 0 is false -- actually it passes.
> But threshold=0 is semantically meaningless as a dependency, so we treat it as
> "never blocks" explicitly in isItemBlocked() -- if threshold===0, skip that dep.
> This prevents admin mistakes from breaking the dependency chain.

**Q: What if a member is overloaded?**
> The workload score system catches this: critical=4, high=3, medium=2, low=1 points
> per active task. If total exceeds 15, a red badge shows on their name everywhere.
> The auto-assign suggestion also deprioritizes overloaded members automatically.

**Q: Partial vs full -- what's actually different?**
> Only the threshold value. Full always has threshold=100 -- predecessor must be
> completely done. Partial has an admin-defined threshold -- work can start earlier.
> Both use the exact same isItemBlocked() comparison: progress < threshold.
> The type field is essentially metadata for the UI label and for forcing threshold=100.

**Q: How would this scale to 10,000 tasks?**
> The current client-side cascade is fine for small teams. At scale, I'd move the
> cascade to a Supabase Database Function triggered on work_items UPDATE, so it runs
> server-side in PostgreSQL using a recursive CTE -- same BFS logic but in SQL.
> The React Flow diagram would need virtualization (only render visible nodes) and
> pagination or filtering by team/sprint.

---

## 19 · Hard Rules for Every Agent Session

1. Read this file completely before writing any code
2. Section 07 (Shared Contracts) is read-only -- never modify WorkStatus, threshold rules, or scoring formula
3. `dependencyEngine.ts` functions must be pure -- no Supabase, no React, no mutation
4. Circular detection error must display inline in DependencyModal -- not console.log, not toast
5. Cascade runs client-side (Section 13 pattern) -- not Edge Functions
6. Use Context7 MCP before writing any Supabase query or Next.js route pattern
7. Use Exa MCP only for React Flow / dagre layout examples
8. Never use `any` TypeScript type in types/index.ts or dependencyEngine.ts
9. Never reimplement engine logic inside components -- always import from utils/dependencyEngine.ts
10. Never start Wave N+1 before Gate N passes (tsc --noEmit clean + Codereview done)
11. Do not use localStorage or sessionStorage -- Supabase handles session persistence
12. Seed data credentials are: admin@nestup.com and member emails, all password Demo1234!

---

## 20 · README.md Specification (Submit With Repo)

**Agent instruction:** After full build is complete, Build agent writes README.md
in project root. This is submitted to tech@nestup.com alongside the repo link.

README must cover these sections in plain English:

**Project Overview**
- What NestUp Work Process Tracker does in 2-3 sentences
- Tech stack list with one-line reason for each choice

**How to Run Locally**
- Prerequisites (Node 18+, Supabase account)
- Step-by-step: clone → npm install → .env.local setup → supabase schema + seed → npm run dev
- Default login credentials for demo (admin@nestup.com / Demo1234!)

**System Architecture**
- Brief description of the 3-layer system (Users, Work Items, Dependencies)
- Where the dependency engine lives and why it's isolated as pure functions
- How cascade status update works (one paragraph, plain English)
- Client-side cascade decision and why (not Edge Functions)

**Dependency Algorithm Explained**
- hasCycle(): DFS explanation in plain English
- cascadeStatusUpdate(): BFS explanation in plain English
- isItemBlocked(): threshold comparison explanation
- Include a simple text diagram of the demo chain:
  A(60%) --[partial 50%]--> B --[full 100%]--> C --[full 100%]--> E
                                                └--[full 100%]--> F

**Edge Cases Handled**
- Circular dependency detection with example
- threshold=0 behaviour
- Member overload detection
- Progress=100 overrides blocked status

**Scalability Considerations**
- Current approach and its limits
- How it would scale: PostgreSQL recursive CTE for cascade, React Flow virtualization

---

## 21 · UI Decision Explanations (Demo Walkthrough Prep)

The founder will say: *"Walk me through the UI and explain every decision you made."*
Know these answers before demo day.

**Why is the process flow diagram the centerpiece of the admin dashboard?**
> The entire system is about dependency chains -- so the most important thing an admin
> needs to see is the chain itself. Putting the graph front and center makes the
> system's state immediately scannable without reading any table.

**Why node colors red/amber/green?**
> Universal status language -- no legend needed. Admin sees blocked items (red) at a
> glance without reading text. This matters when you have 20+ items on screen.

**Why dashed edges for partial, solid for full?**
> Dashed visually communicates "not a hard wall" -- work can start partway through.
> Solid communicates a hard dependency. This is a standard graph convention.

**Why is the circular rejection an inline banner, not a toast?**
> A toast disappears after 3 seconds. This is a rejected action the admin must
> understand -- the cycle path needs to be readable and persistent until dismissed.
> Inline banners are for errors that require user comprehension, not just awareness.

**Why does the member dashboard show "Blocking Others"?**
> Members often don't know their task is holding back a teammate. Making this visible
> creates accountability and urgency without the admin having to chase them.

**Why is the progress update a slider and not a text input?**
> Progress is a continuous value -- sliders communicate that naturally. A text input
> suggests exact precision which doesn't match how real progress works. Sliders
> are also faster to update on mobile.

**Why client-side cascade and not a database trigger?**
> For a demo with 6-10 items, client-side is instant and fully debuggable in the
> browser. A database trigger adds deployment complexity and a black box I can't
> show or explain during the demo. At production scale I'd move it to PostgreSQL
> recursive CTE -- I can explain exactly how that would work.

**Why Supabase over a custom Express backend?**
> Supabase gives me real auth, real RLS policies, and real persistence in under
> an hour. A custom backend would take the entire 48 hours just to set up auth
> correctly. Using Supabase let me focus on the actual challenge -- the dependency logic.

---

## 22 · Prompt Guide -- Exactly How to Talk to Each Agent

> Use these prompts verbatim or as close as possible.
> Always start every session with: "Read NESTUP_PROJECT.md completely, then..."

---

### WAVE 1 -- Plan Agent (Schema + Types)

**Session 1 -- Schema:**
```
Read NESTUP_PROJECT.md completely, then:
Use Context7 MCP to look up the exact @supabase/ssr Next.js 14 schema
and RLS policy syntax. Then write supabase/schema.sql covering all tables
and RLS policies defined in Section 08. Do not write seed data yet.
After writing, verify: does this schema support all 5 feature areas in Section 03
of the PDF requirements? Report any gaps before finishing.
```

**Session 2 -- Seed Data:**
```
Read NESTUP_PROJECT.md completely, then:
Write supabase/seed.sql using the spec in Section 09. Use Supabase auth
admin user creation pattern. Verify on paper: when the app loads, is Item B
in-progress (not blocked) because A=60% >= threshold 50%? Is Item C a
bottleneck because it blocks both E and F? Show your verification logic
before writing the final SQL.
```

**Session 3 -- Types:**
```
Read NESTUP_PROJECT.md completely, then:
Write types/index.ts using EXACTLY the interfaces in Section 07 Shared Contracts.
Do not add fields, do not change type names, do not add extra status values.
This file is a contract -- every other file depends on it. Run tsc --noEmit
after writing and fix any errors before finishing.
```

---

### GATE 1 -- Codereview Agent

```
Read NESTUP_PROJECT.md completely, then:
Review these files against Section 07 Shared Contracts and Section 08:
- supabase/schema.sql
- supabase/seed.sql
- types/index.ts
Check: Are all field names in schema.sql identical to the TypeScript interfaces?
Are all 3 WorkStatus values present -- exactly 'blocked', 'in-progress', 'done'?
Does seed data match the chain spec in Section 09? Does tsc --noEmit pass?
Report PASS or FAIL per file with specific line numbers for any issues.
```

---

### WAVE 2 -- Surgical Agent (Dependency Engine)

```
Read NESTUP_PROJECT.md completely, then:
Read types/index.ts. Now implement utils/dependencyEngine.ts.
Build all 6 functions defined in Section 10 -- hasCycle, isItemBlocked,
cascadeStatusUpdate, detectBottlenecks, getWorkloadScore, suggestAssignees.
Rules that cannot be broken:
- Pure functions only. Zero Supabase imports. Zero React imports.
- Never mutate input arrays. Always return new arrays.
- threshold=0 means never blocked (Section 07 rule)
- progress=100 sets status='done' and overrides block check
- hasCycle must also return the cycle path string for UI display
Add JSDoc on every function explaining the algorithm in plain English.
After writing, walk through this scenario in comments:
"Item A progress changes to 60%, threshold for A→B is 50%. What does
cascadeStatusUpdate return for Item B's status?" Verify it returns 'in-progress'.
```

---

### GATE 2 -- FeatureHealth Agent

```
Read NESTUP_PROJECT.md completely, then:
Perform a full health check on utils/dependencyEngine.ts against Section 10.
Test each of these 6 scenarios and report PASS/FAIL/PARTIAL:

1. hasCycle: chain A→B→C exists. Proposed dep C→A. Does it return true + cycle path?
2. hasCycle: chain A→B→C exists. Proposed dep A→D (new branch). Does it return false?
3. isItemBlocked: Item B has predecessor A with threshold=50. A.progress=49. Blocked?
4. isItemBlocked: threshold=0 on any dep. Is successor NEVER blocked? (Section 07 rule)
5. cascadeStatusUpdate: A changes to 60%, A→B threshold=50. Does B become 'in-progress'?
6. detectBottlenecks: C blocks E and F (both full deps). Is C returned as bottleneck?

For any FAIL, identify exact line in dependencyEngine.ts causing the issue.
```

---

### WAVE 3 -- Build Agent (3 Parallel Sessions)

**Session A -- Supabase Client + Middleware:**
```
Read NESTUP_PROJECT.md completely, then:
Use Context7 MCP to get the exact @supabase/ssr createBrowserClient and
createServerClient pattern for Next.js 14 App Router.
Write:
1. lib/supabase-browser.ts -- browser client singleton
2. lib/supabase-server.ts -- server client with cookies()
3. middleware.ts -- route protection following Section 11 logic exactly
Test middleware logic against these cases:
- No session → redirect to /login
- Admin session → /admin allowed, /member redirects to /admin
- Member session → /member allowed, /admin redirects to /member
```

**Session B -- Admin Components:**
```
Read NESTUP_PROJECT.md completely, then:
Read types/index.ts and utils/dependencyEngine.ts (do not modify either).
Build these components using Section 12 Admin Dashboard requirements:
- components/admin/WorkItemForm.tsx
- components/admin/DependencyModal.tsx (must show inline cycle error banner from Section 12)
- components/admin/WorkloadTable.tsx (overload badge at score > 15)
- components/admin/BottleneckBanner.tsx
- components/admin/ProcessFlowDiagram.tsx (React Flow with dagre layout, Section 12 spec)
Use Context7 MCP to verify @xyflow/react v12 API before writing the diagram.
Never reimplement any logic from dependencyEngine.ts -- always import it.
```

**Session C -- Member Components + Shared:**
```
Read NESTUP_PROJECT.md completely, then:
Read types/index.ts and utils/dependencyEngine.ts (do not modify either).
Build these components using Section 12 Member Dashboard requirements:
- components/member/TaskCard.tsx (progress slider, cascade trigger pattern from Section 13)
- components/member/BlockedModal.tsx
- components/member/BlockingImpactView.tsx
- components/shared/PriorityBadge.tsx
- components/shared/StatusChip.tsx
The cascade trigger in TaskCard must follow the exact 7-step pattern in Section 13.
Never reimplement isItemBlocked or cascade logic inline -- import from dependencyEngine.ts.
```

---

### GATE 3 -- Codereview Agent

```
Read NESTUP_PROJECT.md completely, then:
Review all components from Wave 3. Check for:
1. Any reimplementation of engine logic inside components (FAIL if found)
2. cascade trigger in TaskCard matches Section 13 exactly (7 steps in order)
3. DependencyModal shows inline banner (not toast) on cycle detection
4. ProcessFlowDiagram uses @xyflow/react v12 API (not deprecated react-flow-renderer)
5. All TypeScript types imported from types/index.ts -- no inline type redefinitions
6. tsc --noEmit passes with zero errors
Report PASS/FAIL per component with line numbers.
```

---

### WAVE 4 -- Build Agent (Routing + Pages)

```
Read NESTUP_PROJECT.md completely, then:
Read all components from Wave 3 (do not modify them).
Wire everything together:
- app/layout.tsx -- base layout, Tailwind, font
- app/page.tsx -- redirect by role (admin→/admin, member→/member, none→/login)
- app/(auth)/login/page.tsx -- uses LoginForm, Supabase signInWithPassword
- app/admin/page.tsx -- AdminDashboard assembling all admin components
- app/member/page.tsx -- MemberDashboard assembling all member components
Verify Section 17 Demo Checklist items can all be triggered from the UI.
```

---

### GATE 4 -- Debug Agent

```
Read NESTUP_PROJECT.md completely, then:
Run through Section 17 Demo Day Checklist manually. For each item that fails,
identify the exact file + line causing the failure and fix it.
Fix only what is broken -- do not refactor working code.
After all fixes: tsc --noEmit must pass. App must run without console errors.
```

---

### WAVE 5 -- Build Agent (Bonus Features)

```
Read NESTUP_PROJECT.md completely, then:
Core is complete. Now add bonus features from Section 14 in this order:
1. Overload badge (easiest -- just UI using getWorkloadScore() already built)
2. Auto-assign suggestion (suggestAssignees() already built -- wire to WorkItemForm)
3. Supabase Realtime on admin dashboard (use Context7 for channel subscription syntax)
4. Estimated completion on TaskCard (add progress_history jsonb column to work_items,
   store timestamps with each progress update, calculate daily avg rate)
Do them one at a time. After each, verify existing checklist still passes.
```

---

### FINAL -- Build Agent (README)

```
Read NESTUP_PROJECT.md completely, then:
Write README.md following the spec in Section 20 exactly.
Include the dependency chain text diagram from Section 20.
This will be submitted to tech@nestup.com with the repo link.
Make it clear, professional, and written for someone who hasn't seen the code.
```
