import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Lock, Mail, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — LeadForge" },
      { name: "description", content: "Private sign-in for the LeadForge outreach workspace." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Sign in — LeadForge" },
      { property: "og:description", content: "Private sign-in for the LeadForge outreach workspace." },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(255),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);

    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "That email and password combination is not recognised."
          : error.message,
      );
      return;
    }
    toast.success("Welcome back");
    navigate({ to: "/dashboard", replace: true });
  };

  const sendReset = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) {
      toast.error("Enter a valid email address.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("If that account exists, a reset link is on its way.");
    setMode("login");
  };

  return (
    <div className="bg-gradient-surface relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="animate-fade-up w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="bg-gradient-brand mx-auto grid size-14 place-items-center rounded-2xl shadow-glow">
            <Sparkles className="text-primary-foreground size-6" />
          </span>
          <h1 className="text-foreground mt-5 text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Sign in to LeadForge" : "Reset your password"}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {mode === "login"
              ? "This workspace is private. Accounts are created manually."
              : "We'll email you a secure link to choose a new password."}
          </p>
        </div>

        <form
          onSubmit={mode === "login" ? signIn : sendReset}
          className="bg-card shadow-elevated border-border/60 space-y-4 rounded-2xl border p-6"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {mode === "login" ? (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "login" ? "Sign in" : "Send reset link"}
          </Button>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "forgot" : "login")}
            className="text-muted-foreground hover:text-foreground mx-auto flex items-center gap-1.5 text-xs transition-colors"
          >
            {mode === "login" ? (
              "Forgot your password?"
            ) : (
              <>
                <ArrowLeft className="size-3" /> Back to sign in
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
