import { Project } from "@/lib/store/types";

const labels: Record<Project["status"], string> = {
  shipped: "Shipped",
  prototype: "Prototype",
  experiment: "Experiment",
};

const styles: Record<Project["status"], string> = {
  shipped: "border-accent/30 bg-accent-muted text-accent",
  prototype: "border-border bg-surface text-muted",
  experiment: "border-border bg-surface text-muted",
};

export function StatusBadge({ status }: { status: Project["status"] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
