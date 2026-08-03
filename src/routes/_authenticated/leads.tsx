import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import {
  LEAD_STATUSES,
  STATUS_LABEL,
  StatusBadge,
  type LeadStatus,
} from "@/components/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage, leadsQuery, type Lead } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({
    meta: [
      { title: "Leads — Leadlify" },
      { name: "description", content: "Search, filter, edit and export your lead pipeline." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Leads — Leadlify" },
      {
        property: "og:description",
        content: "Search, filter, edit and export your lead pipeline.",
      },
    ],
  }),
  component: LeadsPage,
});

function toCsv(rows: Lead[]): string {
  const columns = [
    "business_name",
    "business_category",
    "website",
    "phone",
    "email",
    "address",
    "city",
    "country",
    "google_rating",
    "review_count",
    "seo_score",
    "status",
    "created_at",
  ] as const;

  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [
    columns.join(","),
    ...rows.map((row) => columns.map((c) => escape(row[c])).join(",")),
  ].join("\n");
}

function LeadsPage() {
  const queryClient = useQueryClient();
  const leads = useQuery(leadsQuery);

  const [term, setTerm] = useState("");
  const [status, setStatus] = useState<"all" | LeadStatus>("all");
  const [selected, setSelected] = useState<string[]>([]);

  const rows = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return (leads.data ?? []).filter((lead) => {
      const matchesStatus = status === "all" || lead.status === status;
      const matchesTerm =
        !needle ||
        [lead.business_name, lead.city, lead.email, lead.website, lead.business_category]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(needle));
      return matchesStatus && matchesTerm;
    });
  }, [leads.data, term, status]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: LeadStatus }) => {
      const { error } = await supabase.from("leads").update({ status: next }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Status updated");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data, error } = await supabase.from("leads").delete().in("id", ids).select("id");
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) {
        throw new Error("Those leads could not be deleted — refresh the page and try again.");
      }
      return data.length;
    },
    onSuccess: (count) => {
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`Deleted ${count} lead${count === 1 ? "" : "s"}`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const exportCsv = () => {
    if (rows.length === 0) {
      toast.warning("Nothing to export with the current filters.");
      return;
    }
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leadlify-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} leads`);
  };

  const allSelected = rows.length > 0 && selected.length === rows.length;

  return (
    <AppShell
      title="Leads"
      description={`${rows.length} of ${leads.data?.length ?? 0} leads`}
      actions={
        <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="size-4" />
            <span className="hidden sm:inline">Export CSV</span>
        </Button>
      }
    >
      <Card className="shadow-card border-border/60">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search by name, city, website or email…"
                className="pl-9"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selected.length > 0 ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="size-4" />
                    Delete {selected.length}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {selected.length} leads?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This also removes their email history. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => remove.mutate(selected)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>

          <div className="mt-4 overflow-x-auto">
            {leads.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-foreground text-sm font-medium">No leads match your filters</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Try clearing the search, or{" "}
                  <Link to="/find-leads" className="text-primary hover:underline">
                    run a new search
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) =>
                          setSelected(checked ? rows.map((r) => r.id) : [])
                        }
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead className="hidden md:table-cell">Location</TableHead>
                    <TableHead className="hidden lg:table-cell">Rating</TableHead>
                    <TableHead className="hidden lg:table-cell">Website</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((lead) => (
                    <TableRow key={lead.id} className="group">
                      <TableCell>
                        <Checkbox
                          checked={selected.includes(lead.id)}
                          onCheckedChange={(checked) =>
                            setSelected((prev) =>
                              checked ? [...prev, lead.id] : prev.filter((id) => id !== lead.id),
                            )
                          }
                          aria-label={`Select ${lead.business_name}`}
                        />
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <Link
                          to="/lead/$leadId"
                          params={{ leadId: lead.id }}
                          className="text-foreground hover:text-primary block truncate font-medium transition-colors"
                        >
                          {lead.business_name}
                        </Link>
                        <span className="text-muted-foreground block truncate text-xs">
                          {lead.email ?? lead.phone ?? "No contact details"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                        {[lead.city, lead.country].filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell className="hidden text-sm lg:table-cell">
                        {lead.google_rating ? (
                          <span className="tabular-nums">
                            {lead.google_rating} · {lead.review_count}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="hidden max-w-[180px] lg:table-cell">
                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary block truncate text-sm hover:underline"
                          >
                            {lead.website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(next) =>
                            updateStatus.mutate({ id: lead.id, next: next as LeadStatus })
                          }
                        >
                          <SelectTrigger className="h-8 w-auto border-none bg-transparent p-0 shadow-none focus:ring-0">
                            <StatusBadge status={lead.status as LeadStatus} />
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABEL[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive size-8"
                          onClick={() => remove.mutate([lead.id])}
                          aria-label={`Delete ${lead.business_name}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
