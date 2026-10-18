## Context

Paperclip uses Better Auth v1.7.2 with a drizzleAdapter for all board operator sign-in. The current auth surface is:
- **Email/password** (`POST /api/auth/sign-in/email`) with optional TOTP 2FA
- **Agent API keys** (`agent_api_keys`, bearer) for automation/agent runs
- **Board API keys** (`board_api_keys`, bearer) for board-context logins
- **Cloud tenant trusted headers** (`x-paperclip-cloud-*`) for managed Cloud stacks

Better Auth ships a `google()` social-provider plugin that handles the full OAuth2 Authorization Code flow (state/nonce generation, PKCE S256, id_token verification, user upsert, session issuance) natively. The Glory EV rental reference (Obsidian reverse-engineering) validates the exact protocol: OAuth2 Authorization Code + PKCE S256, cookie-based session, double-submit CSRF, open-redirect guard on `return_to`.

Constraint: Better Auth's `sensitiveSessionMiddleware` enforces trusted `Origin` on social sign-in routes. In dev this is `127.0.0.1:3100`; in production it must match the deployed app origin.

## Goals / Non-Goals

**Goals:**
- Optional Google SSO for operator board sign-in, enabled per instance via config
- Authorization Code + PKCE (S256) — the security-correct default for server-side-rendered / cookie-based web apps
- Zero behavior change for agents, API-key auth, board-context logins, cloud-tenant auth
- First-time login upserts the user into `auth_users`; existing session model (Better Auth cookie) is reused
- Open-redirect guard on callback redirects (Better Auth's `reject-redirects.ts` + `trustedOrigins`)

**Non-Goals:**
- SAML / OIDC generic federation (out of scope; Google-only SSO)
- Replacing email/password or 2FA (additive, not replacement)
- Changing agent/automation auth (API keys remain the agent credential)
- Forcing Google SSO on all instances (opt-in per instance via config)
- Supporting multiple IdPs in this change (architecture is extensible, but this PR adds Google only)

## Decisions

1. **Use Better Auth `google()` social-provider plugin, not a hand-rolled OAuth2 module.** The plugin provides state/nonce generation, PKCE S256, code exchange, id_token verification (signature + `aud` + `iss` + `exp` + `nonce`), user upsert, and session issuance out of the box. `google()` returns a provider config object that must be wrapped in `genericOAuth({ config: [google({ clientId, clientSecret })] })` (imported from `better-auth/plugins`) before registration; the provider import comes from `better-auth/social-providers` (plural). Registering the wrapped plugin alongside `twoFactor()` and the workspace handoff plugin in `buildBetterAuthPlugins(db, config)` keeps all auth providers at a single assembly site.

2. **PKCE S256 (Authorization Code flow), not implicit or client-side ID Token.** The reference implementation and the security threat model both confirm: PKCE S256 keeps the `code_verifier` server-side, the browser never sees a token, and the authorization code is bound to the verifier. This matches what Better Auth's `google()` plugin implements by default for web apps.

3. **Cookie-based session, not Bearer.** Paperclip's existing session model is Better Auth's HttpOnly cookie session (`paperclip-<instanceId>` prefix). Google SSO issues a session through the same path — no Bearer token in the browser. This is consistent with the observed target in the reference.

4. **Double-submit CSRF (Better Auth built-in).** Better Auth's session middleware already sets a readable session cookie and validates it on mutations. No separate CSRF cookie is needed (the reference's `byd_csrf` + `x-csrf-token` double-submit is the same pattern Better Auth implements internally).

5. **Open-redirect guard via `trustedOrigins`.** Better Auth's `reject-redirects.ts` (already in the dependency tree) validates that any `redirect_uri` returned after the callback is within the trusted origin set. The `return_to` query param on `/api/auth/sign-in/social` is validated against `trustedOrigins` before being carried through the OAuth2 flow. No unvalidated redirect is possible.

6. **Config via environment variables, not instance settings DB rows.** `PAPERCLIP_GOOGLE_CLIENT_ID` and `PAPERCLIP_GOOGLE_CLIENT_SECRET` are read at Better Auth instance creation time. This avoids a DB write on the auth path and matches the existing `BETTER_AUTH_SECRET` / `PAPERCLIP_AGENT_JWT_SECRET` pattern. The sign-in page reads a "Google SSO enabled" flag from a lightweight GET endpoint (or the profile response) to conditionally render the button.

7. **First-time upsert by email.** Better Auth's `google()` plugin upserts by `sub` (Google's stable user ID) and stores the social link in `authAccounts`. If the email already exists in `auth_users`, the social account is linked to the existing user; otherwise a new `auth_users` row is created. The user still needs an active `company_memberships` row (or instance-admin grant) to access a board — SSO does not auto-grant company membership.

8. **Guarded approach: no migration required.** `authAccounts` table is already in the Better Auth drizzleAdapter schema map and is created by the existing Better Auth migration. No new table or column is needed for Google SSO; the `authAccounts.provider` column stores `"google"` for the social link.

## Risks / Trade-offs

- **Google OAuth client misconfiguration.** An operator must register a Google OAuth web client with the correct `redirect_uri` (`https://<instance>/api/auth/callback/google`). A wrong or missing `redirect_uri` in the Google Cloud Console causes Google to return an `error=redirect_uri_mismatch` on the callback. The operator must verify this in the Google Cloud Console before enabling SSO. The error is surfaced in the sign-in page as a banner; the email/password path remains available.

- **Cookie blast radius.** Better Auth's session cookie is scoped to the app origin (not a path-scoped sub-path like the reference's `Path=/api/v1/auth/google`). This is a trade-off for simplicity: Better Auth's cookie prefix (`paperclip-<instanceId>`) already isolates multi-instance deployments on the same host. The in-flight OAuth state (state/nonce/verifier) is held server-side in the session, not in a separate path-scoped cookie, which is a deviation from the reference but is equivalent in security posture (state is still single-use, short-TTL, HttpOnly).

- **Open-redirect coupling to `trustedOrigins`.** The open-redirect guard depends on `trustedOrigins` being correctly configured. In dev, the app origin is `http://127.0.0.1:3100`. In production, the operator must ensure the deployed URL is in `trustedOrigins` (already required for Better Auth's `sensitiveSessionMiddleware`). A misconfiguration blocks Google SSO callbacks with a 403; email/password is unaffected.

- **User upsert without company membership.** A new user who signs in with Google for the first time gets an `auth_users` row but no `company_memberships` row. They see the sign-in page (or a "no active company" state) until an admin grants them membership. This is the expected behavior — SSO is a credential, not a membership grant. The UI should surface a clear message: "You've signed in with Google. Contact your Paperclip admin to be added to a company."

- **Multi-instance isolation on same domain.** If multiple Paperclip instances share the same domain (e.g., subdomains), the Better Auth cookie prefix (`paperclip-<instanceId>`) prevents cookie collision. If they share the exact same domain + port, the cookie prefix is the only isolation — the operator must ensure distinct instance IDs.
