import { Link } from "@tanstack/react-router";
import { Instagram, Menu, MessageCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="border-public-border bg-public/85 sticky top-0 z-50 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-5 sm:px-8">
        <Link to="/" className="text-public-foreground flex items-center gap-2.5 font-heading text-sm font-semibold">
          <span className="border-public-border bg-public-raised grid size-8 place-items-center rounded-md border">
            <Sparkles className="size-4" />
          </span>
          Leadlify
        </Link>
        <nav className="text-public-muted ml-10 hidden items-center gap-7 text-sm md:flex" aria-label="Main navigation">
          <a href="/#features" className="hover:text-public-foreground transition-colors">Features</a>
          <a href="/#how" className="hover:text-public-foreground transition-colors">How it works</a>
          <a href="/#pricing" className="hover:text-public-foreground transition-colors">Pricing</a>
          <a href="/#faq" className="hover:text-public-foreground transition-colors">FAQ</a>
          <Link to="/about" className="hover:text-public-foreground transition-colors">About</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="text-public-muted hover:bg-public-raised hover:text-public-foreground hidden sm:inline-flex">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="bg-public-foreground text-public hover:bg-public-foreground/90">
            <Link to="/auth" search={{ mode: "signup" }}>Start free</Link>
          </Button>
          <Button variant="ghost" size="icon" className="text-public-muted hover:bg-public-raised hover:text-public-foreground md:hidden" aria-label="Open navigation">
            <Menu className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-public-border border-t">
      <div className="text-public-muted mx-auto grid max-w-7xl gap-8 px-5 py-10 text-sm sm:px-8 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-public-foreground font-heading font-semibold">Leadlify</p>
          <p className="mt-2 max-w-md">Find businesses worth pitching. Turn real opportunities into thoughtful outreach.</p>
          <p className="mt-6 text-xs">© {new Date().getFullYear()} Leadlify. All rights reserved.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-10 gap-y-3">
          <Link to="/about" className="hover:text-public-foreground transition-colors">About us</Link>
          <Link to="/privacy" className="hover:text-public-foreground transition-colors">Privacy</Link>
          <a href="https://www.instagram.com/leadlify.ai/" target="_blank" rel="noopener noreferrer" className="hover:text-public-foreground inline-flex items-center gap-2 transition-colors"><Instagram className="size-4" /> Instagram</a>
          <a href="https://wa.link/cuj4t2" target="_blank" rel="noopener noreferrer" className="hover:text-public-foreground inline-flex items-center gap-2 transition-colors"><MessageCircle className="size-4" /> Support</a>
        </div>
      </div>
    </footer>
  );
}