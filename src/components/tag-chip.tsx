"use client";

type TagChipProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
};

export function TagChip({ label, active = false, onClick }: TagChipProps) {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors";
  const styles = active
    ? "border-accent bg-accent-muted text-accent"
    : "border-border bg-surface text-muted hover:border-foreground/20 hover:text-foreground";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} ${styles}`}>
        {label}
      </button>
    );
  }

  return <span className={`${base} ${styles}`}>{label}</span>;
}
