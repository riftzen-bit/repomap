import { useEffect } from "react";
import { useGraphStore } from "../stores/graphStore";

interface UseKeyboardShortcutsParams {
  zoomIn: () => void;
  zoomOut: () => void;
  fitToScreen: () => void;
  onToggleHelp: () => void;
}

export function useKeyboardShortcuts({
  zoomIn,
  zoomOut,
  fitToScreen,
  onToggleHelp,
}: UseKeyboardShortcutsParams) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger shortcuts when typing in an input or textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.ctrlKey) {
        switch (e.key) {
          case "+":
          case "=":
            e.preventDefault();
            zoomIn();
            return;
          case "-":
            e.preventDefault();
            zoomOut();
            return;
          case "0":
            e.preventDefault();
            fitToScreen();
            return;
          case "1":
            e.preventDefault();
            useGraphStore.getState().setLayout("force");
            return;
          case "2":
            e.preventDefault();
            useGraphStore.getState().setLayout("tree");
            return;
          case "3":
            e.preventDefault();
            useGraphStore.getState().setLayout("circle");
            return;
        }
      }

      if (e.key === "Escape") {
        useGraphStore.getState().selectNode(null);
        return;
      }

      if (e.key === "?") {
        onToggleHelp();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomIn, zoomOut, fitToScreen, onToggleHelp]);
}
