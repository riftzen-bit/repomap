interface BadgeProps {
  label: string;
  color?: string;
  variant?: "solid" | "outline";
}

export function Badge({ label, color = "#7a7a8e", variant = "solid" }: BadgeProps) {
  const isSolid = variant === "solid";

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-medium leading-none"
      style={{
        backgroundColor: isSolid ? color + "20" : "transparent",
        color,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: isSolid ? "transparent" : color + "60",
      }}
    >
      {label}
    </span>
  );
}
