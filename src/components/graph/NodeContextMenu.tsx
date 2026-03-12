import { useEffect, useRef } from "react";

interface NodeContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  nodePath: string;
  onClose: () => void;
  onCopyPath: () => void;
  onFocusNeighbors: () => void;
  onHideNode: () => void;
  onShowOnlyConnected: () => void;
  onResetView: () => void;
  onToggleBookmark: () => void;
  isBookmarked: boolean;
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

export function NodeContextMenu({
  x,
  y,
  onClose,
  onCopyPath,
  onFocusNeighbors,
  onHideNode,
  onShowOnlyConnected,
  onResetView,
  onToggleBookmark,
  isBookmarked,
}: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Adjust position so menu doesn't overflow viewport
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (rect.right > vw) {
      el.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > vh) {
      el.style.top = `${y - rect.height}px`;
    }
  }, [x, y]);

  // Close on click outside or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const items: MenuItem[] = [
    {
      label: isBookmarked ? "Remove Bookmark" : "Bookmark",
      icon: <BookmarkIcon />,
      action: onToggleBookmark,
    },
    {
      label: "Copy file path",
      icon: <ClipboardIcon />,
      action: onCopyPath,
    },
    {
      label: "Focus neighbors",
      icon: <NeighborsIcon />,
      action: onFocusNeighbors,
    },
    {
      label: "Hide this node",
      icon: <EyeOffIcon />,
      action: onHideNode,
    },
    {
      label: "Show only connected",
      icon: <FilterIcon />,
      action: onShowOnlyConnected,
    },
    {
      label: "Reset view",
      icon: <RefreshIcon />,
      action: onResetView,
    },
  ];

  function handleItemClick(action: () => void) {
    action();
    onClose();
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      className="absolute z-50 min-w-[180px] rounded border border-border bg-bg-elevated py-1 shadow-lg"
      style={{ left: x, top: y }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          role="menuitem"
          onClick={() => handleItemClick(item.action)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-xs text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
        >
          <span className="flex h-4 w-4 shrink-0 items-center justify-center text-text-muted">
            {item.icon}
          </span>
          {item.label}
        </button>
      ))}
    </div>
  );
}

function ClipboardIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function NeighborsIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <circle cx="4" cy="6" r="2" />
      <circle cx="20" cy="6" r="2" />
      <circle cx="4" cy="18" r="2" />
      <circle cx="20" cy="18" r="2" />
      <line x1="9.5" y1="10" x2="5.5" y2="7.5" />
      <line x1="14.5" y1="10" x2="18.5" y2="7.5" />
      <line x1="9.5" y1="14" x2="5.5" y2="16.5" />
      <line x1="14.5" y1="14" x2="18.5" y2="16.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
      <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
    </svg>
  );
}
