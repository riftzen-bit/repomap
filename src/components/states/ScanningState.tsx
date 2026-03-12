import { useGraphStore } from "../../stores/graphStore";

export function ScanningState() {
  const scanProgress = useGraphStore((s) => s.scanProgress);

  const filesScanned = scanProgress?.filesScanned ?? 0;
  const totalFiles = scanProgress?.totalFiles ?? 0;
  const percent = totalFiles > 0 ? (filesScanned / totalFiles) * 100 : 0;

  return (
    <div className="flex h-full w-full items-center justify-center grain-bg">
      <div className="relative z-10 flex w-80 flex-col items-center gap-6">
        {/* Spinner dot */}
        <div className="flex items-center gap-2.5 animate-pulse-slow">
          <span className="inline-block h-2 w-2 rounded-full bg-accent-primary" />
          <span className="text-sm font-medium text-text-primary">
            Scanning
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full">
          <div className="h-1 w-full overflow-hidden rounded-full bg-bg-surface">
            {totalFiles > 0 ? (
              <div
                className="h-full rounded-full bg-accent-primary transition-all duration-300 ease-out"
                style={{ width: `${percent}%` }}
              />
            ) : (
              <div className="h-full w-1/3 rounded-full bg-accent-primary/60 animate-sweep" />
            )}
          </div>
        </div>

        {/* Counter */}
        <span className="font-mono text-xs text-text-muted">
          {totalFiles > 0
            ? `${filesScanned} of ${totalFiles} files`
            : "Discovering files\u2026"}
        </span>
      </div>
    </div>
  );
}
