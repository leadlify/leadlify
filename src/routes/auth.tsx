import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Lock, Mail, Sparkles, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type Mode = "login" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "signup" ? ("signup" as const) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in or sign up — LeadForge" },
      {
        name: "description",
        content: "Create your LeadForge account or sign in to your outreach workspace.",
      },
      { property: "og:title", content: "Sign in or sign up — LeadForge" },
      {
        property: "og:description",
        content: "Create your LeadForge account or sign in to your outreach workspace.",
      },
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
  const search = Route.useSearch();
  const [mode, setMode] = useState<Mode>(search.mode === "signup" ? "signup" : "login");
  const [fullName, setFullName] = useState("");
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

  const signUp = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      ...parsed.data,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName.trim() },
      },
    });
    setBusy(false);

    if (error) {
      toast.error(
        error.message.toLowerCase().includes("already registered")
          ? "That email already has an account. Try signing in."
          : error.message,
      );
      return;
    }

    if (data.session) {
      toast.success("Account created");
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    toast.success("Check your inbox to confirm your email address.");
    setMode("login");
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

  const heading =
    mode === "login"
      ? "Sign in to LeadForge"
      : mode === "signup"
        ? "Create your LeadForge account"
        : "Reset your password";
  const sub =
    mode === "login"
      ? "Welcome back — pick up where you left off."
      : mode === "signup"
        ? "Free to start. No daily sending limits."
        : "We'll email you a secure link to choose a new password.";

  return (
    <div className="bg-gradient-surface relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Link
        to="/"
        className="text-muted-foreground hover:text-foreground absolute top-5 left-4 flex items-center gap-1.5 text-xs transition-colors"
      >
        <ArrowLeft className="size-3.5" /> Back to home
      </Link>

      <div className="animate-fade-up w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="bg-gradient-brand mx-auto grid size-14 place-items-center rounded-2xl shadow-glow">
            <Sparkles className="text-primary-foreground size-6" />
          </span>
          <h1 className="text-foreground mt-5 text-2xl font-semibold tracking-tight">{heading}</h1>
          <p className="text-muted-foreground mt-2 text-sm">{sub}</p>
        </div>

        <form
          onSubmit={mode === "login" ? signIn : mode === "signup" ? signUp : sendReset}
          className="bg-card shadow-elevated border-border/60 space-y-4 rounded-2xl border p-6"
        >
          {mode === "signup" ? (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <div className="relative">
                <User className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  id="fullName"
                  autoComplete="name"
                  placeholder="Your name"
                  className="pl-9"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          ) : null}

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

          {mode !== "forgot" ? (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
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
            {mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </Button>

          <div className="flex flex-col items-center gap-2 pt-1">
            {mode !== "forgot" ? (
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                {mode === "login"
                  ? "New here? Create an account"
                  : "Already have an account? Sign in"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setMode(mode === "forgot" ? "login" : "forgot")}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs transition-colors"
            >
              {mode === "forgot" ? (
                <>
                  <ArrowLeft className="size-3" /> Back to sign in
                </>
              ) : (
                "Forgot your password?"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
