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
import { leadScore, scoreTone } from "@/lib/lead-score";
import { Tag } from "lucide-react";

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
    "website_status",
    "status",
    "created_at",
  ] as const;

  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [
    [...columns, "lead_score"].join(","),
    ...rows.map((row) =>
      [...columns.map((c) => escape(row[c])), escape(leadScore(row))].join(","),
    ),
  ].join("\n");
}

function LeadsPage() {
  const queryClient = useQueryClient();
  const leads = useQuery(leadsQuery);

  const [term, setTerm] = useState("");
  const [status, setStatus] = useState<"all" | LeadStatus>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [sort, setSort] = useState<"score" | "newest" | "name">("score");
  const [tagFilter, setTagFilter] = useState("all");
  const [tagName, setTagName] = useState("");

  const rows = useMemo(() => {
    const needle = term.trim().toLowerCase();
    const filtered = (leads.data ?? []).filter((lead) => {
      const matchesStatus = status === "all" || lead.status === status;
      const matchesTerm =
        !needle ||
        [lead.business_name, lead.city, lead.email, lead.website, lead.business_category]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(needle));
      const tags = (lead as Lead & { tags?: string[] }).tags ?? [];
      const matchesTag = tagFilter === "all" || tags.includes(tagFilter);
      return matchesStatus && matchesTerm && matchesTag;
    });
    const sorted = [...filtered];
    if (sort === "score") sorted.sort((a, b) => leadScore(b) - leadScore(a));
    else if (sort === "name") sorted.sort((a, b) => a.business_name.localeCompare(b.business_name));
    else sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return sorted;
  }, [leads.data, term, status, sort, tagFilter]);

  const allTags = useMemo(
    () =>
      Array.from(
        new Set((leads.data ?? []).flatMap((l) => (l as Lead & { tags?: string[] }).tags ?? [])),
      ).sort(),
    [leads.data],
  );

  const bulkStatus = useMutation({
    mutationFn: async ({ ids, next }: { ids: string[]; next: LeadStatus }) => {
      const { error } = await supabase.from("leads").update({ status: next }).in("id", ids);
      if (error) throw new Error(error.message);
      return ids.length;
    },
    onSuccess: (n) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`Updated ${n} leads`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const bulkTag = useMutation({
    mutationFn: async ({ ids, tag }: { ids: string[]; tag: string }) => {
      const targets = (leads.data ?? []).filter((l) => ids.includes(l.id));
      for (const l of targets) {
        const current = (l as Lead & { tags?: string[] }).tags ?? [];
        if (current.includes(tag)) continue;
        const { error } = await supabase
          .from("leads")
          .update({ tags: [...current, tag] } as never)
          .eq("id", l.id);
        if (error) throw new Error(error.message);
      }
      return targets.length;
    },
    onSuccess: (n, v) => {
      setTagName("");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`Added ${n} leads to "${v.tag}"`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

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
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger className="sm:w-40" aria-label="Sort leads">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Highest score</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="name">Name A–Z</SelectItem>
              </SelectContent>
            </Select>
            {allTags.length > 0 ? (
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="sm:w-40" aria-label="Filter by list">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All lists</SelectItem>
                  {allTags.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>

          {selected.length > 0 ? (
            <div className="bg-muted/50 border-border mt-3 flex flex-wrap items-center gap-2 rounded-lg border p-2">
              <span className="text-sm font-medium px-1">{selected.length} selected</span>
              <Select
                onValueChange={(v) => bulkStatus.mutate({ ids: selected, next: v as LeadStatus })}
              >
                <SelectTrigger className="h-8 w-40" aria-label="Change status">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <form
                className="flex items-center gap-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  const tag = tagName.trim();
                  if (tag) bulkTag.mutate({ ids: selected, tag });
                }}
              >
                <Input
                  list="lead-tags"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="List name"
                  className="h-8 w-32"
                />
                <datalist id="lead-tags">
                  {allTags.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                <Button type="submit" size="sm" variant="outline" disabled={bulkTag.isPending}>
                  <Tag className="size-4" />
                  Add to list
                </Button>
              </form>
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
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                Clear
              </Button>
            </div>
          ) : null}

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
                    <TableHead className="w-16">Score</TableHead>
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
                      <TableCell>
                        <span
                          className={`inline-flex min-w-9 justify-center rounded-md border px-1.5 py-0.5 text-xs font-semibold tabular-nums ${scoreTone(leadScore(lead))}`}
                          title="Lead score (0-100)"
                        >
                          {leadScore(lead)}
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
