"use client";

import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/review", label: "Review" },
  { href: "/settings", label: "Settings" },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileNav({ open, onClose }: MobileNavProps) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" style={{ background: "var(--bg-secondary)", borderRight: "1px solid var(--border-default)" }}>
        <SheetHeader>
          <SheetTitle
            style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "var(--accent-primary)" }}
          >
            CO-SYNAPSE
          </SheetTitle>
        </SheetHeader>

        <nav className="mt-8 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--bg-primary)]"
              style={{ color: "var(--text-primary)" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-8 text-xs" style={{ color: "var(--text-tertiary)" }}>
          <p>Vol. I · No. 1</p>
          <p className="italic mt-1">Printed on recycled electrons.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
