import { useState } from "react";
import { computeHealthScore } from "../../lib/health";
import { useGraphStore } from "../../stores/graphStore";
import type { Insights } from "../../lib/types";

interface Props {
  insights: Insights;
}

function getScoreColor(score: number): string {
  if (score < 50) return "#e05555";
  if (score <= 75) return "#dbb84d";
  return "#7ec87e";
}

export function HealthGauge({ insights }: Props) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const theme = useGraphStore((s) => s.theme);
  const { score, penalties } = computeHealthScore(insights);

  const radius = 36;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = getScoreColor(score);

  const penaltyRows: { label: string; value: number; color: string }[] = [
    { label: "Circular", value: penalties.circular, color: "#e05555" },
    { label: "Orphans", value: penalties.orphan, color: "#6aacdc" },
    { label: "Hubs", value: penalties.hub, color: "#dbb84d" },
    { label: "Coupling", value: penalties.coupling, color: "#f0a050" },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={() => setShowBreakdown((v) => !v)}
        className="flex flex-col items-center gap-1 rounded p-1 transition-colors hover:bg-bg-elevated"
        aria-label={`Health score ${score} out of 100. Click for breakdown.`}
      >
        <svg
          width="88"
          height="88"
          viewBox="0 0 88 88"
          aria-hidden="true"
        >
          {/* Track ring */}
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={theme === "light" ? "#dddcd9" : "#222221"}
            strokeWidth={stroke}
          />
          {/* Progress arc */}
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            transform="rotate(-90 44 44)"
            style={{ transition: "stroke-dasharray 0.6s ease, stroke 0.4s ease" }}
          />
          {/* Score label */}
          <text
            x="44"
            y="41"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="'Fira Code', monospace"
            fontSize="18"
            fontWeight="600"
            fill={color}
          >
            {score}
          </text>
          {/* "/100" sub-label */}
          <text
            x="44"
            y="55"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="'Fira Code', monospace"
            fontSize="9"
            fill={theme === "light" ? "#8a8987" : "#63635e"}
          >
            /100
          </text>
        </svg>
        <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          Health
        </span>
      </button>

      {showBreakdown && (
        <div className="w-full rounded border border-bg-elevated bg-bg-secondary px-3 py-2">
          <div className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-text-muted">
            Penalties
          </div>
          <div className="flex flex-col gap-1">
            {penaltyRows.map(({ label, value, color: penColor }) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: penColor }}
                />
                <span className="flex-1 font-mono text-[10px] text-text-secondary">
                  {label}
                </span>
                <span
                  className="font-mono text-[10px]"
                  style={{ color: value === 0 ? "#63635e" : penColor }}
                >
                  {value === 0 ? "—" : `-${value}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
