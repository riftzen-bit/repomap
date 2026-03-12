import { useCallback, useState } from "react";
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
  const [exportError, setExportError] = useState<string | null>(null);

  const clearError = useCallback(() => setExportError(null), []);

  const exportSvg = useCallback(async () => {
    setExportError(null);
    const cy = cyRef.current as CyWithSvg | null;
    if (!cy) return;

    const filePath = await save({
      defaultPath: "repomap-graph.svg",
      filters: [{ name: "SVG Image", extensions: ["svg"] }],
    });
    if (!filePath) return;

    try {
      const svgContent = cy.svg({ full: true });
      await writeTextFile(filePath, svgContent);
    } catch (err) {
      setExportError(`SVG export failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [cyRef]);

  const exportPng = useCallback(async () => {
    setExportError(null);
    const cy = cyRef.current;
    if (!cy) return;

    const filePath = await save({
      defaultPath: "repomap-graph.png",
      filters: [{ name: "PNG Image", extensions: ["png"] }],
    });
    if (!filePath) return;

    try {
      const base64 = cy.png({ full: true, scale: 2 });
      const raw = base64.replace(/^data:image\/png;base64,/, "");
      const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
      await writeFile(filePath, bytes);
    } catch (err) {
      setExportError(`PNG export failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [cyRef]);

  const exportJson = useCallback(async () => {
    setExportError(null);
    if (!graphData) return;

    const filePath = await save({
      defaultPath: "repomap-graph.json",
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (!filePath) return;

    try {
      const graphJson = JSON.stringify(graphData);
      await invoke<string>("export_json", { graphJson, outputPath: filePath });
    } catch (err) {
      setExportError(`JSON export failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [graphData]);

  const exportMermaid = useCallback(async () => {
    setExportError(null);
    if (!graphData) return;

    const filePath = await save({
      defaultPath: "repomap-graph.mmd",
      filters: [{ name: "Mermaid Diagram", extensions: ["mmd"] }],
    });
    if (!filePath) return;

    try {
      const graphJson = JSON.stringify(graphData);
      await invoke<string>("export_mermaid", { graphJson, outputPath: filePath });
    } catch (err) {
      setExportError(`Mermaid export failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [graphData]);

  return { exportSvg, exportPng, exportJson, exportMermaid, exportError, clearError };
}
