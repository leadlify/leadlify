import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Mail, MailWarning } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { getGmailProfile } from "@/lib/outreach.functions";
import { cn } from "@/lib/utils";

/** Small header pill showing whether this user's Gmail account is connected. */
export function GmailStatus({ className }: { className?: string }) {
  const profileFn = useServerFn(getGmailProfile);
  const gmail = useQuery({
    queryKey: ["gmail-profile"],
    queryFn: () => profileFn({}),
    staleTime: 60_000,
  });

  if (gmail.isLoading) return <Skeleton className="h-7 w-28 rounded-full" />;

  const connected = gmail.data?.connected === true;

  return (
    <Link
      to="/settings"
      title={connected ? `Gmail connected: ${gmail.data?.email}` : "Connect your Gmail account"}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        connected
          ? "border-accent/40 bg-accent/10 text-accent hover:bg-accent/20"
          : "border-warning/40 bg-warning/10 text-warning hover:bg-warning/20",
        className,
      )}
    >
      {connected ? <Mail className="size-3.5" /> : <MailWarning className="size-3.5" />}
      <span className="hidden max-w-[160px] truncate sm:inline">
        {connected ? (gmail.data?.email ?? "Gmail connected") : "Gmail not connected"}
      </span>
      <span className="sm:hidden">{connected ? "Gmail" : "No Gmail"}</span>
    </Link>
  );
}
