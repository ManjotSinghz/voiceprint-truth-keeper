import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Home" },
  { to: "/analyze", label: "Analyze" },
  { to: "/history", label: "History" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/settings", label: "Settings" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <span className="text-base font-semibold tracking-tight">VoiceGuard AI</span>
          </Link>
          <nav className="-mx-1 flex items-center gap-1 overflow-x-auto text-sm">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-md px-3 py-1.5 whitespace-nowrap text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        VoiceGuard AI — demo build. Results are indicative, not legal proof.
      </footer>
    </div>
  );
}
