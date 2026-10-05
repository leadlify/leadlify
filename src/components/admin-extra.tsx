import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { errorMessage } from "@/lib/queries";

type Profile = Tables<"profiles">;
type Lead = { id: string; user_id: string; business_name: string; business_category: string | null; country: string | null; created_at: string };

const announcementSchema = z.string().trim().min(3).max(300);

export function AdminExtra({ profiles, leads }: { profiles: Profile[]; leads: Lead[] }) {
  const qc = useQueryClient();
  const roles = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const outreach = useQuery({
    queryKey: ["admin", "outreach"],
    queryFn: async () => {
      const { data, error } = await supabase.from("outreach").select("channel, status").limit(10000);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const announcements = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(20);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const admins = new Set((roles.data ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });
  const onErr = (e: unknown) => toast.error(errorMessage(e));

  const suspend = useMutation({
    mutationFn: async ({ id, suspended }: { id: string; suspended: boolean }) => {
      const { error } = await supabase.from("profiles").update({ suspended }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: refresh,
    onError: onErr,
  });
  const role = useMutation({
    mutationFn: async ({ id, makeAdmin }: { id: string; makeAdmin: boolean }) => {
      const { error } = makeAdmin
        ? await supabase.from("user_roles").insert({ user_id: id, role: "admin" })
        : await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "admin");
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { toast.success("Role updated"); refresh(); },
    onError: onErr,
  });
  const delLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { toast.success("Lead deleted"); refresh(); },
    onError: onErr,
  });
  const [msg, setMsg] = useState("");
  const announce = useMutation({
    mutationFn: async () => {
      const message = announcementSchema.parse(msg);
      await supabase.from("announcements").update({ active: false }).eq("active", true);
      const { error } = await supabase.from("announcements").insert({ message });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { setMsg(""); toast.success("Announcement published"); refresh(); qc.invalidateQueries({ queryKey: ["announcements"] }); },
    onError: onErr,
  });
  const toggleAnn = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("announcements").update({ active }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { refresh(); qc.invalidateQueries({ queryKey: ["announcements"] }); },
    onError: onErr,
  });

  const [search, setSearch] = useState("");
  const [fType, setFType] = useState("");
  const [fCountry, setFCountry] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const inRange = (d: string) => (!from || d.slice(0, 10) >= from) && (!to || d.slice(0, 10) <= to);

  const now = Date.now();
  const signups = (days: number) => profiles.filter((p) => now - new Date(p.created_at).getTime() < days * 864e5).length;
  const o = outreach.data ?? [];
  const sentCount = (ch?: string) => o.filter((r) => r.status !== "pending" && (!ch || r.channel === ch)).length;

  const filteredLeads = leads.filter(
    (l) =>
      (!fType || (l.business_category ?? "").toLowerCase().includes(fType.toLowerCase())) &&
      (!fCountry || (l.country ?? "").toLowerCase().includes(fCountry.toLowerCase())) &&
      inRange(l.created_at),
  );
  const top = (key: "business_category" | "country") => {
    const m = new Map<string, number>();
    for (const l of leads.filter((x) => inRange(x.created_at))) {
      const k = l[key] || "Unknown";
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  };
  const users = useMemo(
    () => profiles.filter((p) => (p.email ?? "").toLowerCase().includes(search.toLowerCase())),
    [profiles, search],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["New signups (7d)", signups(7)],
          ["New signups (30d)", signups(30)],
          ["Total leads", leads.length],
          ["Messages sent", `${sentCount()} (WA ${sentCount("whatsapp")} · Email ${sentCount("email")})`],
          ["Replies", o.filter((r) => r.status === "replied").length],
        ].map(([l, v]) => (
          <Card key={String(l)}><CardContent className="py-4"><p className="text-muted-foreground text-xs">{l}</p><p className="text-xl font-semibold">{v}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">User management</CardTitle><CardDescription>Suspend accounts and change roles.</CardDescription></CardHeader>
        <CardContent className="space-y-3 overflow-x-auto">
          <Input placeholder="Search by email" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          <Table>
            <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Signed up</TableHead><TableHead className="text-right">Leads</TableHead><TableHead>Status</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {users.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.email}</TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">{leads.filter((l) => l.user_id === p.id).length}</TableCell>
                  <TableCell>{p.suspended ? <Badge variant="destructive">Suspended</Badge> : <Badge variant="secondary">Active</Badge>}</TableCell>
                  <TableCell>{admins.has(p.id) ? "Admin" : "User"}</TableCell>
                  <TableCell className="space-x-2 text-right whitespace-nowrap">
                    <Button size="sm" variant="outline" onClick={() => suspend.mutate({ id: p.id, suspended: !p.suspended })}>{p.suspended ? "Unsuspend" : "Suspend"}</Button>
                    <Button size="sm" variant="outline" onClick={() => role.mutate({ id: p.id, makeAdmin: !admins.has(p.id) })}>{admins.has(p.id) ? "Remove admin" : "Make admin"}</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Leads, content & reports</CardTitle><CardDescription>Filter all leads and see top business types and countries.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-4">
            <Input placeholder="Business type" value={fType} onChange={(e) => setFType(e.target.value)} />
            <Input placeholder="Country" value={fCountry} onChange={(e) => setFCountry(e.target.value)} />
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {(["business_category", "country"] as const).map((k) => (
              <div key={k}>
                <p className="mb-2 text-sm font-medium">{k === "country" ? "Top countries" : "Top business types"}</p>
                {top(k).map(([name, n]) => (
                  <div key={name} className="flex justify-between border-b py-1 text-sm"><span>{name}</span><span className="tabular-nums">{n}</span></div>
                ))}
              </div>
            ))}
          </div>
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Business</TableHead><TableHead>Type</TableHead><TableHead>Country</TableHead><TableHead>Owner</TableHead><TableHead>Date</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {filteredLeads.slice(0, 200).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.business_name}</TableCell>
                    <TableCell>{l.business_category ?? "—"}</TableCell>
                    <TableCell>{l.country ?? "—"}</TableCell>
                    <TableCell>{profiles.find((p) => p.id === l.user_id)?.email ?? "—"}</TableCell>
                    <TableCell>{new Date(l.created_at).toLocaleDateString()}</TableCell>
                    <TableCell><Button size="icon" variant="ghost" aria-label="Delete lead" onClick={() => confirm("Delete this lead?") && delLead.mutate(l.id)}><Trash2 className="size-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Announcements</CardTitle><CardDescription>Shown as a banner to every signed-in user.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={msg} onChange={(e) => setMsg(e.target.value.slice(0, 300))} placeholder="Write an announcement…" />
            <Button onClick={() => announce.mutate()} disabled={announce.isPending}>Publish</Button>
            {(announcements.data ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 border-b py-2 text-sm">
                <span className="min-w-0">{a.message}</span>
                <Button size="sm" variant="ghost" onClick={() => toggleAnn.mutate({ id: a.id, active: !a.active })}>{a.active ? "Hide" : "Show"}</Button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Admins</CardTitle><CardDescription>Use “Make admin” above to add more.</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {profiles.filter((p) => admins.has(p.id)).map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b py-2 text-sm">
                <span>{p.email}</span>
                <Button size="sm" variant="ghost" onClick={() => role.mutate({ id: p.id, makeAdmin: false })}>Remove</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
