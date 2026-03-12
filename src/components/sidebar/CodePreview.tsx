import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { codeToHtml } from "shiki";
import type { FilePreview } from "../../lib/types";

interface CodePreviewProps {
  filePath: string;
  language: string;
}

const INITIAL_LINES = 50;
const LOAD_MORE_LINES = 50;

export function CodePreview({ filePath, language }: CodePreviewProps) {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleLines, setVisibleLines] = useState(INITIAL_LINES);
  const [totalLines, setTotalLines] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setHtml("");
      setVisibleLines(INITIAL_LINES);

      try {
        const preview = await invoke<FilePreview>("get_file_preview", {
          path: filePath,
        });

        if (cancelled) return;

        const allLines = preview.content.split("\n");
        setTotalLines(allLines.length);

        const sliced = allLines.slice(0, INITIAL_LINES).join("\n");
        const lang = mapLanguage(preview.language || language);

        const highlighted = await codeToHtml(sliced, {
          lang,
          theme: "vitesse-dark",
        });

        if (cancelled) return;
        setHtml(highlighted);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load file preview";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [filePath, language]);

  async function handleShowMore() {
    try {
      const preview = await invoke<FilePreview>("get_file_preview", {
        path: filePath,
      });

      const allLines = preview.content.split("\n");
      const nextVisible = visibleLines + LOAD_MORE_LINES;
      const sliced = allLines.slice(0, nextVisible).join("\n");
      const lang = mapLanguage(preview.language || language);

      const highlighted = await codeToHtml(sliced, {
        lang,
        theme: "vitesse-dark",
      });

      setHtml(highlighted);
      setVisibleLines(nextVisible);
    } catch {
      // Silently ignore -- the existing preview stays visible
    }
  }

  const hasMore = totalLines > visibleLines;

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <span className="inline-block h-2 w-2 rounded-full bg-accent-cyan animate-pulse-slow" />
        <span className="font-mono text-xs text-text-muted">Loading preview...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-accent-red/20 bg-accent-red/5 px-3 py-2 font-mono text-xs text-accent-red">
        {error}
      </div>
    );
  }

  // Note: dangerouslySetInnerHTML is safe here because the HTML is generated
  // by Shiki from local file content fetched via Tauri (not user web input).
  return (
    <div className="flex flex-col gap-2">
      <div
        ref={containerRef}
        className="overflow-x-auto rounded border border-border bg-bg-primary text-[11px] leading-relaxed [&_pre]:!bg-transparent [&_pre]:p-3 [&_code]:font-mono"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {hasMore && (
        <button
          onClick={handleShowMore}
          className="self-start rounded border border-border bg-bg-elevated px-2.5 py-1 font-mono text-[10px] text-text-muted transition-all duration-300 hover:border-accent-cyan hover:text-accent-cyan"
        >
          Show more ({totalLines - visibleLines} lines remaining)
        </button>
      )}
    </div>
  );
}

/** Map project language names to Shiki language identifiers. */
function mapLanguage(lang: string): string {
  const map: Record<string, string> = {
    typescript: "typescript",
    tsx: "tsx",
    javascript: "javascript",
    jsx: "jsx",
    go: "go",
    rust: "rust",
    python: "python",
    java: "java",
    ruby: "ruby",
    php: "php",
    c: "c",
    cpp: "cpp",
  };
  return map[lang.toLowerCase()] ?? "text";
}
