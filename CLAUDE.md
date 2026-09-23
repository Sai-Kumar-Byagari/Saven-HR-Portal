# Saven HR Portal — Working Agreement

## Authoritative rule documents

Read these before writing frontend code. They are the user's standards and override
any default preference of mine:

- `frontend/docs/FRONTEND_RULES.md` — coding standards and best practices (**authoritative**)
- `frontend/docs/ARCHITECTURE.md` — architecture reference (**⚠ written for a different project — see Reconciliation**)
- `frontend/docs/COMPONENT_GUIDELINES.md` — component reference (**⚠ written for a different project — see Reconciliation**)

## Project

Internal HR platform for Saven Technologies (Hyderabad). Monorepo:

- `frontend/` — React 18 + Vite 5, **TypeScript** (incremental via `allowJs`; foundation,
  primitives and the auth module are `.ts`/`.tsx`, the other 12 feature modules are still `.jsx`)
- `backend/` — Express + Sequelize + MySQL
- `db/` — schema.sql, ER diagram

6 roles: `super_admin` (labelled **CEO**), `manager`, `hr`, `employee`, `it`, `payroll`.
Role-based navigation via `frontend/src/data/navigation/sidebarConfig.js` + `components/common/RoleRoute.jsx`.

Local dev: MySQL80 service, seeded admin `admin@saven.tech` / `Admin@1234`.

## Folder structure — now matches ODR (D:\ODR_Portal\...\odr_portal) exactly

On 2026-09-10 the user pointed at the real ODR Dispute Portal codebase and asked for the
same `src/` layout and the same coding standards, module by module. The frontend was
restructured to ODR's actual tree:

```
src/
├── api/            axiosInstance.ts (the client) + endpoints.ts (route paths) —
│                   exactly ODR's two files, plus 20 not-yet-migrated legacy
│                   *.api.js and a axios.js compat re-export (see below)
├── assets/styles/  variables.css + components.css + index.css (was styles/, index.css)
├── components/
│   ├── <flat>.tsx      shared primitives — Button, Input, Card, DataTable... (was ui/)
│   ├── common/         ErrorBoundary, InlineMessage, SubmitButton, ProtectedRoute, RoleRoute
│   ├── layout/         AuthLayout, DashboardLayout, AppRouter, AuthWrapper, Sidebar, Topbar
│   └── <domain>/       per-feature subfolders, built as each module migrates
├── constants/       env.ts, roles.js, routes.ts (was config/)
├── data/navigation/  sidebarConfig.js (was config/sidebarConfig.js)
├── hooks/            flat, one per concern — useLogin.ts, usePermission.ts
├── pages/            flat, one file per screen, test colocated beside it (was tests/)
├── redux/slices/     flat, one per domain — authSlice.ts (plain reducers, no thunks)
├── services/         flat, one per domain — authService.ts, authStorage.ts, logService.ts,
│                   queryClient.js (http client itself lives in api/, see above)
├── store/            the 3 remaining Zustand stores (authStore.js is now a shim, see below)
├── types/            flat, one per domain — auth.types.ts, models.types.ts, enums.ts
└── utils/            apiError.ts, authNavigation.ts, testUtils.tsx, testFixtures.ts...
```

No `tests/` folder, no barrel `index.ts` anywhere (both existed briefly, both removed to
match ODR). Tests live beside the file they cover.

## Four decisions the user made, matching ODR exactly (2026-09-10)

Each was a real conflict between what I'd already built and ODR's actual shipped code.
The user chose ODR's pattern in all four cases — apply this to every future module:

1. **No `createAsyncThunk`.** ODR's slices are plain synchronous reducers only
   (`setLoading` / `setError` / `setAuthSuccess` / `setAuthFailure` / `logout` /
   `setHydrated`); the async orchestration (call the service, dispatch in sequence,
   catch) lives in a hook, not in the slice. `redux/createApiThunk.ts` is **deleted**.
   `redux/slices/authSlice.ts` is the reference shape — copy it.
2. **No typed Redux hooks.** `hooks/useAppDispatch.ts` / `useAppSelector.ts` are
   **deleted**. Every component uses raw `useDispatch()` / `useSelector((state:
   RootState) => ...)` with the type annotated inline at the call site, exactly like
   ODR — it has no wrapper hook anywhere.
3. **No `react-hook-form` / `zod` in migrated modules.** `hooks/useLogin.ts` hand-validates
   (`validateWorkEmail`/`validatePassword` returning `string | null`), matching ODR's
   `useAuth.ts`. The password field is an uncontrolled ref (ODR's own security rationale:
   the value never sits in React state for an inspector to read back). **The other 26
   pages still use RHF+Zod** — this is a deliberate, temporary inconsistency until each
   of those modules migrates the same way. Do not "fix" one without the other.
4. **No barrel exports.** Every component is imported by direct file path
   (`@/components/Button`, never `@/components`). Do not recreate `components/index.ts`.

Also aligned without a separate question, as a direct consequence of the above and low
risk to change: `redux/store.ts` inlines its reducer object (no `rootReducer.ts` +
`combineReducers`, matching ODR's `store.ts` exactly); no selector functions are exported
from slices (call sites read `state.auth.*` inline, matching ODR).

5. **`api/` is exactly two files in ODR** — `axiosInstance.ts` (client + interceptors)
   and `endpoints.ts` (route-path strings only), with the actual per-domain call
   functions living in `services/*.ts`. Caught on 2026-09-10 after the fact (the auth
   module had put the client in `services/http.ts` instead). Moved:
   `services/http.ts` → `api/axiosInstance.ts`; added `api/endpoints.ts` with an `AUTH`
   group; `authService.ts` now calls `API_ENDPOINTS.AUTH.*` instead of literal path
   strings. `api/axios.js` is still a compatibility re-export (now pointing at
   `axiosInstance.ts`) for the **20 remaining legacy `*.api.js` files** — those still
   belong to unmigrated modules and are untouched. Add an endpoint group to
   `endpoints.ts` only when its module's `services/*.ts` is being built; an unused group
   is dead weight with no test coverage. `api/auth.api.js` specifically stays in place
   because `pages/auth/FirstLoginSetPasswordPage.jsx` (not yet migrated) still imports
   it — delete it only when that page migrates.

**Kept as deliberate Saven-specific deviations from ODR** (asked about only implicitly;
reasoning is inline where each lives):
- `accessToken` stays in `AuthState` and in `services/authStorage.ts` (ODR has neither —
  its tokens live only in httpOnly cookies, which Saven's backend doesn't yet set; see
  the blocked item below). One field, documented in `types/auth.types.ts`, disappears
  the day the cookie migration lands.
- `services/logService.ts` stays batched/throttled and ships only `error`/`fatal`
  remotely (ODR ships every level, unbatched, immediately). A wrong password is routine
  user behaviour, not a paged-worthy event — see the comment in `authService.login`.
- `Input`/`Select`/`Textarea` keep `useId`, `aria-invalid`, `aria-describedby` and a
  Caps Lock warning even though ODR's own `FormInput.tsx` has none of that — FRONTEND_RULES.md's
  accessibility bar is stricter than ODR's actual shipped components, and it stays authoritative.
- ESLint stays at the stricter config already built (type-aware rules, `jsx-a11y`,
  `no-explicit-any` ban, Prettier) — ODR's own `eslint.config.js` only lints `.js`/`.jsx`
  with zero TypeScript or accessibility rules. Matching that literally would mean
  deleting the enforcement of rules FRONTEND_RULES.md explicitly asks for.

**Done — tooling:** ESLint 9 flat config (`eslint.config.js`) + Prettier, every rule
annotated against the standard it enforces. `npm run verify` = typecheck + lint + test.
**Lint gate is green: 0 errors**, 40 warnings, all in unmigrated `.jsx`.

**Done — Tier 1 primitives** (all in `components/`, flat, no barrel): `Field`, `Select`,
`Textarea`, `Checkbox`, `Toggle`, `PageHeader`, `Card` (+Header/Body/Footer), `EmptyState`,
`Skeleton` (+Text/Table/Cards), `DataTable` (+Cards/States/utils/types). 78 tests passing.

**Done — auth module:** `redux/slices/authSlice.ts` (plain reducers), `services/authService.ts`
(object-literal, try/catch + `logService` per method), `services/authStorage.ts`,
`hooks/useLogin.ts` (hand-rolled validation), `pages/LoginPage.tsx`, `components/layout/AuthLayout.tsx`,
`AuthWrapper`, per-route error boundary in `DashboardLayout`. Verified end-to-end against
the live backend: real login, hard-refresh rehydration on a role-gated route, wrong-password
error path — all pass. Responsive-clean at 1366×768 and 375×812 (full 13-viewport matrix
already covered by the earlier login redesign; unaffected by this rewrite).

**Zustand shim:** `store/authStore.js` is now a Redux-backed compatibility shim
supporting all three legacy call shapes. It exists so the 30 files still reading auth
state need no edits until their module migrates. **Do not use it in new code** — use
`useSelector((s: RootState) => s.auth.user)` / `useDispatch()` directly. Delete it when
no `.jsx` imports it.

**26 dead files deleted** (23 zero-byte, plus unused `AiChat.jsx`, `AttendancePage.jsx`,
`MyTasksPage.jsx`). `store/uiStore.js` and `store/notificationStore.js` are still Zustand.

**Next module:** app shell (Sidebar, Topbar, NotificationPanel) — it owns the `ui` and
`notifications` slices (as plain-reducer slices, per decision 1 above) and the
mobile-drawer responsive work. Then pages, in this order: Dashboard → Employees →
Attendance → Leaves → Recruitment → Interviews → Onboarding → Teams → remainder.

**Still to build:** Tier 2 primitives — `Modal` (focus trap + sticky footer), `Drawer`,
`Tabs`, `Dropdown` (keyboard), `Tooltip`, `Badge`, `Pagination`. Tier 3 — `StatCard`,
`Avatar`, `FileUpload`, `Radio`, `ConfirmDialog`, `CustomRangePicker`.

## Reconciliation — docs vs. actual code vs. the real ODR repo

`ARCHITECTURE.md` and `COMPONENT_GUIDELINES.md` (in `frontend/docs/`) were originally
written for **NeoEdify / Online Dispute Portal**, a different, older description of that
same product. They reference `TicketCard`, `DisputeReasonPicker`, a Federal Bank `Logo`
— names that don't match the actual ODR repo either. On 2026-09-10 the user pointed
directly at the real ODR codebase (`D:\ODR_Portal\ODR_Portal\Dispute_portal\frontend\odr_portal`)
as the standard to follow, superseding both docs' descriptions. `ARCHITECTURE.md` has
been rewritten to describe Saven itself; `COMPONENT_GUIDELINES.md` rewrite is still
outstanding and should now be checked against the real ODR components, not the docs.

Resolved position — what's actually adopted from the real ODR repo:

| Topic | Real ODR | Saven | Status |
|---|---|---|---|
| Language | TypeScript, `allowJs`-free | `allowJs` incremental — foundation + auth module in `.ts`/`.tsx` | **Adopted**, incrementally |
| State | Redux Toolkit, plain reducers, **no thunks** | Same, in `authSlice.ts` | **Adopted exactly** — see the 4-decision list above |
| Redux hooks | Raw `useDispatch`/`useSelector`, no wrapper | Same | **Adopted exactly** |
| Forms | No RHF/Zod anywhere, hand-rolled validation | Same, in `useLogin.ts` only so far | **Adopted for auth**; 26 other pages still RHF+Zod |
| Barrels | None anywhere | None | **Adopted exactly** |
| Icons | `lucide-react` | `react-icons/fi` (already chosen 2026-09-09, before this comparison) | **Kept as-is** — swapping icon libraries mid-migration for no functional gain wasn't worth it |
| Testing | Vitest, colocated `Component.test.tsx` | Vitest, colocated | **Adopted exactly** |
| Folders | `api/ components/{flat,common,layout,<domain>}/ constants/ data/navigation/ hooks/ pages/ redux/slices/ services/ types/ utils/`, no `tests/` | Same tree now | **Adopted exactly** |
| Lint/format | `.js`/`.jsx` only, `eslint.config.js`, no TS rules, no a11y, no Prettier | Type-aware rules + `jsx-a11y` + `no-explicit-any` ban + Prettier, still `eslint.config.js` | **Kept stricter** — see the deviations list above; FRONTEND_RULES.md's bar is higher than ODR's actual code |
| Accessibility in components | No `useId`/`aria-invalid`/`aria-describedby` in `FormInput.tsx` | Kept in `Input`/`Select`/`Textarea` | **Kept stricter**, same reasoning |
| Auth tokens | httpOnly cookies only, nothing in Redux | `accessToken` still in state + `authStorage.ts` | **Blocked on backend** — tracked below, not a standards disagreement |

The `btn-disabled` rule from COMPONENT_GUIDELINES.md applies and is **implemented inside
`components/Button.tsx`**, applied automatically whenever the button is disabled or
loading — call sites never add it by hand.

## Non-negotiable rules (digest of FRONTEND_RULES.md)

**Structure**
- Anything repeating 2+ times becomes a shared component. No duplicate components.
- Split files. No 1000-line files. Group by folder for discoverability.
- Components render UI only. Data fetching, calculations and business logic live in
  hooks / services / utils — never inside a component body.
- Prefer simplicity over cleverness. Do not over-engineer. Choose `useState` vs
  `useReducer` (etc.) based on the actual component, not by habit.

**Resilience**
- Error boundaries around components; the app must **never** go blank. Always render a
  fallback.
- Capture stack traces, log the exact failure point, and ship logs to the backend via
  an API request.

**Security**
- **Never** store JWT/auth tokens in `localStorage` — use httpOnly cookies.
- Encrypt request and response payloads, behind a dev flag that disables it in local dev.
- Wrap token-requiring components in protected routes.

**Performance**
- Route-level code splitting and lazy loading.
- Memoisation to cut unnecessary re-renders — only where it actually helps.
- Debounce / throttle network-triggering input. Only where required.
- `preload` / `prefetch` / `preconnect` / `defer` in `index.html`.
- Design with LCP, CLS and INP in mind.

**Accessibility & SEO**
- Native HTML elements first. ARIA only where native semantics fall short — do not
  over-apply it.
- Correct heading hierarchy (one `h1`, then `h2`, `h3`…). Semantic elements, not divs,
  but do not overuse them.
- **Focus management**: while a modal is open, Tab must never move focus behind or
  outside it. Trap focus, and restore it to the trigger on close.
- Crawlable by search engines.

**Design fidelity**
- Follow the supplied references and images. **Ask before deviating.**
- Keep theme, colours and fonts identical to the references.

**Responsive**
- Laptop and desktop are the priority, but device-specific responsiveness is still
  required. Primary targets: 1920×1080, 1600×900, 1440×900, **1366×768**.

## Known violations still outstanding

Each is a fix, not a rewrite. Items resolved so far are struck through.

**Blocked on a backend release** (do not implement unprompted):

1. **Access token is in `localStorage`.** Now funnelled through
   `services/authStorage.ts`, which is the only file that will change — but the value is
   still persisted. Needs: login to set httpOnly cookies instead of returning
   `accessToken`, a `GET /auth/me`, and auth middleware that reads the cookie.
   The refresh token is *already* an httpOnly cookie, so the pattern is proven.
2. **No request/response encryption.** Needs matching server middleware + session key
   negotiation.
3. **No log-shipping endpoint.** `services/log.service.ts` is built, batched and
   throttled, and currently POSTs to a `/logs/client` that returns 404 (swallowed by
   design). Needs the endpoint.

**Frontend work, unblocked:**

4. ~~Single error boundary~~ — three-level hierarchy is in place.
5. **TypeScript** — foundation + auth module converted; the other 12 feature modules
   are still `.jsx`. `checkJs` stays off until they land.
6. ~~No tests~~ — Vitest + RTL configured, 38 tests on the auth module and primitives.
7. **No ESLint / Prettier** — still unconfigured.
8. **`Modal` has no focus trap** — `components/Modal.jsx` handles Escape and scroll
   lock but does not trap or restore focus. Needs `useFocusTrap`.
9. **Business logic inside components** — still true for the 59 unmigrated pages
   (e.g. `pages/employees/EmployeeListPage.jsx`, `pages/dashboard/AdminDashboard.jsx`).
   Fixed per module as each migrates; `hooks/useLogin.ts` is the pattern.
10. **~70 raw `<input>`/`<select>`/`<textarea>`** across 26 pages bypass the shared
    controls, so they carry no error state, `id`/`htmlFor` pairing or `aria-invalid`.
    `Input`, `Select`, `Textarea`, `Checkbox` and `Toggle` are all built and tested —
    each swap is now markup-only, since `register()` spreads onto them unchanged.
11. **7 hand-rolled `<table>`s** bypass the shared table; 4 lack a horizontal scroll
    container. `DataTable` is built and tested and absorbs all of them.
13. **The password-validation regex is duplicated in 3 files** —
    `FirstLoginSetPasswordPage.jsx`, `EmployeeDetailPage.jsx`, `SettingsPage.jsx`.
    It belongs in `utils/validators.ts`. Do not rewrite it to satisfy `no-useless-escape`;
    move it as-is.
14. **Org chart connector bar is over-constrained** — `OrgChartPage.jsx` sets left, right
    and `width: 100%` on the sibling connector, so CSS ignores `right` and the bar is
    likely wider than the row. Dead duplicate keys removed; geometry fix still open.
12. ~~Dead files~~ — 26 deleted.

## Gotchas learned the hard way

- **Root font-size is 15px**, so Tailwind's rem scale runs 6.25% short: `w-10` is 37.5px,
  not 40. Check any 40px+ touch-target against this, or use explicit px.
- **All CSS `@import`s must precede every other rule.** An `@import` placed after the
  `@tailwind` directives is invalid and is dropped silently — it took the entire
  component layer with it and produced an invisible submit button.
- Tailwind config changes need a **dev-server restart**; HMR will not pick up a new
  colour scale, and the stale build shows up as transparent backgrounds.

## Current phase

UI/UX redesign of the existing app. **Presentation layer only** — no changes to API
endpoints, payloads, routes, business logic, validation rules, CRUD behaviour, or
backend/env/db files. Screens are being frozen with management first via an HTML
prototype (`docs/UI-MOCKUP-PROMPTS.md` at the monorepo root).

Anything in the rules that requires a backend or contract change (items 1–3 above) is
**out of scope for this phase** — surface it, do not implement it unprompted.
