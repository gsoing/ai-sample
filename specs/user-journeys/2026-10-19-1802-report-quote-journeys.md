# User Journey Maps: Report a Quote

**Date:** 2026-10-19

**Related PRD:** [`specs/prd/2026-10-19-1802-report-quote-prd.md`](../prd/2026-10-19-1802-report-quote-prd.md)

---

## Overview

Three journeys cover the feature: a reader reporting a quote, a moderator handling the report, and someone trying to abuse the anonymous report button. All of them use the existing pages (`/` and `/moderate`) and add no new page.

---

## Journey 1: Reader reports an inappropriate quote

### Journey Map

| Stage | User Action | Touchpoint | Pain Point | Opportunity |
|-------|-------------|------------|------------|-------------|
| Notice | Sees a quote that is out of line | `/` quote card | Today: no way to act | A **Report** button on every card |
| Choose | Clicks Report, picks a reason | Reason picker (4 options) | Fear of misclicking | Nothing is sent until they confirm; cancel is always available |
| Confirm | Confirms | `POST /api/quotes/:id/report` | Not sure anything happened | Status message: "Sent back to moderation" |
| Move on | Sees the next quote | `/` rotation | The bad quote could come back in the rotation | The reported quote is removed from the local rotation and filtered by the API at the next load |
| Edge | Reports a quote someone else already reported | API 409 | Confusing error | Show the `detail` text, which says the quote is already being reviewed |

### Narrative

#### Context
A colleague is reading quotes on the office screen. One of them reveals something personal about a teammate. They want it gone now, without logging in or writing an explanation.

#### Journey Flow
1. Under the quote, they click **Report**.
2. A small picker offers *Offensive*, *Inaccurate*, *Private information*, *Other*. They choose *Private information* and confirm.
3. The API moves the quote to `pending` and stores the reason. The page says the quote has been sent back to moderation and moves on to the next quote.
4. Reloading `/` no longer shows it.

#### Key Insights
- **Speed matters more than detail**: two clicks, a closed list, no free text.
- **Feedback is essential**: without a confirmation, readers will click again or wonder whether it worked.
- **Emotional state**: uncomfortable, they want quick relief, not a form.

---

## Journey 2: Moderator reviews a reported quote

### Journey Map

| Stage | User Action | Touchpoint | Pain Point | Opportunity |
|-------|-------------|------------|------------|-------------|
| Open queue | Opens `/moderate` | `GET /api/quotes/pending` | Reported quotes look like new submissions | **Reported** badge plus the reason |
| Assess | Reads the quote and the reason | Moderation card | No context on why it came back | The reason label explains it |
| Decide: keep | Clicks Approve | `PATCH /:id/approve` | The same quote could be reported again tomorrow | The quote is cleared and can't be reported again |
| Decide: remove | Clicks Reject | `PATCH /:id/reject` | None | Same as today |

### Narrative

#### Context
The moderator checks `/moderate` a few times a day. Most items are fresh submissions, and a reported quote needs a different kind of judgment ("was this ok in the first place?").

#### Journey Flow
1. They open `/moderate`. One card shows a **Reported: Private information** badge.
2. They reread the quote. They agree it should go, and click **Reject**. The quote is gone for good.
3. Another reported card says *Offensive*, but it's a harmless joke. They click **Approve**. The quote comes back on `/` and can't be hidden by a report again.

#### Key Insights
- **No new workflow**: the same two buttons, the same queue.
- **The reason drives the decision**: without it the moderator would have to guess.
- **Re-approval is a deliberate statement**: it makes sense that it protects the quote from more reports.

---

## Journey 3: Someone tries to abuse the report button

### Journey Map

| Stage | User Action | Touchpoint | Pain Point (for the team) | Opportunity |
|-------|-------------|------------|------------|-------------|
| Spam | Reports every quote, by UI or by `curl` loop | `POST /:id/report` | `/` empties out | Each quote can only be hidden once |
| Repeat | Reports the same quotes again | API | Endless hide and restore | 409 on a pending quote; 409 on a re-approved quote |
| Restore | Moderator re-approves the legitimate quotes | `/moderate` | Busywork | One click per quote; after that they are immune |
| Inspect | Calls `GET /api/quotes` to learn about reports | Public API | Info leak | Response shape unchanged: no status, `_id` or report data |

### Narrative

#### Context
There is no authentication (ADR-002), so anyone on the network can call the API. A bored colleague writes a loop that reports every quote.

#### Journey Flow
1. The loop reports every approved quote. Each one goes to `pending`, and `/` shows "No quotes yet".
2. The loop runs again: every call gets a 409, since nothing is `approved` any more.
3. The moderator sees a queue full of *Reported: Other* cards and re-approves the legitimate ones.
4. The loop runs a third time: every re-approved quote answers 409 `quote-not-reportable`. The attack has run out.

#### Key Insights
- **We can't prevent the first wave** without identity or rate limiting (both out of scope). We make it **one-shot** and **cheap to undo**.
- The residual risk must be written down, as an ADR during refinement, rather than hidden.

---

## Cross-Journey Insights

- **One state machine** (approved, pending + report, then approved + cleared or rejected) serves all three journeys. No fourth status is needed.
- **The public API never changes shape**, which keeps journey 3's information leak closed and journey 1's display code simple.
- **Feedback comes from Problem Details `detail`** in both UIs, in line with AGENTS.md.

## Recommendations for Story Mapping

- Journeys 1 and 2 form one end-to-end increment: a report has no value if the moderator can't see it marked. They belong in one story.
- Journey 3's guard (immunity after re-approval) is a separate, releasable hardening increment.
- The ADR on residual abuse risk and the data model change should be raised at refinement of the first story.
