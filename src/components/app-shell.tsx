import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Gift,
  ShieldCheck,

  LayoutDashboard,
  LogOut,
  Menu,
  Radar,
  ReceiptText,
  Settings,
  Sparkles,
  Users,
  Send,
  Megaphone,
  Ban,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";


import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { isAdminQuery } from "@/lib/queries";
import { pendingRemindersQuery } from "@/lib/reminders";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/find-leads", label: "Find Leads", icon: Radar },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/outreach", label: "Outreach", icon: Send },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/plans", label: "Plans", icon: ReceiptText },
  { to: "/referrals", label: "Referrals", icon: Gift },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;


const ADMIN_ITEM = { to: "/admin", label: "Admin", icon: ShieldCheck } as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const admin = useQuery(isAdminQuery);
  const items = admin.data ? [...NAV, ADMIN_ITEM] : [...NAV];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-card"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span className="bg-gradient-brand grid size-9 place-items-center rounded-xl shadow-glow">
        <Sparkles className="text-primary-foreground size-4.5" />
      </span>
      <div className="leading-tight">
        <p className="text-sidebar-foreground text-sm font-semibold">Leadlify</p>
        <p className="text-muted-foreground text-[11px]">Cold outreach CRM</p>
      </div>
    </div>
  );
}

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="bg-background flex min-h-screen">
      <aside className="bg-sidebar border-sidebar-border hidden w-64 shrink-0 flex-col justify-between border-r p-4 lg:flex">
        <div className="space-y-6">
          <Brand />
          <NavLinks />
        </div>
        <Button variant="ghost" className="justify-start gap-3" onClick={signOut}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border/70 bg-background/85 sticky top-0 z-30 border-b backdrop-blur-lg">
          <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-sidebar w-64 p-4">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="space-y-6">
                  <Brand />
                  <NavLinks onNavigate={() => setOpen(false)} />
                  <Button variant="ghost" className="w-full justify-start gap-3" onClick={signOut}>
                    <LogOut className="size-4" />
                    Sign out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <h1 className="text-foreground truncate text-lg font-semibold tracking-tight">
                {title}
              </h1>
              {description ? (
                <p className="text-muted-foreground truncate text-xs">{description}</p>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {actions}
              <ReminderBell />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <AnnouncementBanner />
        <main className="animate-fade-up mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <SuspensionGate>{children}</SuspensionGate>
        </main>
      </div>
    </div>
  );
}

function ReminderBell() {
  const { data } = useQuery(pendingRemindersQuery);
  const due = (data ?? []).filter((r) => new Date(r.remind_at).getTime() <= Date.now()).length;
  return (
    <Button asChild variant="ghost" size="icon" className="relative rounded-full">
      <Link to="/reminders" aria-label={due ? `${due} reminders due` : "Reminders"}>
        <Bell className="size-4" />
        {due ? <span className="bg-destructive absolute top-1.5 right-1.5 size-2 rounded-full" /> : null}
      </Link>
    </Button>
  );
}

function AnnouncementBanner() {
  const { data } = useQuery({
    queryKey: ["announcements", "active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id, message")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1);
      return data ?? [];
    },
    staleTime: 60_000,
  });
  const item = data?.[0];
  if (!item) return null;
  return (
    <div className="bg-primary text-primary-foreground flex items-center gap-2 px-4 py-2 text-sm sm:px-6">
      <Megaphone className="size-4 shrink-0" />
      <span className="min-w-0">{item.message}</span>
    </div>
  );
}

function SuspensionGate({ children }: { children: ReactNode }) {
  const { data } = useQuery({
    queryKey: ["profile", "suspended"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return false;
      const { data } = await supabase.from("profiles").select("suspended").eq("id", auth.user.id).maybeSingle();
      return data?.suspended === true;
    },
  });
  if (data) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <Ban className="text-destructive mx-auto mb-4 size-8" />
        <h2 className="text-lg font-semibold">Account suspended</h2>
        <p className="text-muted-foreground mt-2 text-sm">Your account has been suspended. Please contact support.</p>
      </div>
    );
  }
  return <>{children}</>;
}
