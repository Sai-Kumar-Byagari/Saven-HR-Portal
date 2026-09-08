# Saven HR Portal — UI Mockup Prompts for Claude Chat

Purpose: generate a **clickable HTML prototype with mock data** to freeze UI screens with
management before refactoring the real React app.

Grounded in an audit of the actual codebase (React 18 + Vite + Tailwind, 60 pages,
6 roles, 10 sidebar groups). Field names, statuses, roles and nav items below are the
**real ones** from the repo, so approved screens map 1:1 onto the existing components.

---

## How to use

1. Open a **new Claude chat** (claude.ai). Ask for the output as an **Artifact**.
2. Paste **PROMPT 1** (Foundation + Shell + 6 core screens). Let it finish.
3. Paste **PROMPT 2**, then **3**, then **4** in the *same* conversation — each one
   extends the same artifact rather than starting over.
4. Use the **Refinement prompts** at the end for responsive QA and polish passes.
5. Export/screenshot for the manager review. Freeze. Then implement in React.

Do not paste all prompts at once — you will hit response limits mid-screen.

---

# PROMPT 1 — Foundation, app shell, and core screens

```
You are a Senior Product Designer and Senior Frontend Engineer specialising in
enterprise SaaS. I need a high-fidelity, clickable HTML prototype of an HR portal so
I can freeze the UI with my management team before refactoring the real React app.

Build it as a SINGLE self-contained HTML artifact. This is a design prototype with
mock data — no backend, no API calls.

## PRODUCT CONTEXT

"Saven HR Portal" — an internal HR platform for Saven Technologies (Hyderabad, India).
It is used PRIMARILY on laptops and desktops (1366x768 to 1920x1080); tablet and mobile
must work correctly but are secondary. Data density matters more than whitespace: HR
staff scan large tables all day.

Target quality bar: Rippling, Workday, HiBob, Deel, BambooHR. Premium, calm,
information-dense enterprise software. NOT a colourful startup dashboard.

## BRAND IDENTITY — KEEP THESE (the app already uses them, management must recognise it)

- Dark navy sidebar:  #0D1520
- Primary brand blue: #2563EB
- App canvas:         #F5F6FA
- Card surface:       #FFFFFF
- Font: Inter (Google Fonts), root font-size 15px
- Logo: a 96x56 rectangular placeholder block reading "SAVEN" in the sidebar header

## DESIGN SYSTEM — define this FIRST as CSS custom properties, then use it everywhere

Colour tokens:
  --brand-50 #EFF6FF  --brand-100 #DBEAFE  --brand-600 #2563EB  --brand-700 #1D4ED8
  --ink-900 #0B1220 (headings)   --ink-700 #334155 (body)
  --ink-500 #64748B (secondary)  --ink-400 #94A3B8 (meta only, never body copy)
  --line #E5E7EB  --line-strong #D1D5DB  --line-subtle #F1F5F9
  --canvas #F5F6FA  --surface #FFFFFF  --raised #FAFBFC
  --success-50 #ECFDF5 / -600 #059669 / -700 #047857
  --warning-50 #FFFBEB / -600 #D97706 / -700 #B45309
  --danger-50  #FEF2F2 / -600 #DC2626 / -700 #B91C1C
  --info-50    #EFF6FF / -600 #2563EB / -700 #1D4ED8

Every text colour must pass WCAG AA (4.5:1) on its background. Never use #94A3B8 or
lighter for body text, labels, or table cells — meta/timestamps only.

Typography scale (compressed, enterprise-dense):
  page title    20px / 28px / 600 / -0.01em
  page desc     13px / 20px / 400 / --ink-500
  section head  15px / 22px / 600
  card title    14px / 20px / 600
  body          13px / 20px / 400 / --ink-700
  label         13px / 18px / 500 / --ink-700
  helper        12px / 16px / 400 / --ink-500
  table header  11px / 16px / 600 / uppercase / 0.06em / --ink-500
  table cell    13px / 20px
  meta          11px / 16px / --ink-400

Spacing: 4px base. Page padding 28px desktop, 24px laptop, 16px mobile.
Page section gap 24px. Card padding 20px. Form field gap 16px. Table cell 16px/12px.

Radius: controls 10px, cards 14px, modals 18px, pills 999px.
Borders: 1px --line only. One weight everywhere.
Shadow — exactly three levels, subtle:
  rest    0 1px 3px rgba(0,0,0,.06), 0 1px 2px -1px rgba(0,0,0,.04)
  hover   0 4px 12px rgba(0,0,0,.08)
  overlay 0 12px 32px rgba(0,0,0,.14)

BANNED: gradients (except one small AI accent mark), glassmorphism, neon, emoji as UI
icons, decorative illustrations, animations over 200ms, more than 3 shadow levels,
oversized rounded "bubble" cards, drop shadows on text.

## ICONS — no emoji anywhere in the UI

Define ONE inline SVG sprite at the top of <body>:
  <svg style="display:none"><symbol id="i-dashboard" viewBox="0 0 24 24">...</symbol>...</svg>
Reference with <svg class="ico"><use href="#i-dashboard"/></svg>.
Style: 24x24 viewBox, stroke-only, stroke-width 1.7, round caps/joins (Lucide/Feather
style). Sidebar icons 17px, buttons 15px, table actions 15px, empty states 40px.

Icons needed: dashboard, org-chart, users, user-cog, user-plus, clock, clipboard,
bar-chart, calendar, calendar-off, calendar-check, plus-circle, check-circle, briefcase,
file-text, file-plus, video, message-square, inbox, receipt, rupee, log-out, shield,
settings, search, bell, chevron-left/right/down, x, menu, filter, download, eye, edit,
trash, alert-triangle, more-vertical, arrow-right, upload, mail, phone, map-pin.

## APP SHELL

Left sidebar, 240px expanded / 64px collapsed, background #0D1520, full height, fixed.
  - Header 58px: SAVEN logo block, and a collapse chevron on the right.
  - Nav: grouped. Group labels 10px/700/uppercase/0.12em at rgba(255,255,255,.28),
    with 16px top padding. Items 13px/500, 8px vertical padding, 10px radius,
    8px side margin.
      rest   rgba(255,255,255,.48) text, icon .40
      hover  #FFFFFF text on rgba(255,255,255,.06)
      ACTIVE #93C5FD text on rgba(59,130,246,.16), plus a 3px full-height #3B82F6
             bar flush to the sidebar's left edge  <- this is the key upgrade
  - Footer: avatar + name + role + logout icon button.
  - Collapsed state: icons centred, group labels become a 1px divider, tooltips on hover.

The exact nav structure (do not add or remove items):
  Dashboard
  ORGANISATION      Org Chart · Directory · Employee Management · Onboarding ·
                    Verify Forms · My Forms
  TEAMS & PROJECTS  My Teams · My Projects
  ATTENDANCE        My Attendance · Team Attendance · All Attendance
  LEAVES            My Leaves · Apply Leave · Approvals · Management
  RECRUITMENT       Open Positions · My JDs · JD Approvals · Create Position · Interviews
  PEOPLE            Employee Voice · Voice Inbox · Holiday Calendar
  FINANCE           My Payslips · Payroll
  ADMINISTRATION    Policies · Resignation · Resign. Inbox · Audit Logs
  Settings

Top bar, 58px, white, 1px bottom border:
  - Left: breadcrumb  Home / Section / Page  (11px, --ink-500, current page --ink-700)
  - Centre-left: global search, 380px, --raised background, search icon, and a
    "Ctrl K" keycap on the right edge. On focus: white bg + brand border + 3px brand ring.
  - Right: notification bell with a count badge, a 1px vertical divider, then
    avatar + name + role + chevron.

Content area: --canvas background, scrolls independently, 28px padding.

Bottom AI bar (the app has an AI assistant — keep it): 56px, white, top border, pinned
to the bottom of the content column. A small square gradient "sparkle" mark (the ONE
permitted gradient), a single-line input reading "Ask Saven AI anything about your HR
data...", and a send button. Collapsed by default.

## PAGE HEADER PATTERN — use identically on every screen

Row 1: page title (left) + primary action button(s) (right).
Row 2: one-line description, --ink-500.
Row 3 (only when the screen filters data): a toolbar — search input, then filter
selects, then a right-aligned secondary action such as Export.
The toolbar wraps to a second line below 1100px; it never overflows horizontally.

## COMPONENTS — build these once, reuse everywhere

Button — 5 variants, 3 sizes (sm 30px / md 36px / lg 42px), radius 10px, 13px/500,
  150ms transition, and a visible 3px brand focus ring on all of them:
    primary     #2563EB bg, white text, hover #1D4ED8
    secondary   white bg, --line border, --ink-700, hover --raised
    tertiary    transparent, --ink-500, hover --line-subtle bg
    destructive #DC2626 bg, white text
    icon-only   36x36 square, always with aria-label and a tooltip
  States: hover, active, focus-visible, disabled (50% opacity), loading (spinner + label).

Input / Select / Textarea — 36px height (textarea auto), radius 10px, 1px --line,
  13px text, 12px horizontal padding. Focus: --brand-600 border + 3px --brand-100 ring.
  Error: --danger-600 border + --danger-50 bg + 12px error text below with an alert icon.
  Label above at 13px/500. Required marked with a --danger-600 asterisk.
  Disabled: --line-subtle bg, --ink-400 text, not-allowed cursor.
  Select must have a custom chevron, not the native arrow.
  Search input: leading search icon, and a clear (x) button once it has a value.

Checkbox / Radio / Toggle — 16px box, 6px radius, brand fill when checked, white check
  icon. Toggle 36x20 pill with a 16px knob and a 150ms slide.

Card — white, 1px --line, 14px radius, rest shadow. Optional header row
  (14px/600 title + optional action link, 1px bottom border), 20px body,
  optional footer with --raised background. Never nest a bordered card inside a
  bordered card.

KPI stat card — 20px padding. A 40x40 rounded-12px tinted icon square (brand-50 /
  success-50 / warning-50 / danger-50 / a violet #F5F3FF, with the matching -600 icon),
  then a 12px/500 --ink-500 label, then a 26px/700 --ink-900 value, then
  an optional delta row: a small up/down triangle + percentage in --success-600 or
  --danger-600 + " vs last month" in --ink-400. Hover lifts to hover-shadow.

Data table — this is the single most important component. Get it right.
  - Wrapper: white card, 14px radius, overflow hidden, and the scroll container is
    INSIDE the card so the card border is never cut.
  - Header row: --raised background, 1px bottom --line, sticky on vertical scroll,
    11px/600/uppercase/0.06em/--ink-500, 16px/10px padding. Sortable columns show a
    small chevron that darkens on hover.
  - Optional leading checkbox column (28px) for bulk select; when any row is selected,
    the header row is REPLACED by a brand-50 bar reading "3 selected" plus bulk action
    buttons.
  - Rows: 48px tall, 1px --line-subtle bottom border, no zebra striping,
    hover --line-subtle background, 100ms transition. Last row has no border.
  - Cells: 13px, vertically centred, 16px horizontal padding. Numbers and currency
    right-aligned and tabular-nums. Dates as "12 Mar 2025".
  - Identity cell pattern: 32px avatar + two lines (name 13px/500/--ink-900,
    email 11px/--ink-500), both truncated with ellipsis.
  - Actions column: right-aligned, icon-only buttons that stay at 40% opacity and
    rise to full opacity on row hover. Overflow goes into a "more" menu.
  - Long text truncates with ellipsis + a title tooltip. Nothing wraps to two lines
    inside a table cell except a dedicated description column.
  - Footer inside the card: "Showing 1-20 of 248" on the left; on the right a rows-per-page
    select and prev/next icon buttons with page numbers. Always visible, even for one page.

Status badge — 11px/500, 2px/8px padding, 999px radius, tinted background + matching
  600 text + a 1px matching ring at 20% alpha, and a 5px leading dot. Map EXACTLY these
  status values (they are the real ones in the codebase):
    active, approved, accepted, completed, present, hired, shortlisted  -> success
    pending, pending_approval, acknowledged, submitted                  -> warning
    rejected, absent                                                    -> danger
    open, in_progress, on_leave, new                                    -> info
    inactive, closed, draft                                             -> neutral (--ink-500 on --line-subtle)
  Role badges: CEO violet, Manager blue, HR emerald, Employee neutral,
  IT Engineer amber, Payroll Executive sky.

Modal — centred, 18px radius, overlay shadow, backdrop rgba(15,23,42,.45) with a 2px
  blur, 150ms fade + 8px rise. Header: 15px/600 title + optional subtitle + a 28px
  icon-only close button. Body scrolls independently, 20px padding. Footer: --raised
  background, right-aligned Cancel (secondary) + Confirm (primary), and it is STICKY so
  the buttons never scroll out of view. Widths: sm 420 / md 560 / lg 720 / xl 960.
  Destructive confirms get a 40px danger-50 warning icon square at the top-left of the body.

Drawer — right-side panel, 480px, full height, slides in 180ms. Same header/body/footer
  anatomy as Modal. Use it for record detail-peek.

Tabs — underline style. 13px/500 --ink-500, active --ink-900 with a 2px --brand-600
  bottom border, 1px --line rail beneath the whole row, 200ms slide on the indicator.

Empty state — centred in the card, 48px vertical padding: a 48px --line-subtle rounded
  square with a 24px --ink-400 icon, a 14px/600 --ink-900 headline, a 13px/--ink-500
  one-line explanation, and where relevant one primary action button. Write REAL copy,
  e.g. "No employees yet" / "Add your first employee to get started".
  A filtered-to-nothing state is different: "No results for 'zzz'" + a Clear filters button.

Loading state — skeleton shimmer, never a bare centred spinner. Table skeleton = 6 rows
  of grey bars at varying widths. Card skeleton matches the real card's shape.
  Shimmer: --line-subtle to #E8ECF1, 1.4s ease-in-out infinite.

Error state — centred, a 40px danger-50 icon square, "Couldn't load employees",
  a 13px --ink-500 explanation, and a "Try again" secondary button.

Toast — top-right, 320px, white, overlay shadow, 12px radius, a 3px left accent bar in
  the status colour, an icon, a 13px/500 title, an optional 12px body, and a close button.
  Show one success and one error toast in the prototype.

Tooltip — --ink-900 background, white 11px text, 6px radius, 6px/8px padding, 4px offset.

## SCREENS FOR THIS FIRST PROMPT

Build a working client-side router: clicking any sidebar item swaps the content area,
updates the breadcrumb, and sets the active nav state. Use plain JS, no framework.
Every screen must be reachable. Nothing may be a dead link.

Roles in this product (use the real labels): CEO (super_admin), Manager, HR, Employee,
IT Engineer, Payroll Executive.

Build these six screens now:

1. LOGIN
   Split screen. Left 46%: #0D1520 panel with the SAVEN logo, a 34px headline
   "Manage your workforce smarter & faster", a one-line subhead, and four feature rows
   (icon square + title + description) for Employee Management, Leave & Attendance,
   AI-Powered Recruitment, and Payroll Processing. Copyright line pinned at the bottom.
   Right 54%: white, a max-420px form — "Welcome back", description, Work Email input,
   Password input with a show/hide eye toggle, a "Forgot password?" link, a full-width
   primary Sign in button, an "or" divider, and a disabled "Continue with Microsoft
   (Coming Soon)" secondary button with the 4-square Microsoft logo.
   Below 1024px the left panel collapses to a compact navy header strip above the form.

2. DASHBOARD (CEO / admin view)
   - Greeting header: "Good morning, Rajesh" + "Tuesday, 12 March 2025 - Organisation overview".
     No emoji. Right side: a date-range select and an Export report button.
   - A punch-in strip card: live clock, today's date, shift window "09:30 - 18:30",
     a status pill, and a primary "Punch In" button. Show the punched-in variant too:
     "In at 09:34" + elapsed time + a secondary "Punch Out" button.
   - KPI row, 5 cards: Total Employees 248, Present Today 214, On Leave 12,
     Pending Leaves 7, Open Positions 9. Each with a delta.
     Grid: 5 across at >=1536px, 3 at >=1024px, 2 at >=640px, 1 below.
   - Two-column band (2fr / 1fr, stacking at 1280px):
       Left: "Weekly Attendance" card with a grouped bar chart, Mon-Sat, series
         Present / Absent / On Leave in #059669 / #DC2626 / #60A5FA. Hand-draw it as
         inline SVG — no chart library. Include axis labels, horizontal gridlines only,
         a legend with circular swatches, and rounded 3px bar tops.
       Right: "Leave Distribution" donut (inline SVG) with a centre total, plus a
         legend list with values.
   - Two-column band: "Pending Approvals" table (5 rows: employee, type, dates, days,
     action buttons) and a "Recent Activity" timeline list (avatar + text + relative time).
   - "Upcoming Holidays" horizontal strip of 4 small date cards.
   All numbers must look like plausible real HR data, never round placeholders.

3. EMPLOYEE MANAGEMENT (the flagship table screen)
   Page header with an "Add Employee" primary button and an "Export CSV" secondary.
   Toolbar: search by name or email, Role select, Status select, Department select,
   and a "More filters" button. Show two active filter chips with x buttons and a
   "Clear all" link.
   Table columns: checkbox, Employee (avatar + name + email), Emp ID, Role badge,
   Reporting Manager, Date of Joining, Status badge, Actions (view / edit / more).
   20 rows of realistic Indian-name mock data. Emp IDs like SAV0142. Emails
   @saven.tech. Deliberately include one very long name ("Venkata Subrahmanyam
   Aravind Krishnamurthy"), one long email, and one long department name to prove
   truncation works.
   Footer pagination inside the card.
   Include the bulk-select bar state, and wire the delete action to a destructive
   confirm modal titled "Permanently delete employee?" with real warning copy about
   attendance, leaves, payroll and documents being removed.

4. ADD EMPLOYEE (the flagship form screen)
   Max-width 880px, centred. A back link above the page header.
   Three sectioned cards, each with a 15px/600 heading and a one-line description:
     Personal Details    - First Name, Last Name, Personal Email, Phone
     Work Details        - Employee ID, Work Email, Role select, Employee Type select
                           (New - onboarding required / Existing), Date of Joining,
                           Reporting Manager select
     Access              - Temporary Password with a show/hide toggle and a strength meter
   Two fields per row on desktop, one per row below 768px.
   Show a filled valid field, an errored field ("Enter a valid work email"), a disabled
   field with the helper "Not required for Manager role", and an info callout:
   "The employee will be prompted to change this password on their first login."
   Sticky footer action bar inside the last card: Cancel (secondary) + Create Employee
   (primary). Show the button's loading state variant.

5. MY LEAVES
   Three KPI cards: Total Allotted 24, Used 9, Remaining 15 - each with a thin
   progress bar. An "Apply for Leave" primary button.
   Tabs: All / Pending / Approved / Rejected with counts in the tab labels.
   Table: Leave Type, From, To, Days, Reason (truncated), Applied On, Status badge,
   Actions. 8 rows covering every status.
   A right-hand 320px sidebar card: "Leave Balance by Type" with a small horizontal
   bar per type (Casual, Sick, Earned, Comp Off), and below it "Upcoming Holidays".
   This sidebar drops below the table under 1280px.

6. EMPLOYEE DETAIL
   A profile header card: 72px avatar, name, designation, role badge + status badge,
   then a metadata row (Emp ID, Department, Reporting Manager, Date of Joining, Work
   Email, Phone) laid out as a 3-column definition grid that becomes 2 then 1 column.
   Right side: Edit (secondary) and a more menu.
   Tabs: Overview / Attendance / Leaves / Documents / Payroll.
   Overview shows two cards: "Employment Details" as a definition list, and
   "Emergency Contact". Attendance shows a compact monthly table. Documents shows a
   file list with type icon, name, size, uploaded date, and download/view actions.

## RESPONSIVE REQUIREMENTS

Desktop and laptop are the primary targets. Optimise for these first:
  1920x1080, 1600x900, 1440x900, 1366x768.
At 1366x768 specifically: the shell chrome (58px topbar + 56px AI bar) leaves ~654px of
content height, so the first screenful must show the page header, the KPI row, and the
top of the next section. Do not let a single KPI card exceed 104px tall.

Breakpoints:
  >=1536  full layout, 5-up KPI grid, sidebar expanded, 28px page padding
  >=1280  4-up KPIs, side panels still beside main content
  >=1024  3-up KPIs, side panels drop below, 24px page padding, sidebar auto-collapses
          to 64px icon rail
  >=768   2-up KPIs, sidebar becomes an off-canvas drawer with a hamburger in the top
          bar and a dark backdrop, forms go single column, toolbars wrap
  <768    1-up KPIs, 16px page padding, top bar shows hamburger + logo + search icon +
          bell + avatar only, search expands to a full-width overlay on tap

Hard rules at EVERY viewport:
  - No horizontal scrollbar on <body>. Ever. Wide tables scroll inside their own
    container, and that container must show a subtle right-edge fade so users know
    there is more.
  - No overlapping or clipped elements, no text smaller than 11px.
  - Tap targets at least 40px on touch widths.
  - Modals: below 768px they become bottom sheets — full width, top corners rounded
    18px, max-height 92vh, sticky footer, and a drag handle.
  - Below 768px, wide tables ALSO offer a stacked-card fallback layout for the same
    rows: each record becomes a card with the identity row on top, then label/value
    pairs, then actions. Do not drop any column's data — relabel it.
  - Forms never place two fields side by side below 768px.
  - Long values wrap or truncate; they never widen their container.

## TECHNICAL CONSTRAINTS

- One HTML file. Tailwind via the play CDN is fine, but define the design tokens as CSS
  custom properties in a <style> block and drive Tailwind's arbitrary values from them,
  so a token change propagates everywhere.
- Inter from Google Fonts, with a real system fallback stack.
- No chart library — hand-author the bar and donut charts as inline SVG.
- No icon library — use the inline SVG sprite described above.
- All mock data in one MOCK object at the top of the script so it is easy to eyeball.
- Vanilla JS only: the router, tabs, modals, drawer, dropdowns, toasts, bulk select,
  sidebar collapse, and mobile drawer must all actually work.
- Accessibility: semantic HTML, one h1 per screen, label/for on every field,
  aria-label on every icon-only button, aria-current on the active nav item,
  role="dialog" + aria-modal + focus trap + focus restore on modals, and a visible
  focus ring on everything interactive.
- Include a small fixed viewport-size indicator in the bottom-right corner showing the
  live width, height and active breakpoint name. I need it for the review session.

## DELIVERABLE

Produce the artifact, then list in your reply:
  1. the design decisions you made and why,
  2. which screens and component states are included,
  3. what is deferred to the next prompt.

Do not explain the code. Do not include commentary inside the HTML beyond section
comments. Make it look like a product that costs money.
```

---

# PROMPT 2 — Attendance, Leaves management, Directory, Org Chart, Holidays

```
Extend the same artifact. Reuse the existing design system, shell, router and components
exactly — do not redefine or restyle anything. Add these screens and wire them into the
sidebar:

7. MY ATTENDANCE
   Month select + a "Download report" secondary button.
   Four KPI cards: Present 21, Absent 1, On Leave 2, Avg Hours 8h 42m.
   Table columns: Date, Punch In, In Photo, Punch Out, Out Photo, Hours, Status.
   The photo columns render a 28px rounded thumbnail placeholder that opens a lightbox
   modal on click. 22 rows. Include a late punch-in shown with a warning-tinted time,
   an incomplete day with an em dash for punch out, and a weekend row rendered in a muted
   --raised background with "Weekly Off" in place of a status.
   Below the table: a "Monthly Pattern" strip — a calendar heatmap of the month where
   each day is a 28px rounded square tinted by status, with a legend.

8. TEAM / ALL ATTENDANCE REPORT (this is the widest table in the app — 9 columns)
   Toolbar: date-range picker, Employee search, Department select, Status select, Export.
   Two view modes behind tabs: "Summary" and "Daily".
     Summary columns: Employee, Emp ID, Present, Absent, On Leave, Absent Dates,
       On Leave Dates. The two date-list columns hold comma-separated dates — render
       them as up to three small date pills plus a "+4 more" pill that opens a popover.
     Daily columns: Employee, Date, Punch In, In Photo, Punch Out, Out Photo, Hours,
       Status, Action.
   The Action column has a status-override select for privileged roles.
   Demonstrate the horizontal scroll container properly: the Employee column is STICKY
   to the left edge with a right-edge shadow while scrolling, and the header row is
   sticky vertically. This must feel effortless at 1366px width.

9. LEAVE APPROVALS (Manager view)
   A queue layout, not a plain table. Each pending request is a card row: applicant
   avatar + name + role, leave type badge, date range with day count, the reason text,
   the applied-on timestamp, a "team coverage" note, and Approve (primary) / Reject
   (destructive secondary) buttons. Approving opens a confirm modal with an optional
   comment textarea; rejecting opens one with a REQUIRED reason textarea showing its
   error state.
   Above the queue: three tabs, Pending 7 / Approved 34 / Rejected 3.
   Show the empty state for the Approved tab.

10. LEAVE MANAGEMENT (Payroll view)
    Month/year selects. Three summary KPI cards: Present, Absent, On Leave totals.
    A monthly breakdown table: Month, Present, Absent, On Leave, Absent Dates, Leave Dates.
    Then the main balance table: Employee, Role, Total, Used (Total), Absent Deductions,
    Used (This Month), Remaining, Report. Eight columns of numbers — right-align them,
    use tabular-nums, and add a subtle vertical rule separating the identity column from
    the numeric block. The Report cell is a download icon button.

11. EMPLOYEE DIRECTORY
    Search input plus Department and Role filter selects, and a grid/list view toggle.
    Grid: responsive people cards — 64px avatar, name, designation, role badge, work
    email, and two icon buttons (mail, phone). 4 across at >=1536, 3 at >=1280,
    2 at >=768, 1 below. 16 people.
    List view: the same data as a compact table.
    Clicking a card opens the right-side Drawer with that person's profile summary,
    reporting line, and a "View full profile" link.
    Include the skeleton loading grid and the "No results" filtered-empty state.

12. ORG CHART
    A pannable, zoomable canvas. One CEO node at the top, 3 managers beneath, 4-6 reports
    under each. Node: 200x76, white card, 32px avatar, name, designation, and a small
    "6 reports" count pill. Connectors are 1px --line-strong orthogonal lines with rounded
    corners. Zoom controls (+ / - / reset / fit) float bottom-right; a small minimap sits
    bottom-left. Nodes are collapsible via a chevron on the node's bottom edge.
    On mobile the canvas is drag-scrollable and zoom defaults to fit-width.

13. HOLIDAY CALENDAR
    Year select and a "Add Holiday" primary button for privileged roles.
    Left: a 12-month mini-calendar grid for the year with holidays marked as brand dots.
    Right: a holiday list grouped by month — each row has a date block (day number +
    weekday), the holiday name, a type badge (Public / Optional / Restricted), and
    edit/delete icon buttons. 14 Indian holidays with real names and 2025 dates.
    Stacks to a single column below 1280px.

Keep every rule from the first prompt: no emoji, AA contrast, no body horizontal scroll,
sticky table headers, real copy in empty states, working interactions.
```

---

# PROMPT 3 — Recruitment, Interviews, Onboarding

```
Extend the same artifact. Same design system and components. Add:

14. OPEN POSITIONS
    Search + Department / Status / Location filters. A card grid, 3 across at >=1536,
    2 at >=1024, 1 below. Card: job title, department + location + employment-type meta
    row, a status badge, a 2-line truncated description, a skills chip row (max 4 plus
    "+3"), a footer with an applicant-count avatar stack and a "View candidates" link.
    9 positions with realistic Indian-market titles.

15. CREATE POSITION / JD
    A 3-step stepper at the top: Position Details -> Job Description -> Review & Submit.
    The stepper shows completed steps with a check icon, the current step with a filled
    brand circle, and future steps in --ink-400, connected by a 2px rail that fills as
    you progress. It becomes a compact "Step 2 of 3" progress bar below 768px.
    Step 1: Title, Department, Location, Employment Type, Experience Range,
      Openings, Budget Range.
    Step 2: a large Job Description textarea with a "Generate with AI" secondary button
      in its label row, plus Key Responsibilities and Required Skills textareas.
      Show the AI-generating state: the textarea disabled with a shimmer overlay and a
      "Generating job description..." status line.
    Step 3: a read-only summary of everything in definition-list cards, plus an approver
      select and a Submit for Approval primary button.
    Footer: Back (secondary) + Continue (primary), sticky.

16. MY JDs / JD APPROVALS
    A table: Position, Department, Created By, Created On, Status badge
    (draft / pending_approval / approved / rejected), Actions.
    Clicking a row opens the Drawer with the full JD rendered as readable prose —
    proper heading and bullet typography inside the drawer — plus Approve / Request
    Changes buttons and a comment textarea in the sticky drawer footer.

17. CANDIDATE LIST
    Header shows the position title with a back link to Open Positions.
    A funnel strip: 5 stage cards (Applied 84, Screened 31, Shortlisted 12,
    Interviewed 6, Hired 1) shown as connected chevron blocks, each clickable to filter.
    Table: checkbox, Candidate (avatar + name + email), Experience, Current Company,
    AI Score, Applied On, Stage badge, Actions.
    Render AI Score as a 36px circular progress ring with the number inside, coloured
    --success-600 at >=75, --warning-600 at 50-74, --danger-600 below 50. 12 candidates.

18. CANDIDATE DETAIL
    Two-column, 1fr / 340px, stacking at 1280px.
    Left: profile header (avatar, name, contact row, stage badge), then tabs —
    Resume / AI Evaluation / Interview Rounds / Notes.
      AI Evaluation: an overall score ring, then per-criterion horizontal score bars
      (Skills Match, Experience, Education, Communication) with a short rationale line
      under each, then "Strengths" and "Concerns" as two bulleted lists in tinted cards.
      Resume: an embedded document viewer placeholder with a download button.
    Right rail: "Actions" card (Move to next stage select, Schedule Interview, Reject),
    an "Interview Rounds" progress list, and an "Applied For" summary card.

19. INTERVIEW PIPELINE
    A kanban board: 4 columns — Scheduled, In Progress, Completed, Feedback Pending —
    each with a count in the column header. Cards show the candidate name, the position,
    the round name, the interviewer avatar, and the date/time with a clock icon.
    Columns scroll horizontally as a group below 1280px, with visible scroll affordance.
    A "Schedule Interview" primary button opens a modal: Candidate select, Round select,
    Interviewer multi-select shown as removable chips, Date, Time, Duration, Mode
    (Teams / In-person radio group), and a Notes textarea.

20. INTERVIEW FEEDBACK / ROUND DETAIL
    A candidate summary strip at the top. Then a rating form: 5 criteria, each a row with
    the criterion name, a helper line, and a 5-point rating control rendered as five
    36px selectable squares labelled 1-5 with colour building from --danger to --success.
    Then Strengths and Areas of Concern textareas, an overall Recommendation radio group
    (Strong Hire / Hire / No Hire / Strong No Hire) styled as segmented cards, and a
    sticky submit bar showing the computed average score.

21. ONBOARDING SUMMARY (HR view)
    A table: Employee, Work Email, Date of Joining, Onboarding progress, Status, Actions.
    The progress cell is a 100px 6px-tall bar plus "4/6 steps" text.
    Row expansion reveals a checklist of the six onboarding steps with per-step status
    icons and timestamps.

22. EMPLOYEE JOINING FORMS WIZARD (employee-facing, full-page, no sidebar)
    A centred 920px layout with its own slim navy header showing the SAVEN logo and a
    "Step 3 of 5" indicator plus a Save & Exit link.
    Vertical stepper on the left (240px) listing Personal Details, Education & Experience,
    Bank Details, Documents, Review — with per-step status. It becomes a horizontal
    scrollable stepper below 1024px.
    Build the Documents step in full: eight upload slots (SSC Memo, 12th Memo, Degree
    Certificate, Aadhaar, PAN, Resume, Offer Letter, Other) as a 2-column grid of drop
    zones. Show three states: empty dashed drop zone with an upload icon and
    "PDF, JPG, PNG or DOCX up to 10MB"; uploading with a determinate progress bar and a
    cancel button; uploaded with a success-tinted border, a file-type icon, the filename,
    the size, and view/replace/remove icon buttons. Also show one rejected file with the
    error "File size must be under 10MB".
    Also build the Education & Experience step: repeatable table rows for qualifications
    and previous employment, each row with an inline remove icon button and an
    "Add another" tertiary button below. These dense inline-edit tables must stay usable
    at 1366px and must become stacked field groups below 768px.
```

---

# PROMPT 4 — Payroll, Policies, Teams, Voice, Resignation, Settings, Audit

```
Extend the same artifact. Same design system and components. Add:

23. MY PAYSLIPS
    Year select. A KPI row: YTD Gross, YTD Deductions, YTD Net, Last Credited.
    Format all currency as Indian rupees with lakh grouping, e.g. INR 12,45,600.
    A payslip list: 12 month rows, each with the month/year, the credited date,
    the net amount right-aligned in tabular-nums, a status badge, and view/download
    icon buttons.
    Clicking view opens an lg modal rendering a real-looking payslip: a company header,
    an employee detail block, then a two-column Earnings / Deductions table
    (Basic, HRA, Special Allowance, Conveyance / PF, Professional Tax, TDS), a Gross and
    Total Deductions subtotal row, a highlighted Net Pay row, an amount-in-words line,
    and a Download PDF button in the sticky footer. This must be print-clean.

24. PAYROLL MANAGEMENT (Payroll role)
    Month/year selects, an "Upload Payslips" primary button, and a "Download template"
    secondary.
    A table: Emp ID, Employee, Period, Uploaded On, File, Actions.
    The upload modal has a large drop zone for bulk PDF upload, then a per-file list with
    individual progress bars and match status ("Matched to SAV0142" or a
    "No matching employee" error row).

25. POLICIES
    Left: a 260px category rail (HR Policies, Leave, IT & Security, Code of Conduct,
    Finance) with counts. Right: policy cards, each with a document-type icon, the title,
    a version + effective-date meta row, a 2-line summary, an acknowledgement status
    badge, and View / Download actions.
    The View modal renders long-form policy prose with correct reading typography —
    max 68ch measure, 1.65 line-height, proper h2/h3/list/blockquote styling — and a
    sticky footer with an "I acknowledge this policy" checkbox plus a Submit button.

26. MY TEAMS / TEAM DETAIL
    Teams list: cards with the team name, the manager, a member avatar stack with a
    "+5" overflow chip, an active-project count, and a View link.
    Team detail: a header card with team meta; tabs Members / Projects / Tasks.
      Members: a table with Employee, Role, Designation, Joined, Status, Actions.
      Projects: cards with the project name, a status badge, a 6px progress bar with a
        percentage, start and end dates, and an assignee avatar stack.
      Tasks: a compact table with Task, Assignee, Priority badge (High/Medium/Low),
        Due Date, Status. This screen has the most form controls in the real app — also
        show the "Add Project" modal with Name, Description textarea, Start Date,
        End Date, Status select, and a Members multi-select chip field.

27. EMPLOYEE VOICE + VOICE INBOX
    Employee view: a submission card with a Category select (Suggestion, Concern,
    Appreciation, Grievance), an Anonymous toggle with the helper "Your identity will not
    be shared with reviewers", a Subject input, and a Message textarea with a live
    character counter. Below it, "My Submissions" as a list with status badges and
    expandable response threads.
    Inbox view (Manager): a two-pane layout — a 380px left list of submissions with
    category, a 2-line preview, the submitter (or "Anonymous" with a shield icon), a
    timestamp, and an unread dot; and a right reading pane with the full message, a
    metadata strip, a reply textarea, and Mark Acknowledged / Resolve actions.
    Below 1024px the left list becomes the full page and selecting an item pushes the
    reading pane in as a full-screen view with a back button.

28. RESIGNATION + INBOX
    Employee: a resignation form card with the Last Working Day date input showing a
    computed "Notice period: 60 days - your LWD must be on or after 12 May 2025" helper,
    a Reason select, and a Details textarea. Below it, a status timeline once submitted:
    Submitted -> Manager Review -> HR Clearance -> Exit Interview -> Completed, rendered
    as a vertical timeline with per-step icons, timestamps and owners.
    Inbox (Manager): a table with Employee, Submitted On, Last Working Day, Notice Served,
    Status, Actions, plus a detail drawer holding the exit-interview feedback form.

29. SETTINGS
    A 220px left tab rail: My Profile, Password, Notifications, Preferences.
    My Profile: a profile photo uploader (96px avatar with a hover camera overlay and
    Change / Remove actions), then sectioned cards — Personal Information,
    Contact Details, Emergency Contact, Bank Details — each with a per-section Edit
    button that flips that section's fields from read-only definition rows into editable
    inputs with Save / Cancel. Show one section in each state.
    Password: Current, New, Confirm, plus a live requirement checklist that ticks off
    (8+ characters, one uppercase, one number, one symbol).
    Notifications: rows of label + description + toggle, grouped by category.
    The rail becomes a horizontal scrollable tab row below 1024px.

30. AUDIT LOGS
    Toolbar: a date-range picker, User search, Action select, Module select, and Export.
    A table: Timestamp (two lines: date + time), User (avatar + name + role), Action badge
    (Create success / Update info / Delete danger / Login neutral), Module, Entity,
    IP Address (monospace), Details.
    The Details cell is an icon button opening a drawer with a before/after diff — two
    columns, removed values in danger-50 with a strikethrough and added values in
    success-50. 15 log rows.
    Show the "load more" pattern at the bottom rather than pagination.

FINAL PASS after these screens are in:
  - Add a screen index / cover page as the artifact's landing view: the Saven logo, the
    title "HR Portal - UI Design Review", the date, and a grid of all 30 screens as
    clickable tiles grouped by module, each tile showing the screen name and a one-line
    description. This is what I open in front of my manager.
  - Add a role switcher in the top bar (CEO / Manager / HR / Employee / IT / Payroll)
    that changes which sidebar groups and items are visible, so I can demo per-role
    navigation. Use the real role-visibility rules:
      Employee Management, Onboarding, Verify Forms, My JDs, Create Position -> CEO + HR
      My Teams, Leave Approvals, JD Approvals, Voice Inbox, Resignation Inbox,
        Team Attendance -> CEO + Manager
      All Attendance, Leave Management, Payroll -> CEO + Payroll
      Interviews -> CEO + HR + Manager
      Audit Logs -> CEO only
      Everything else -> all roles
  - Verify every screen at 1920, 1600, 1440, 1366, 1280, 1024, 820, 768, 430, 390 and
    360 px wide. Report a table of viewport vs result and fix anything that overflows,
    clips, overlaps or crowds. The 1366x768 laptop case is the most important — that is
    what most of my users have.
```

---

## Refinement prompts (use as needed, in the same chat)

**Responsive QA loop**
```
Go screen by screen and audit the prototype at 1920x1080, 1600x900, 1440x900, 1366x768,
1280x800, 1024x768, 820x1180, 768x1024, 430x932, 390x844, 375x812 and 360x800.
For each, report: horizontal body overflow, clipped or overlapping elements, text under
11px, tap targets under 40px, tables escaping their container, forms with side-by-side
fields below 768px, modals taller than the viewport, and toolbars that overflow instead
of wrapping. Then fix every issue with clean breakpoint rules — no magic numbers, no
!important — and re-verify that the desktop layouts did not regress.
```

**Density and polish pass**
```
Review the prototype as a senior product designer doing a final critique. Focus on:
optical alignment across cards and sections, consistent vertical rhythm, table row height
and cell padding, whether any screen feels either crowded or empty at 1366x768, badge and
button size consistency, icon weight consistency, and text colour contrast. Give me a
prioritised list of what is still off, then fix the top ten.
```

**Presentation mode**
```
Add a presentation mode toggle: hides the viewport indicator, adds keyboard arrow-key
navigation between screens in the index order, and shows a subtle screen counter
("14 / 30") in the bottom-right. I am demoing this on a projector at 1920x1080.
```

**Design spec handoff**
```
Now produce a written design specification I can hand to my React team: the final token
values, the component inventory with every prop and state, the page-header and toolbar
patterns, the table anatomy, the breakpoint rules, and a mapping from each prototype
screen to the React page it corresponds to. Markdown, no code.
```

---

## Notes for the React implementation (after screens are frozen)

The prototype's components map onto the existing codebase as follows:

| Prototype component | Real file | Action |
|---|---|---|
| Button | `src/components/ui/Button.jsx` | enhance, add `tertiary` |
| Input | `src/components/ui/Input.jsx` | enhance |
| Select / Textarea / Checkbox / Toggle | — | **new** (~70 raw fields to normalise) |
| Data table | `src/components/ui/Table.jsx` | enhance + absorb 7 hand-rolled tables |
| Status badge | `src/components/ui/Badge.jsx` | enhance, keep status keys |
| Modal / Drawer | `src/components/ui/Modal.jsx` | enhance, add footer + focus trap |
| Page header | — | **new**, replaces ~50 inline `<h1>` blocks |
| Card / EmptyState / Skeleton / Tabs / Icon | — | **new** |
| Sidebar (+ mobile drawer) | `src/components/layout/Sidebar.jsx` | enhance |
| Top bar | `src/components/layout/Topbar.jsx` | enhance |
| KPI stat card | `src/components/ui/StatCard.jsx` | enhance, delete the `shared/` duplicate |

Statuses, roles, field names and nav destinations in these prompts are taken verbatim
from the repo, so no design decision here requires a functional change.
