import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Choose a new password — Leadlify" },
      { name: "description", content: "Set a new password for your Leadlify workspace account." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Choose a new password — Leadlify" },
      {
        property: "og:description",
        content: "Set a new password for your Leadlify workspace account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    supabase.auth.getSession().then(({ data }) => {
      if (data.session || isRecovery) {
        setReady(true);
      } else {
        toast.error("This reset link is invalid or has expired.");
        navigate({ to: "/auth", replace: true });
      }
    });
  }, [navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords do not match.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/dashboard", replace: true });
  };

  if (!ready) {
    return (
      <div className="bg-gradient-surface grid min-h-screen place-items-center">
        <Loader2 className="text-primary size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-surface flex min-h-screen items-center justify-center px-4 py-12">
      <form
        onSubmit={submit}
        className="bg-card shadow-elevated border-border/60 animate-fade-up w-full max-w-md space-y-4 rounded-2xl border p-6"
      >
        <div className="mb-2 text-center">
          <span className="bg-primary/10 text-primary mx-auto grid size-12 place-items-center rounded-2xl">
            <KeyRound className="size-5" />
          </span>
          <h1 className="text-foreground mt-4 text-xl font-semibold">Choose a new password</h1>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Update password
        </Button>
      </form>
    </div>
  );
}
