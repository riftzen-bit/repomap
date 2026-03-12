import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useGraphStore } from "../../stores/graphStore";
import type { GitBlameInfo } from "../../lib/types";

export function GitBlame({ filePath }: { filePath: string }) {
  const projectRoot = useGraphStore((s) => s.projectRoot);
  const [blame, setBlame] = useState<GitBlameInfo | null>(null);

  useEffect(() => {
    if (!projectRoot) return;
    let cancelled = false;

    invoke<GitBlameInfo>("get_git_blame", { path: filePath, root: projectRoot })
      .then((data) => { if (!cancelled) setBlame(data); })
      .catch(() => { if (!cancelled) setBlame(null); });

    return () => { cancelled = true; };
  }, [filePath, projectRoot]);

  if (!blame) return null;

  const timeAgo = formatRelativeTime(blame.timestamp);

  return (
    <div className="flex items-center gap-2 font-mono text-[10px] text-text-muted">
      <span className="text-text-secondary">{blame.author}</span>
      <span>&middot;</span>
      <span>{timeAgo}</span>
      <span>&middot;</span>
      <span className="truncate">{blame.message}</span>
    </div>
  );
}

function formatRelativeTime(unixSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - unixSeconds;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (diff < 60) return rtf.format(-diff, "second");
  if (diff < 3600) return rtf.format(-Math.floor(diff / 60), "minute");
  if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), "hour");
  if (diff < 2592000) return rtf.format(-Math.floor(diff / 86400), "day");
  if (diff < 31536000) return rtf.format(-Math.floor(diff / 2592000), "month");
  return rtf.format(-Math.floor(diff / 31536000), "year");
}
