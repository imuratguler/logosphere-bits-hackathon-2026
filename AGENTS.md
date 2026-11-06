# Logosphere BITS — Agent Instructions

Muse Code reads this file as project rules when it runs in this directory.

## First: session protocol

- Read `docs/SESSION_TODO.md` first and follow it. It is the single source of
  general rules for every session in this folder.
- Opening: create your active session file with the `tools/new-session.ps1`
  procedure (`docs/sessions/Logosphere BITS, yyyymmdd_hhnnss_TST.MD`, TST = UTC+03:00), read the
  nearest previous session record, reconcile with real files and Git status, and
  write the inherited state into your file.
- Logging: before each user command write the request summary plus in-progress
  status; after EVERY command completes and before reporting, update the same file
  (operations, changed files, decisions, real check results, errors, remaining
  work, next action, Git status). Never delete earlier records. No keys or tokens.

## Project

- Android app (React Native 0.88.1 + TypeScript, bare workflow). Scope: `docs/SCOPE.md`.
- Decisions: `docs/DECISIONS.md` (D1–D19, Final). Default app language: English.
- Checks: `npm run typecheck`, `npm run lint`, `npm run format`, `npm test`.
- Do only the task given in the current message; never scaffold future work early.
- Git: user `imuratguler`, branch `main`; fetch before push, verify HEAD equals
  `origin/main` after; never force-push, rewrite history, or commit secrets.
