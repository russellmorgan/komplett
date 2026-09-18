# Komplett

Live: https://komplett-2987f.web.app

To-do list + pomodoro timer + accountability partner, for a handful of friends. Domain vocabulary is in [CONTEXT.md](CONTEXT.md); spec and tickets are GitHub issues #1–#12.

## Local development

Requires Node 20+, [pnpm](https://pnpm.io) (`corepack enable pnpm`) and a Java 21+ runtime (for the Firestore emulator).

```bash
pnpm install
pnpm dev      # Auth + Firestore emulators (UI at http://localhost:4000) and Vite on http://localhost:5173
pnpm test     # Vitest, domain module only
pnpm lint     # Biome + tsc
pnpm build    # production bundle in dist/
pnpm deploy   # build, then publish dist/ and firestore.rules to Firebase (needs `pnpm firebase login`)
```

`pnpm dev` always talks to the local emulators under the fake project `demo-komplett`; no Firebase project is needed. In the emulator, "Sign in with Google" opens a fake account picker, and magic links are printed to the terminal instead of being emailed.

## Firebase project (one-time, manual)

Production builds need a real Firebase project on the **Spark plan** (never Blaze, never a card on file).

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**. Decline Google Analytics.
2. **Build → Authentication → Get started → Sign-in method**: enable **Google** (pick a support email) and **Email/Password** with the **Email link (passwordless sign-in)** toggle on.
3. **Build → Firestore Database → Create database** in production mode. `.firebaserc` already points at the project; `pnpm firebase login` once, then `pnpm deploy` publishes rules and hosting.
4. **Project settings (gear) → Your apps → Add app → Web**. Copy `apiKey`, `authDomain`, `projectId`, `appId` into `.env` (see [.env.example](.env.example)).
5. **Authentication → Settings → Authorised domains**: add every domain the app is served from (`localhost` and the Hosting domains are pre-listed; add any custom domain). Magic links only work from listed domains.

## Layout

- `src/domain/` — pure functions, no React or Firebase. The tested seam.
- `src/data/` — the only place `firebase/*` may be imported (Biome fails the build otherwise). Components use its hooks and functions.
- `src/screens/` — screen components.
- `src/tokens.css` — every color, font, spacing and radius; components never hardcode values.
- `firestore.rules` — security rules; `firebase.json` — emulator config.
