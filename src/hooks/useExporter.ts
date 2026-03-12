import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile, writeTextFile } from "@tauri-apps/plugin-fs";
import type { Core } from "cytoscape";
import { useGraphStore } from "../stores/graphStore";

// Cytoscape's svg() exists at runtime but is not in @types/cytoscape.
interface CyWithSvg extends Core {
  svg(options?: { full?: boolean }): string;
}

export function useExporter(cyRef: React.RefObject<Core | null>) {
  const graphData = useGraphStore((s) => s.graphData);

  const exportSvg = useCallback(async () => {
    try {
      const cy = cyRef.current as CyWithSvg | null;
      if (!cy) return;

      const filePath = await save({
        defaultPath: "repomap-graph.svg",
        filters: [{ name: "SVG Image", extensions: ["svg"] }],
      });
      if (!filePath) return;

      const svgContent = cy.svg({ full: true });
      await writeTextFile(filePath, svgContent);
    } catch {
      // Save dialog dismissed or write failed
    }
  }, [cyRef]);

  const exportPng = useCallback(async () => {
    try {
      const cy = cyRef.current;
      if (!cy) return;

      const filePath = await save({
        defaultPath: "repomap-graph.png",
        filters: [{ name: "PNG Image", extensions: ["png"] }],
      });
      if (!filePath) return;

      const base64 = cy.png({ full: true, scale: 2 });
      // Strip data URL prefix to get raw base64
      const raw = base64.replace(/^data:image\/png;base64,/, "");
      const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
      await writeFile(filePath, bytes);
    } catch {
      // Save dialog dismissed or write failed
    }
  }, [cyRef]);

  const exportJson = useCallback(async () => {
    try {
      if (!graphData) return;

      const filePath = await save({
        defaultPath: "repomap-graph.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!filePath) return;

      const graphJson = JSON.stringify(graphData);
      await invoke<string>("export_json", {
        graphJson,
        outputPath: filePath,
      });
    } catch {
      // Save dialog dismissed or export failed
    }
  }, [graphData]);

  const exportMermaid = useCallback(async () => {
    try {
      if (!graphData) return;

      const filePath = await save({
        defaultPath: "repomap-graph.mmd",
        filters: [{ name: "Mermaid Diagram", extensions: ["mmd"] }],
      });
      if (!filePath) return;

      const graphJson = JSON.stringify(graphData);
      await invoke<string>("export_mermaid", {
        graphJson,
        outputPath: filePath,
      });
    } catch {
      // Save dialog dismissed or export failed
    }
  }, [graphData]);

  return { exportSvg, exportPng, exportJson, exportMermaid };
}
