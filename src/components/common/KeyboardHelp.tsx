interface KeyboardHelpProps {
  onClose: () => void;
}

const shortcuts = [
  { keys: ["Ctrl", "O"], description: "Open folder" },
  { keys: ["Ctrl", "+"], description: "Zoom in" },
  { keys: ["Ctrl", "-"], description: "Zoom out" },
  { keys: ["Ctrl", "0"], description: "Fit to screen" },
  { keys: ["Ctrl", "1"], description: "Force layout" },
  { keys: ["Ctrl", "2"], description: "Tree layout" },
  { keys: ["Ctrl", "3"], description: "Circle layout" },
  { keys: ["Esc"], description: "Deselect node" },
  { keys: ["?"], description: "Toggle this help" },
];

export function KeyboardHelp({ onClose }: KeyboardHelpProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div
        className="relative rounded-lg border border-border bg-bg-secondary p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-mono text-sm font-medium text-text-primary">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors hover:text-text-primary"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {shortcuts.map(({ keys, description }) => (
            <div
              key={description}
              className="flex items-center justify-between gap-6"
            >
              <span className="font-mono text-xs text-text-secondary">
                {description}
              </span>
              <div className="flex gap-1">
                {keys.map((key) => (
                  <kbd
                    key={key}
                    className="rounded border border-border bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-text-secondary"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
