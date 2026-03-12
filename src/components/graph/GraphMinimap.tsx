import { useEffect, useRef, useState, useCallback } from "react";
import type cytoscape from "cytoscape";

interface GraphMinimapProps {
  cy: React.RefObject<cytoscape.Core | null>;
  /** Pass graphData so the effect re-runs after cy is populated */
  graphReady: boolean;
}

const MAP_W = 160;
const MAP_H = 120;
const PADDING = 10;
const NODE_RADIUS = 2;
const REDRAW_INTERVAL = 33; // ~30fps

export function GraphMinimap({ cy, graphReady }: GraphMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(true);
  const draggingRef = useRef(false);
  const redrawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const cyInst = cy.current;
    if (!canvas || !cyInst) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = MAP_W * dpr;
    canvas.height = MAP_H * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, MAP_W, MAP_H);

    const nodes = cyInst.nodes().filter((n) => n.style("display") !== "none");
    if (nodes.length === 0) return;

    const bb = nodes.boundingBox();
    const graphW = bb.w || 1;
    const graphH = bb.h || 1;

    // Scale to fit minimap with padding
    const innerW = MAP_W - PADDING * 2;
    const innerH = MAP_H - PADDING * 2;
    const scale = Math.min(innerW / graphW, innerH / graphH);

    const offsetX = PADDING + (innerW - graphW * scale) / 2;
    const offsetY = PADDING + (innerH - graphH * scale) / 2;

    function toMiniX(gx: number): number {
      return offsetX + (gx - bb.x1) * scale;
    }
    function toMiniY(gy: number): number {
      return offsetY + (gy - bb.y1) * scale;
    }

    // Draw edges as faint lines
    const edges = cyInst.edges().filter((e) => e.style("display") !== "none");
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = "rgba(90, 83, 72, 0.4)";
    ctx.beginPath();
    edges.forEach((edge) => {
      const src = edge.source().position();
      const tgt = edge.target().position();
      ctx.moveTo(toMiniX(src.x), toMiniY(src.y));
      ctx.lineTo(toMiniX(tgt.x), toMiniY(tgt.y));
    });
    ctx.stroke();

    // Draw nodes as dots
    nodes.forEach((node) => {
      const pos = node.position();
      const color = (node.data("nodeColor") as string) || "#8a8078";
      const mx = toMiniX(pos.x);
      const my = toMiniY(pos.y);

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(mx, my, NODE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw viewport rectangle
    const extent = cyInst.extent();
    const vx1 = toMiniX(extent.x1);
    const vy1 = toMiniY(extent.y1);
    const vx2 = toMiniX(extent.x2);
    const vy2 = toMiniY(extent.y2);
    const vw = vx2 - vx1;
    const vh = vy2 - vy1;

    ctx.fillStyle = "rgba(240, 160, 80, 0.08)";
    ctx.fillRect(vx1, vy1, vw, vh);

    ctx.strokeStyle = "#f0a050";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(vx1, vy1, vw, vh);
  }, [cy]);

  const scheduleDraw = useCallback(() => {
    if (redrawTimerRef.current !== null) return;
    redrawTimerRef.current = setTimeout(() => {
      redrawTimerRef.current = null;
      draw();
    }, REDRAW_INTERVAL);
  }, [draw]);

  // Attach cytoscape listeners — retry until cy is available
  const attachedRef = useRef(false);
  useEffect(() => {
    attachedRef.current = false;

    function tryAttach() {
      const cyInst = cy.current;
      if (!cyInst) {
        // cy not ready yet — retry next frame
        retryRef.current = requestAnimationFrame(tryAttach);
        return;
      }

      attachedRef.current = true;
      const handler = () => scheduleDraw();

      cyInst.on("viewport", handler);
      cyInst.on("position", handler);
      cyInst.on("add", handler);
      cyInst.on("remove", handler);
      cyInst.on("style", handler);
      cyInst.on("layoutstop", handler);

      // Initial draw after a short delay so layout has time to run
      setTimeout(draw, 100);

      cleanupFnRef.current = () => {
        cyInst.off("viewport", handler);
        cyInst.off("position", handler);
        cyInst.off("add", handler);
        cyInst.off("remove", handler);
        cyInst.off("style", handler);
        cyInst.off("layoutstop", handler);
      };
    }

    const retryRef = { current: 0 };
    const cleanupFnRef = { current: () => {} };
    tryAttach();

    return () => {
      cancelAnimationFrame(retryRef.current);
      cleanupFnRef.current();

      if (redrawTimerRef.current !== null) {
        clearTimeout(redrawTimerRef.current);
        redrawTimerRef.current = null;
      }
    };
  }, [cy, draw, scheduleDraw, graphReady]);

  // Pan graph when clicking/dragging on minimap
  const panToMinimapCoords = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      const cyInst = cy.current;
      if (!canvas || !cyInst) return;

      const rect = canvas.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;

      const nodes = cyInst.nodes().filter((n) => n.style("display") !== "none");
      if (nodes.length === 0) return;

      const bb = nodes.boundingBox();
      const graphW = bb.w || 1;
      const graphH = bb.h || 1;

      const innerW = MAP_W - PADDING * 2;
      const innerH = MAP_H - PADDING * 2;
      const scale = Math.min(innerW / graphW, innerH / graphH);

      const offsetX = PADDING + (innerW - graphW * scale) / 2;
      const offsetY = PADDING + (innerH - graphH * scale) / 2;

      // Convert minimap coords back to graph coords
      const gx = bb.x1 + (mx - offsetX) / scale;
      const gy = bb.y1 + (my - offsetY) / scale;

      // Center the viewport on this graph position
      const zoom = cyInst.zoom();
      const containerW = cyInst.width();
      const containerH = cyInst.height();
      cyInst.pan({
        x: containerW / 2 - gx * zoom,
        y: containerH / 2 - gy * zoom,
      });
    },
    [cy],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      draggingRef.current = true;
      panToMinimapCoords(e.clientX, e.clientY);
    },
    [panToMinimapCoords],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      panToMinimapCoords(e.clientX, e.clientY);
    },
    [panToMinimapCoords],
  );

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  // Also handle mouse leaving the minimap while dragging
  const handleMouseLeave = useCallback(() => {
    draggingRef.current = false;
  }, []);

  return (
    <div className="absolute right-4 bottom-4 z-30 select-none">
      {/* Toggle button */}
      <button
        onClick={() => setVisible((v) => !v)}
        className="absolute -top-7 right-0 flex items-center gap-1 rounded-t border border-b-0 border-border bg-bg-elevated/90 px-1.5 py-0.5 font-mono text-[9px] text-text-muted transition-colors duration-200 hover:text-text-secondary"
        aria-label={visible ? "Hide minimap" : "Show minimap"}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {visible ? (
            <>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </>
          ) : (
            <>
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </>
          )}
        </svg>
        Map
      </button>

      {/* Minimap canvas */}
      <div
        className="overflow-hidden rounded border border-border bg-bg-elevated/90 transition-all duration-200"
        style={{
          width: MAP_W,
          height: visible ? MAP_H : 0,
          opacity: visible ? 1 : 0,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: MAP_W, height: MAP_H }}
          className="cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    </div>
  );
}
