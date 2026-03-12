import { useState, useEffect, useRef } from "react";
import { Tooltip } from "../common/Tooltip";

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
  onExportJson: () => void;
  onExportMermaid: () => void;
}

export function GraphControls({
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onExportSvg,
  onExportPng,
  onExportJson,
  onExportMermaid,
}: GraphControlsProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setExportOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setExportOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [exportOpen]);

  function handleExport(fn: () => void) {
    setExportOpen(false);
    fn();
  }

  return (
    <div className="absolute bottom-4 left-4 flex flex-col gap-1.5">
      <Tooltip text="Zoom in (Ctrl++)">
        <ControlButton onClick={onZoomIn} label="Zoom in">
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </ControlButton>
      </Tooltip>

      <Tooltip text="Zoom out (Ctrl+-)">
        <ControlButton onClick={onZoomOut} label="Zoom out">
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
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </ControlButton>
      </Tooltip>

      <Tooltip text="Fit to screen (Ctrl+0)">
        <ControlButton onClick={onFitToScreen} label="Fit to screen">
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
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        </ControlButton>
      </Tooltip>

      <div ref={dropdownRef} className="relative">
        {exportOpen && (
          <div className="absolute bottom-full left-0 mb-1.5 rounded border border-border bg-bg-elevated shadow-lg">
            <DropdownItem
              label="Export SVG"
              onClick={() => handleExport(onExportSvg)}
            />
            <DropdownItem
              label="Export PNG"
              onClick={() => handleExport(onExportPng)}
            />
            <DropdownItem
              label="Export JSON"
              onClick={() => handleExport(onExportJson)}
            />
            <DropdownItem
              label="Export Mermaid"
              onClick={() => handleExport(onExportMermaid)}
            />
          </div>
        )}

        <ControlButton
          onClick={() => setExportOpen((prev) => !prev)}
          label="Export"
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </ControlButton>
      </div>
    </div>
  );
}

function ControlButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded border border-border bg-bg-elevated text-text-secondary transition-all duration-200 hover:border-accent-primary hover:text-accent-primary"
    >
      {children}
    </button>
  );
}

function DropdownItem({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="block w-full whitespace-nowrap px-3 py-1.5 text-left font-mono text-xs text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
    >
      {label}
    </button>
  );
}
