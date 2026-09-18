# Komplett — domain context

Personal to-do + pomodoro + accountability app for a handful of friends. Spec and tickets: GitHub issues #1–#12.

## Glossary

| Term | Meaning | Not called |
|---|---|---|
| **User** | A signed-in person. Owns folders, lists, tasks, sessions, and one shared task. | account, member |
| **Task** | A unit of work with a title; optionally a due date, reminder, note, repeat rule. Always belongs to exactly one list. | todo, item |
| **List** | A named, colored group of tasks. Optionally inside one folder. | project, category |
| **Inbox** | The list auto-created on first sign-in. Cannot be deleted. | default list |
| **Folder** | A named group of lists. One level only — folders don't nest. | group, workspace |
| **Color** | A list's accent, stored as a token name (`"rose"`), never a hex value. | theme |
| **Due date** | A calendar date (`YYYY-MM-DD`) with no time or zone. Same day for everyone. | deadline |
| **Reminder** | An absolute UTC timestamp at which a notification fires while the app is open. | alert, alarm |
| **Repeat rule** | A preset (`daily`, `weekdays`, `weekly` + days, `monthly` + day, `yearly`). Not RRULE. | recurrence, schedule |
| **Advance** | What completing a repeating task does: due date moves to the next occurrence on the *same* task; it is not completed. | roll over, regenerate |
| **Complete** | Set `completedAt` on a non-repeating task. Completed tasks are hidden unless shown. | done, archive, finish |
| **Completed area** | Per-list "Show completed" toggle and the global Completed page. | archive, trash |
| **Delete** | Permanent removal. No undo, no trash. | archive, remove |
| **Focus** | The concentrate period of a pomodoro (default 25 min). | work, pomodoro period |
| **Break** | The rest period after focus (default 5 min). Not recorded. | pause |
| **Session** | One recorded focus period: note, minutes, start/end, `endedEarly`, optional linked task plus a copied `taskTitle`. | pomodoro, entry |
| **Note** | On a task: plain-text reference. On a session: what was done (defaults to the task title). | description, comment |
| **History** | Chronological list of sessions. | log, journal |
| **Partner** | The one user you've picked for accountability. Picking is one-way; both must pick each other for mutual visibility. | buddy, friend |
| **Accountability task** | The single task you've chosen to share with your partner. | shared task (see below), commitment |
| **Shared task** | The projected document (`title`, `dueDate`, `completedAt`, `reactions`) your partner reads. Derived from the accountability task; never edited directly. | — |
| **Reaction** | One emoji from a fixed set, left by a partner on a completed shared task. One per user, replaceable. | like, kudos |
| **Token** | A CSS custom property for color, font, spacing, or radius. All styling goes through tokens. | variable, theme value |
| **Data module** | The only place Firebase is imported. Components use its hooks and functions. | repository, service |
| **Domain module** | Pure functions with no React or Firebase: repeat advancement, timer reducer, session aggregation, shared-task projection. The tested seam. | utils, lib |

## Invariants

- Every task is in exactly one list; every list is in at most one folder; folders don't nest.
- Only one accountability task per user; the shared task mirrors it and stays visible as done until replaced.
- Reactions are cleared when the accountability task changes.
- A running timer lives in localStorage only; Firestore holds finished sessions.
- Firebase stays on the Spark plan. Never Blaze, never a card on file.
- `firebase/*` imports exist only in the data module (lint-enforced).
