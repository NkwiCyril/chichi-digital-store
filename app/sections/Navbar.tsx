'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { BRAND_NAME } from "@/lib/brand";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface NavUser {
  avatarUrl: string | null;
  displayName: string | null;
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const navLinks = [
  ["Features", "#features"],
  ["Pricing", "#pricing"],
  ["FAQ", "#faq"],
  ["Blog", "#blog"],
] as const;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navUser, setNavUser] = useState<NavUser | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setNavUser(null); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", session.user.id)
        .maybeSingle();

      setNavUser({
        avatarUrl: profile?.avatar_url ?? null,
        displayName: profile?.display_name ?? session.user.email ?? null,
      });
    };

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { loadUser(); });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-zinc-100"
          : "bg-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1L15 4.5V11.5L8 15L1 11.5V4.5L8 1Z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-zinc-900 tracking-tight">
              {BRAND_NAME}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {navUser ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Dashboard
                </Link>
                <Link href="/dashboard" className="h-8 w-8 overflow-hidden rounded-full bg-linear-to-br from-violet-400 to-purple-600 flex items-center justify-center shrink-0">
                  {navUser.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={navUser.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-white">
                      {navUser.displayName ? initialsOf(navUser.displayName) : "?"}
                    </span>
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                  Sign in
                </Link>
                <Link
                  href="/register?role=creator"
                  className="text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Start selling
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden py-3 border-t border-zinc-100 flex flex-col">
            {navLinks.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="py-2.5 px-1 text-sm text-zinc-600 hover:text-zinc-900"
              >
                {label}
              </Link>
            ))}
            <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-col gap-2">
              {navUser ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="text-center text-sm font-medium bg-violet-600 text-white py-2.5 rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="py-2.5 px-1 text-sm text-zinc-600 hover:text-zinc-900">
                    Sign in
                  </Link>
                  <Link
                    href="/register?role=creator"
                    onClick={() => setOpen(false)}
                    className="text-center text-sm font-medium bg-violet-600 text-white py-2.5 rounded-lg hover:bg-violet-700 transition-colors"
                  >
                    Start selling
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
