import { useState } from "react";
import { Link, Plus, X } from "lucide-react";
import type { NormalizedGitHubRepositoryUrl } from "@/lib/github-repository-url";
import { normalizeGitHubRepositoryUrl } from "@/lib/github-repository-url";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

/**
 * Manual "add by URL" entry for repositories that are not in the GitHub
 * connection catalog. Mirrors the server's `repositoryUrls` create field and
 * the workspace `repoUrl` field, so no OAuth connection is required.
 */
export function AddRepositoryUrlForm({ onSubmit, busy, error, hint }: {
  onSubmit: (repo: NormalizedGitHubRepositoryUrl) => void;
  busy?: boolean;
  error?: string | null;
  hint?: string;
}) {
  const [value, setValue] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  return (
    <form className="flex flex-col gap-2" onSubmit={(event) => {
      event.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || busy) return;
      const normalized = normalizeGitHubRepositoryUrl(trimmed);
      if (!normalized) {
        setValidationError("Use an HTTPS GitHub repository URL, for example https://github.com/<owner>/<repo>.");
        return;
      }
      setValidationError(null);
      setValue("");
      onSubmit(normalized);
    }}>
      <div className="flex flex-col gap-2">
        <Input aria-label="Repository URL" type="url" placeholder="https://github.com/<owner>/<repo>" value={value} disabled={busy}
          onChange={(event) => { setValue(event.target.value); setValidationError(null); }} />
        {(validationError || error) && <p role="alert" className="text-xs text-destructive">{validationError ?? error}</p>}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">Registers the repo without a GitHub connection.</span>
        <Button type="submit" variant="outline" size="sm" disabled={busy || !value.trim()}><Plus className="size-4" />Add URL</Button>
      </div>
    </form>
  );
}

/** Read-only row for a manually added URL repository, matching the catalog repo rows. */
export function RepositoryUrlRow({ fullName, url, onRemove, busy }: {
  fullName: string;
  url: string;
  onRemove?: () => void;
  busy?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-md border border-border px-3 py-2">
      <Link className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm font-medium" title={url}>{fullName}</span>
        <span className="truncate text-xs text-muted-foreground" title={url}>{url}</span>
      </div>
      {onRemove && <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${fullName}`} disabled={busy} onClick={onRemove}><X className="size-4" /></Button>}
    </div>
  );
}
