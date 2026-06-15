
# Sales Agent Leads Table — Row Numbers + Sortable Assigned Date

Small UI tweak to `src/components/Admin/SalesAgentLeads.tsx`. No DB changes.

## Changes

1. **Row number column (`#`)**
   - Add a new first `TableHead` labeled `#` (narrow, ~12rem-12).
   - In `leads.map((lead, index) => ...)` render a `TableCell` with `{index + 1}` localized via `toLocaleString('fa-IR')`.
   - Update the empty-state `colSpan` from `8` to `9`.

2. **Assigned date column — already exists ("تاریخ واگذاری")**
   - Keep the column as is.
   - Make the header clickable to toggle sort order (newest ↔ oldest) for easy filtering by assignment time:
     - Add `assignedSort` state: `'desc' | 'asc'` (default `'desc'`).
     - Sort `leads` by `assigned_at` according to `assignedSort` inside the existing filter `useEffect` (final step after current filtering).
     - Render the header as a button with an up/down arrow icon (`ArrowUp` / `ArrowDown` from lucide-react) reflecting current direction; click flips it.

## Files touched
- `src/components/Admin/SalesAgentLeads.tsx` only.

No data model, RLS, or backend changes are required — `assigned_at` is already selected and displayed.
