import { useGraphStore } from "../../stores/graphStore";

export function ErrorState() {
  const errorMessage = useGraphStore((s) => s.errorMessage);
  const reset = useGraphStore((s) => s.reset);

  return (
    <div className="flex h-full w-full items-center justify-center grain-bg">
      <div className="relative z-10 flex w-96 flex-col items-center gap-5 text-center">
        {/* Error icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-danger/10">
          <svg
            width="20"
            height="20"
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

        <div className="flex flex-col gap-1.5">
          <h2 className="text-sm font-semibold text-text-primary">
            Scan failed
          </h2>
          <p className="text-xs leading-relaxed text-text-secondary">
            {errorMessage ?? "An unknown error occurred."}
          </p>
        </div>

        <button
          onClick={reset}
          className="rounded-lg border border-border bg-bg-elevated px-4 py-2 text-xs font-medium text-text-secondary transition-all hover:border-text-muted hover:text-text-primary active:scale-[0.97]"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
