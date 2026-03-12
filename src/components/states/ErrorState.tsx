import { useGraphStore } from "../../stores/graphStore";

export function ErrorState() {
  const errorMessage = useGraphStore((s) => s.errorMessage);
  const reset = useGraphStore((s) => s.reset);

  return (
    <div className="flex h-full w-full items-center justify-center grain-bg">
      <div className="relative z-10 flex w-96 flex-col items-center gap-6">
        {/* Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-accent-danger/30 bg-accent-danger/5">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent-danger"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        {/* Message */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="font-mono text-sm font-semibold text-accent-danger">
            Scan Failed
          </h2>
          <p className="font-mono text-xs leading-relaxed text-text-secondary">
            {errorMessage ?? "An unknown error occurred."}
          </p>
        </div>

        {/* Retry */}
        <button
          onClick={reset}
          className="rounded border border-border bg-bg-elevated px-4 py-2 font-mono text-xs text-text-secondary transition-all duration-300 hover:border-text-muted hover:text-text-primary"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
