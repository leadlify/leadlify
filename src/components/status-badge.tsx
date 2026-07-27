import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "replied",
  "interested",
  "closed",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  replied: "Replied",
  interested: "Interested",
  closed: "Closed",
  lost: "Lost",
};

const STATUS_CLASS: Record<LeadStatus, string> = {
  new: "bg-muted text-muted-foreground border-border",
  contacted: "bg-primary/10 text-primary border-primary/20",
  replied: "bg-secondary/15 text-secondary border-secondary/25",
  interested: "bg-warning/15 text-warning border-warning/25",
  closed: "bg-accent/15 text-accent border-accent/25",
  lost: "bg-destructive/10 text-destructive border-destructive/20",
};

export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2.5 py-0.5 font-medium", STATUS_CLASS[status], className)}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}
