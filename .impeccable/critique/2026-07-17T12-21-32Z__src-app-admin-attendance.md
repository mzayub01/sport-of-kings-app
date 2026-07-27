---
target: admin attendance management
total_score: 15
p0_count: 1
p1_count: 3
timestamp: 2026-07-17T12-21-32Z
slug: src-app-admin-attendance
---
# Critique: Admin Attendance Management

Method: dual-agent (A: design review · B: detector + manual sweep). Browser visualization skipped: no browser automation available this session.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Roster page has counts + toasts; Attendance page's Remove gives zero feedback (errors swallowed) |
| 2 | Match System / Real World | 2 | "Class Roster" vs "Attendance" labels don't map to take-vs-review; class/day/location smashed into one dropdown string |
| 3 | User Control and Freedom | 1 | Un-check-in is one tap, permanent, no confirm, no undo toast, no recovery path |
| 4 | Consistency and Standards | 1 | Same job, two vocabularies: different rows, search, "Remove" vs "Undo", persistent vs 3s toasts, different spinners |
| 5 | Error Prevention | 2 | Roster has wrong-day guard + duplicate handling; Attendance page has neither |
| 6 | Recognition Rather Than Recall | 2 | Roster shows who should be there; Attendance page forces recall via all-members search; duplicate nav entries |
| 7 | Flexibility and Efficiency | 1 | No bulk actions, no keyboard path, no prev/next date, CSV only per class-per-date, search capped at 20 silently |
| 8 | Aesthetic and Minimalist Design | 3 | Coherent gold/glass token system; undermined by 21-item nav and duplicated surfaces |
| 9 | Error Recovery | 1 | Raw Supabase error.message shown; Attendance-page delete failures swallowed entirely |
| 10 | Help and Documentation | 0 | No tooltips, hints, or docs in any attendance flow |
| **Total** | | **15/40** | **Poor — major UX overhaul required** |

## Anti-Patterns Verdict

- Automated detector: 0 findings across all 4 files — the visual layer is clean of slop patterns.
- LLM verdict: "accreted, not designed." Trust erodes from behavior, not pixels: two near-duplicate marking pages that never reconciled, shipped console.logs in the check-in path, a hard-coded fake "+12% this month" dashboard stat, one-tap unconfirmed deletes, raw DB errors shown to users.
- Deterministic sweep highlights: undefined `.loading-spinner` class (class-roster:294 — initial load renders an empty div); `animate-spin` is Tailwind but Tailwind CSS is never imported (src/app/globals.css has no importer), so the roster's Loader2 doesn't spin; 4 hard-coded colors bypassing tokens; row action buttons ~34px tall at 12px text; silent error swallowing in all three files; modal lacks role="dialog"/focus trap/Escape/aria-label; form labels not associated (no htmlFor); alerts not aria-live; member search silently truncated to 20; dashboard "Attendance Today" counts future dates (gte); MemberAttendanceModal "Week Streak" counts total weeks ever, not consecutive; dead disabled-logic on roster toggle; unused imports.

## Overall Impression

The visual brand is genuinely coherent — the problem is architecture and behavior. Five surfaces touch attendance (admin Attendance, admin Class Roster, per-member modal, dashboard number, instructor Take Attendance) and none of them aggregates anything. The user's complaint ("hard to see attendance by location, by class") is a real feature gap, not a discoverability problem: answering "how many trained at Location X last week" requires manually iterating every class × every date. Meanwhile the two admin marking pages are ~85% the same job with divergent safety, feedback, and vocabulary — the weaker twin owns the "Attendance" label admins click first.

## What's Working

1. The roster-first model (class-roster page) is the right bones: enrolled-members-with-status, checked-in-first sort, live stats, CSV export, wrong-day guard, duplicate handling.
2. MemberAttendanceModal's stat quartet (total / this month / last month / streak) is exactly the right per-member glanceable — just marooned behind an unlabeled icon.
3. Real token system, belt badges, global gold :focus-visible — the visual layer is not the problem.

## Priority Issues

- **[P0] Two competing marking surfaces for one job** (/admin/attendance vs /admin/class-roster, plus /instructor/attendance as a third). Divergent day-guards, feedback, error handling; three nav entries. Fix: kill /admin/attendance as a marking surface; Class Roster becomes "Attendance" with an "add walk-in" affordance absorbed from the old page.
- **[P1] No aggregate view at all** — the user's actual complaint. Fix: one Attendance Overview — location filter → week/month grid of classes × dates with counts, per-class trend vs 4-week average, "absent regulars" list; dashboard number links into it.
- **[P1] Destructive one-tap delete with no confirm/undo/feedback** + silent error swallowing (removeCheckIn ignores errors; modal renders errors as "No attendance records found"). Fix: optimistic toggle + 5s "Removed — Undo" toast; surface errors.
- **[P1] Broken on phones**: attendance page's inline 1fr/1fr grid has no mobile fallback; ~34px tap targets at 12px text; roster rows re-sort under the thumb mid-marking. Mostly moot if P0 merges pages.
- **[P2] Date/class navigation ergonomics**: naked native date input as sole navigation, no Today/prev/next-session stepping, unfiltered flat class dropdown; wrong-day state scolds instead of jumping to nearest valid date.

## Persona Red Flags

- Alex (power admin): no bulk "mark all present"; no keyboard path; monthly report = many CSVs merged in Excel; search caps at 20 with no indicator.
- Sam (a11y): attendance entry on Members page is an icon-only button with no aria-label; --text-tertiary on white ≈ 2.8:1 (emails, timestamps fail AA); modal has no focus trap/Escape/aria-modal; alerts silent to screen readers.
- Casey (mobile coach): two-column collapse; state resets on navigate-away mid-class; one-tap Undo under a moving thumb is how records get silently deleted; (credit: bottom-nav promotes Roster correctly).

## Minor Observations

- Same success event: 3s auto-dismiss toast on roster, persistent-forever alert on attendance page.
- Attendance % denominator soft (falls back to everyone-at-location).
- Calendar icon on class select, Clock icon on date — swapped from natural meanings, both pages.
- Instructor nav leaks /admin/class-roster URL while /instructor/attendance still exists.
- Dashboard "Attendance Today" is not a link and its query counts future-dated records.
- Hard-coded '#EAB308', rgba-green tints bypassing tokens; console.logs and unused imports shipped.

## Questions to Consider

1. Is /admin/attendance a job or a leftover? If instructors mark at the mats, should admin "Attendance" open a report, not a form?
2. What is attendance for downstream (grading eligibility, disputes, capacity)? That decides the right aggregate and the right deletion friction.
3. The roster knows who should be there — why does the product only ever show who came, when the valuable list for a community club is who stopped coming?
