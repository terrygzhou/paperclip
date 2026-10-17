/**
 * Client-side mirror of the server's `normalizeProjectRepositoryUrl`
 * (server/src/services/project-repositories.ts). Accepts only a plain
 * `https://github.com/<owner>/<repo>` URL without credentials, query, or
 * fragment, so the board UI rejects bad input before the round-trip.
 */
const GITHUB_REPOSITORY_URL_PATH = /^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export type NormalizedGitHubRepositoryUrl = {
  fullName: string;
  url: string;
};

export function normalizeGitHubRepositoryUrl(value: string): NormalizedGitHubRepositoryUrl | null {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (
    parsed.protocol !== "https:"
    || parsed.hostname !== "github.com"
    || parsed.port
    || parsed.username
    || parsed.password
    || parsed.search
    || parsed.hash
  ) {
    return null;
  }
  const path = parsed.pathname.replace(/\/$/, "").replace(/\.git$/, "");
  if (!GITHUB_REPOSITORY_URL_PATH.test(path) || path.split("/").some((part) => part === "." || part === "..")) {
    return null;
  }
  return { fullName: path.slice(1), url: `https://github.com${path}` };
}
