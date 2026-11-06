# Session ToDo — Logosphere BITS

This file is the single source of general rules for every Muse session
working in this folder. Rules are written in terms of tasks and file names.

Status: finalized 2026-11-06. Session records live in `docs/sessions/`.

## 1. Opening a session file

Every new Muse session creates its own session file as its first
project action.

- Pattern: `docs/sessions/Logosphere BITS, yyyymmdd_hhnnss_TST.MD`
- TST means Turkish Standard Time, UTC+03:00, in this project. Time is
  computed via Europe/Istanbul; the file name uses `yyyyMMdd_HHmmss`
  (HH is 24-hour clock, mm minutes).
- The time in the file name shows the real opening time. When the
  opening time is not in reliable metadata, it is not invented: the
  file is named with this record's creation time and the unknown past
  opening time is stated openly.
- Session id, opening time, file creation time and last update time
  are written into the file explicitly with the UTC+03:00 offset.
- While the same session continues, it uses its own active MD; no new
  file is opened per user message. Another session's file is never
  overwritten.
- Opening procedure: after the MD is created, read this file and the
  nearest previous session MD excluding the current file; older
  records are inspected as needed. Learn where work stopped, finished
  jobs, open bugs, tried solutions and the next job; compare them
  against real files and Git status, and never assume half-done work
  is complete. Write the previous record's path and the inherited
  state summary into the new session MD.
- Automation: the SessionStart event in `.muse/hooks.json` runs the
  `tools/new-session.ps1` script and creates the skeleton. Re-running
  the script with the same session id produces no second MD and
  overwrites no record. The agent completes the inheritance summary
  and record updates.

## 2. Command log

- Before starting each user command, write the request summary plus
  "in progress" status into the active session MD.
- When EVERY completed command ends, update the same file before
  reporting to the user. This obligation also holds for code,
  documentation, review, debugging, and failed or blocked work.
- The record contains: operations performed, changed files, decisions
  taken, real check results, errors, remaining work, the next concrete
  action, and Git status.
- Keep a current handover summary at the top and timestamped history
  below; earlier records are never deleted. For long or risky work,
  intermediate state is also written to disk. After a sudden break,
  the last verified state can then be told apart from half-done work.
- Writing is made safe and re-runnable; keys, tokens and passwords
  are never recorded.

## 3. Working rules

- Do only the job given at that moment; future files and features are
  never produced in advance.
- Packages are installed at their own usage stage, with exact
  versions (the version set in `docs/DECISIONS.md` record D3 applies).
- The lock file (`package-lock.json`) is updated only by the package
  manager; never edited by hand.
- Working decisions are not changed arbitrarily; a contradiction in
  the decision documents is fixed in place and consistently; no second
  source document is produced for the same rules.
- A check that was not run is not shown as passed; a test without
  proof is not written as "ran".
- Mobile checks: `npm run typecheck`, `npm run lint`, `npm run format`,
  `npm test`. Future Supabase Deno code lives under `supabase/` and is
  outside the mobile checks (`tsconfig.json`, `jest.config.js`,
  `.eslintignore`, `.prettierignore` exclusions). Declaration
  (`*.d.ts`) files are not discovered as tests.
- Field names and all in-code identifiers are written in English
  (`temporary`/`temp`, never `gecici` etc.).
- TypeScript code follows the `docs/DECISIONS.md` D6 "Programmer
  Namings" hierarchy at 100%; when a naming that violates the
  hierarchy is seen, the user is warned before code is written and
  the correct form is used.

## 4. Git rule

- At each completed concrete step of progress that passes its checks,
  an explanatory commit is created with selected files. No empty
  commit is produced per tool call or when nothing changed.
- Push at these completed milestones: session log order, working
  Android base, visual base, Supabase base, shared demo, camera and
  voice, provider infrastructure, add to inventory, sale, CSV report
  (shipped as CSV per D15, not Excel), clean APK acceptance, delivery.
  All milestones were reached 2026-11-05.
- At end of day when a user message arrives, or while work is in
  progress, completed unpushed commits are also sent; no timer is set.
  No further permission is asked within this scope.
- GitHub user must be `imuratguler`, origin
  `https://github.com/imuratguler/logosphere-bits-hackathon-2026`,
  branch `main`.
- Before push, remote state is checked with fetch; after push, local
  HEAD equality with `origin/main` is verified. No force-push,
  history deletion, date change, or secret is ever pushed. Only the
  relevant files are staged and the staged diff is inspected. The
  commit/push result is recorded in the active session MD; no endless
  new-commit loop is created just to append its own commit id to the
  record.

## 5. Document map

- `SESSION_TODO.md` (this file): general rules.
- `AGENTS.md`: project rules entry; links to this file.
- `docs/SCOPE.md`, `docs/DECISIONS.md`: scope and decision records.
- `README.md`: short project introduction.
- `docs/sessions/Logosphere BITS, *_TST.MD`: session records
  (TST = UTC+03:00).

## 6. Known environment notes

- Build and run commands use the normal `C:\...` directory; a `\\?\`
  prefixed working directory breaks `javac` (proven in the first
  session record).
- GitHub HTTPS access works from this machine.
- Toolchain: Node 24.15.0, npm 11, JDK 17.0.12, Android SDK; version
  set D3.

## 7. Emulator rule

- Emulation runs on the physical phone via Wireless Debugging; no AVD
  is assumed.
- Before running the app, questions are asked in order: first "Did
  you open Metro?", if Yes then "Is your phone ready for emulation?"
  (Yes/No).
- Until "Yes" is received to both questions, the device is not
  touched: no `adb` connect/emulator command is run, no install is
  attempted. On a "No" answer the job is parked and the question is
  asked again later.
- The wireless `adb` port (e.g. `37301`) changes on every reconnect;
  the old port is never assumed and an address from previous records
  is never reused.
- The port is asked only when needed: the current address is taken
  from the `adb devices` output run at that moment; when no device
  appears in the list, the port is asked from the user, and no
  connection is attempted by guessing.
