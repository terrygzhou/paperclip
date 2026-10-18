## 1. Config: environment variables for Google provider

- [ ] 1.1 Add `PAPERCLIP_GOOGLE_CLIENT_ID` and `PAPERCLIP_GOOGLE_CLIENT_SECRET` to the server config schema (or read directly from `process.env` at Better Auth instance creation time, matching the `BETTER_AUTH_SECRET` pattern)
- [ ] 1.2 Expose a `googleSsoEnabled: boolean` flag on the sign-in page's config read path so the UI can conditionally render the Google button (either via a new lightweight GET endpoint or an addition to the profile response)
- [ ] 1.3 Document the env vars in `doc/DEVELOPING.md` and any operator-facing docs

## 2. Better Auth plugin registration

- [ ] 2.1 In `server/src/auth/better-auth.ts`, import `{ google }` from `better-auth/social-providers` and `{ genericOAuth }` from `better-auth/plugins`
- [ ] 2.2 Extend `buildBetterAuthPlugins(db, config)` to conditionally add `genericOAuth({ config: [google({ clientId, clientSecret })] })` to the plugin list when both env vars are set
- [ ] 2.3 Ensure `trustedOrigins` includes the Google callback URL (already derived from `allowedHostnames` + `authPublicBaseUrl` in `deriveAuthTrustedOrigins`; verify the callback path is covered)
- [ ] 2.4 Confirm `authAccounts` is already in the drizzleAdapter schema map (it is — verify no additional wiring is needed)
- [ ] 2.5 Run `pnpm -r typecheck` to confirm the plugin addition compiles

## 3. UI: Google sign-in button

- [ ] 3.1 In `ui/src/pages/Auth.tsx` (or equivalent sign-in page), render a "Sign in with Google" button when `googleSsoEnabled` is true
- [ ] 3.2 The button triggers `authApi.signInGoogle()` which calls `POST /api/auth/sign-in/social` with `{ provider: "google", callbackURL: window.location.origin + "/api/auth/callback/google" }` and follows the redirect response
- [ ] 3.3 Add a `?google_error=callback_failed` banner to the sign-in page (matching the reference implementation's failure UX)
- [ ] 3.4 Add unit tests in `ui/src/pages/Auth.test.tsx` for the Google button render state and the error banner
- [ ] 3.5 Run `pnpm check:token-gates` if any UI changes touch `ui/src/components` or `ui/src/pages`

## 4. UI: auth client

- [ ] 4.1 Add `signInGoogle(callbackURL?: string)` to `ui/src/api/auth.ts` — calls `POST /api/auth/sign-in/social` with `{ provider: "google", callbackURL }` and handles the redirect response
- [ ] 4.2 Add unit tests in `ui/src/api/auth.test.ts` for the new method

## 5. Verification and hand-off

- [ ] 5.1 Live end-to-end: set `PAPERCLIP_GOOGLE_CLIENT_ID`/`SECRET` in `.env`, restart server, click "Sign in with Google", complete Google consent, confirm session cookie is set and `GET /api/auth/get-session` returns the session
- [ ] 5.2 Confirm the open-redirect guard: `?return_to=//evil.com` is rejected (falls back to app root)
- [ ] 5.3 Confirm email/password, 2FA, agent API-key, and cloud-tenant auth paths are unchanged with Google SSO enabled
- [ ] 5.4 Run `pnpm test:run` on affected packages before committing
- [ ] 5.5 Fill in the PR template (.github/PULL_REQUEST_TEMPLATE.md) including Model Used
