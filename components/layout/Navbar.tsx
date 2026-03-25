"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Menu, Bot } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import MobileNav from "./MobileNav";
import { TutorAgentPanel } from "@/components/chat/TutorAgentPanel";
import { useChatStore } from "@/stores/chatStore";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/study", label: "Study" },
  { href: "/web", label: "Web" },
  { href: "/review", label: "Review" },
  { href: "/translate", label: "Translate" },
];

function getDateline() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return `Vol. ${now.getFullYear() - 2000} · No. ${dayOfYear}`;
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isOpen: tutorOpen, toggle: toggleTutor } = useChatStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]">
      <div className="flex items-center justify-between px-6 h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="text-lg">🕷</span>
          <span
            className="font-black text-lg tracking-tight text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            CO-SYNAPSE
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-[var(--text-primary)]",
                pathname?.startsWith(href)
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)]"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={toggleTutor}
            className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors"
            style={{
              color: tutorOpen ? "var(--accent-primary)" : "var(--text-secondary)",
              background: tutorOpen ? "rgba(212,168,67,0.1)" : "transparent",
            }}
            aria-label="Toggle tutor panel"
          >
            <Bot size={15} />
            <span className="newspaper-label text-[10px]">TUTOR</span>
          </button>
          <Link href="/settings" className="hidden md:flex items-center">
            <Settings
              size={16}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            />
          </Link>
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1"
            style={{ color: "var(--text-secondary)" }}
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <TutorAgentPanel />

      {/* Dateline */}
      <div className="px-6 pb-1">
        <span className="newspaper-label text-[10px]">{getDateline()}</span>
      </div>
      <div className="newspaper-rule" />
    </header>
  );
}
