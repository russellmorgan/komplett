# Komplett — design brief

## What it is

Komplett is a small, private productivity app for a handful of friends. It combines three things:

1. **A to-do list:** tasks grouped into colored lists, with lists optionally grouped into folders.
2. **A pomodoro timer:** 25-minute focus periods and 5-minute breaks by default. After each focus period, you write a short note about what you did.
3. **An accountability partner:** you pick one friend and share one task with them. If you both pick each other, you can see each other's shared task, and when your partner finishes theirs you can react with an emoji.

The app is small and personal. It isn't a team tool, there are no notifications from other people, and there's no social feed. The tone should be calm and focused, a bit warm, and never "enterprise."

## Platforms

- **Web app / installable PWA**, used on phones and desktops.
- **Desktop app (Electron)**, which wraps the same web build.
- One responsive layout:
  - **Phone / tablet (under 1024px):** content on top, a tab bar fixed to the bottom.
  - **Desktop (1024px and up):** a left sidebar (about 14rem) with the content beside it.
- Light and dark mode both follow the OS setting. There is currently no manual toggle.

## Current state

The app works, but it's essentially unstyled: system fonts, native form controls, a single blue accent, and text glyphs for icons (▶ ↑ ↓ × …). **The whole look and feel is open to change.** Only the structure and behavior below are fixed.

## Screens

**Navigation (7 items):** Tasks, Lists, Completed, Timer, History, Partner, Settings. On phones this crowds the bottom bar, so feel free to propose a different structure, such as a "More" item or grouping. While a timer is running, a **timer pill** ("Focus 18:42", with ⏸ when paused) appears in the nav on every screen.

1. **Sign in:** app name, "Sign in with Google", and an email field with "Email me a link" (passwordless magic link).
2. **Tasks (home):**
   - The header shows the current list name in that list's color, plus a switcher to change lists.
   - A quick "Add a task" input.
   - **Each task row** has: a complete checkbox, the title (click to edit inline), a due date or "…" (opens details), ▶ to start a pomodoro on the task, ↑/↓ to reorder, a "move to list" dropdown, and × to delete.
   - An "Undo" message appears after completing a task.
   - A "Show completed" toggle shows completed tasks below, with a checkbox to un-complete them.
   - The row is overloaded, and this is the screen that most needs design help.
3. **Task detail:** a side panel on desktop; a sheet or full screen on mobile is up to you. It contains:
   - The title, plus stats ("3 sessions, 75 min focus").
   - "Start pomodoro" and "Set as accountability task" (which becomes "Shared with partner" once set).
   - Fields: Due (date), Reminder (date + time), Note (multi-line), Repeat (Never / Daily / Weekdays / Weekly + day checkboxes / Monthly + day of month / Yearly).
4. **Lists:**
   - Inbox is always first and can't be deleted.
   - Loose lists come next, then folders, each holding its own lists. Folders are one level only and never nest.
   - Lists and folders can be reordered, renamed, and deleted, and each list has a color.
   - Actions: "+ New list", "+ New list in {folder}", "+ New folder".
5. **Completed:** every completed task across all lists, with a "clear all" action.
6. **Timer:**
   - A state label (Ready / Focus / Break / Focus done), plus the linked task if there is one.
   - A big mm:ss clock.
   - Controls: Start focus, Pause/Resume, Stop, Skip break.
   - When a focus period ends, a note form appears: "25 min focus on 'X'. What did you do?", with a text field prefilled with the task title and a "Save session" button. Variants: "25 min focus (stopped early) on 'X'" when stopped early, and no "on 'X'" (empty prefill) when no task is linked.
   - This is the emotional center of the app, and it deserves the most visual care.
7. **History:** focus sessions, newest first. Each shows the date/time, minutes, "(stopped early)" if applicable, the task title, the note, and a delete button.
8. **Partner:**
   - "Your partner" picker, plus a list of everyone who has signed in (avatar or initial, name, email). The picked person is highlighted.
   - **Two cards side by side:** "Your shared task" and "{Partner}'s shared task". Each shows the title and a status: "Due {date}", "In progress", or "Done ✓".
   - When the partner's task is done, an emoji reaction picker appears (fixed set, one reaction per person, replaceable). Reactions already received show as a small row of emoji on each shared-task card.
   - Empty states:
     - You have no shared task yet.
     - You have no partner.
     - Your partner hasn't picked you back.
     - Your partner has no shared task.
9. **Settings:** "Signed in as {email}", focus minutes, break minutes, sound on/off, and sign out.

## Design system constraints

- **All styling goes through tokens** (CSS custom properties in `src/tokens.css`): colors, fonts, type scale, spacing, and radii. Please deliver the design as a token set: light and dark values, type scale, spacing scale, radii, and any shadows.
- **List colors:** 10 named accents (slate, rose, orange, amber, green, teal, sky, indigo, violet, pink). Lists store the *name*, so the names must stay, but the actual hex values are yours to choose. Each needs to work in both light and dark mode, as text and as a dot/badge.
- **Icons:** a real icon set is welcome. We need: complete, start/play, pause, stop, reorder (or drag handle), move-to-list, delete, close, details, repeat, reminder, and due.
- Keep it lightweight: no heavy component library. Plain HTML controls, restyled, are ideal.
- Must stay accessible: visible focus states, AA contrast, and tap targets of about 44px or more on mobile.

## Deliverables I'm hoping for

1. The token set, in light and dark.
2. Mockups of Tasks (mobile + desktop), Task detail, Timer (idle / running / note form), and Partner. Lists, History, Completed, Settings, and Sign-in can follow the same patterns.
3. A navigation proposal for 7 items on mobile.
4. An app icon. The current PWA icons are placeholders.
