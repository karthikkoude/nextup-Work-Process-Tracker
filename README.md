# NestUp Work Process Tracker

A web application for managing work items with dependency chains. Admins create tasks, define dependencies, and monitor bottlenecks. Members update their own task progress, and the system automatically blocks or unblocks downstream tasks based on dependency thresholds.

## Tech Stack

| Tool | Version | Why |
|------|---------|-----|
| **Next.js 16 (App Router)** | 16.2.2 | Server-side rendering, Turbopack, and proxy-based route protection |
| **React** | 19.2.4 | Latest React with automatic JSX runtime and improved rendering |
| **TypeScript (strict)** | 6.0.2 | Type safety prevents runtime errors in dependency logic |
| **Supabase Auth** | 2.101.1 | Real role-based authentication with persistent sessions |
| **Supabase SSR** | 0.10.0 | Framework-agnostic SSR client with lazy session initialization |
| **@xyflow/react** | 12.10.2 | Interactive process flow diagram with node/edge visualization |
| **@dagrejs/dagre** | 3.0.0 | Automatic left-to-right graph layout for dependency chains |
| **Tailwind CSS** | 4.2.2 | CSS-first utility styling with zero configuration |
| **pnpm** | 10.x | Fast, disk-efficient package manager |

---

## How to Run Locally

### Prerequisites

- Node.js 18 or later
- pnpm (`npm install -g pnpm`)
- A Supabase account and project ([supabase.com](https://supabase.com))

### Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd nestup-tracker
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file in the project root with your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

   Find these values in your Supabase Dashboard → Project Settings → API.

4. **Set up the database**

   Run the schema and seed SQL files in your Supabase SQL Editor:
   - `supabase/schema.sql` — creates tables and Row Level Security policies
   - `supabase/seed.sql` — populates demo users, work items, and dependencies

5. **Start the development server**
   ```bash
   pnpm dev
   ```

   The app will be available at `http://localhost:3000`.

### Demo Credentials

All accounts use the password: **Demo1234!**

| Email | Role |
|-------|------|
| admin@nestup.com | Admin |
| sarah@nestup.com | Admin |
| alex@nestup.com | Member |
| priya@nestup.com | Member |
| carlos@nestup.com | Member |
| nina@nestup.com | Member |

---

## System Architecture

### Three-Layer Data Model

The system is built around three interconnected entities:

1. **Users** — Admins and Members. Admins manage the full system. Members see and update only their assigned tasks.
2. **Work Items** — Individual tasks with a title, priority, progress (0–100%), status, and an assigned member.
3. **Dependencies** — Directed links between work items. A dependency from Item A to Item B means B cannot start until A reaches a defined progress threshold.

### The Dependency Engine

The core logic lives in `utils/dependencyEngine.ts` as a set of pure functions. It is intentionally isolated from Supabase, React, and all side effects. This separation means the algorithm can be tested, reasoned about, and verified independently of the UI or database layer.

### Cascade Status Update

When a member updates their task progress, the system runs a cascade: it checks every downstream task that depends on the changed item, re-evaluates whether each is still blocked based on the new progress, and updates their statuses accordingly. This ensures that if Task A reaches its threshold, Task B automatically transitions from "blocked" to "in-progress" without any manual intervention.

### Client-Side Cascade

The cascade runs on the client after each Supabase mutation, not in a database trigger or Edge Function. This choice was made because it is simpler to demonstrate, fully debuggable in the browser, and introduces no deployment risk. At production scale, the cascade would move to a PostgreSQL function using a recursive CTE.

---

## Dependency Algorithm Explained

### Cycle Detection — `hasCycle()`

Before a new dependency is created, the system checks whether it would form a circular chain. It uses **Depth-First Search (DFS)**: starting from the proposed successor, it follows all existing dependency links. If the traversal ever reaches the proposed predecessor, a cycle would form and the dependency is rejected. The full cycle path is returned and displayed to the user.

### Blocked Status — `isItemBlocked()`

For any work item, the system finds all its predecessor dependencies and compares each predecessor's current progress against the required threshold. If **any** predecessor has not yet reached its threshold, the item is blocked. A threshold of 0 is treated as "never blocks" to prevent accidental chain breakage.

### Cascade Update — `cascadeStatusUpdate()`

When an item's progress changes, the system uses **Breadth-First Search (BFS)** to propagate the effect through all downstream items. It processes items level by level — first the direct successors, then their successors, and so on — re-evaluating each one's blocked status as it goes. An item at 100% progress is always set to "done," overriding any block check.

### Demo Dependency Chain

```
A(60%) --[partial 50%]--> B(0%) --[full 100%]--> C(0%) --[full 100%]--> E(0%)
                                                └--[full 100%]--> F(0%)

D(30%) — independent, no dependencies
G(0%)  — no dependencies (used for circular rejection demo)
```

On load: B is **in-progress** (A=60% ≥ threshold 50%). C, E, and F are **blocked**. D is independent. Item C is a bottleneck — it blocks both E and F.

---

## Edge Cases Handled

- **Circular dependency detection** — Attempting to add a dependency that would create a cycle (e.g., G → A when A → B → C → G already exists) is rejected with an inline error showing the full cycle path.
- **Threshold of 0** — A dependency with threshold=0 is treated as "never blocks" to prevent meaningless dependencies from breaking chains.
- **Member overload detection** — Each member has a workload score (critical=4, high=3, medium=2, low=1 points per active task). A red badge appears when the score exceeds 15.
- **Progress=100 overrides blocked status** — When a task reaches 100%, it is always marked "done" regardless of any dependency blocks.
- **Self-dependency prevention** — The database enforces that an item cannot depend on itself.
- **Role-based access control** — Members can only see and update their own tasks. Row Level Security policies enforce this at the database level.

---

## Scalability Considerations

### Current Approach

The system is designed for small teams (6–10 items). The dependency engine runs client-side with O(V+E) time complexity for both cycle detection (DFS) and cascade updates (BFS). This is instant at small scale.

### Scaling to Larger Teams

At scale (1,000+ tasks), the following changes would be made:

- **Server-side cascade** — Move the cascade logic into a Supabase Database Function triggered on `work_items` UPDATE, using a recursive Common Table Expression (CTE) in PostgreSQL. This eliminates client-side latency and ensures consistency.
- **React Flow virtualization** — Only render nodes visible in the viewport. Paginate or filter the diagram by team, sprint, or project.
- **Indexed queries** — Add database indexes on `assigned_to`, `status`, and dependency foreign keys to keep lookups fast.
- **Batched updates** — Replace individual Supabase calls with batched upserts for cascade changes.
