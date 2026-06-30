"use client";

import { ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isCreator, type Role, type UserProfile } from "@/lib/auth/roles";
import { setActiveRole } from "@/lib/db/profile";

interface DashboardShellProps {
  userId: string;
  email: string;
  initialProfile: UserProfile;
  children: ReactNode;
}

const creatorNav = [
  { label: "Overview", href: "/dashboard/creator", icon: "grid" },
  { label: "Products", href: "/dashboard/creator#products", icon: "box" },
  { label: "Sales", href: "/dashboard/creator#sales", icon: "chart" },
  { label: "Settings", href: "/dashboard/settings", icon: "cog" },
] as const;

const memberNav = [
  { label: "Overview", href: "/dashboard/member", icon: "grid" },
  { label: "My Library", href: "/dashboard/member#library", icon: "box" },
  { label: "Settings", href: "/dashboard/settings", icon: "cog" },
] as const;

function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    grid: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zM13.5 6A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />,
    box: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-7.5-4.5-7.5 4.5m15 0l-7.5 4.5m7.5-4.5v9l-7.5 4.5m0-9L4.75 7.5m7.5 4.5v9m-7.5-13.5v9l7.5 4.5" />,
    chart: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />,
    cog: <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />,
  };
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      {paths[name]}
      {name === "cog" && (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      )}
    </svg>
  );
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

export default function DashboardShell({
  userId,
  email,
  initialProfile,
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [profile] = useState(initialProfile);
  const [switching, setSwitching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = profile.activeRole === "creator" ? creatorNav : memberNav;
  const canSwitch = isCreator(profile);

  const switchRole = async (role: Role) => {
    if (role === profile.activeRole) return;
    setSwitching(true);
    await setActiveRole(supabase, userId, role);
    setSwitching(false);
    router.push(role === "creator" ? "/dashboard/creator" : "/dashboard/member");
    router.refresh();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-zinc-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-zinc-100 px-6">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1L15 4.5V11.5L8 15L1 11.5V4.5L8 1Z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-zinc-900 tracking-tight">Chichi</span>
        </div>

        {/* Role switcher */}
        <div className="px-4 py-4">
          {canSwitch ? (
            <div className="flex rounded-xl bg-zinc-100 p-1">
              {(["creator", "member"] as const).map((key) => {
                const role: Role = key === "member" ? "buyer" : "creator";
                const active = profile.activeRole === role;
                return (
                  <button
                    key={key}
                    onClick={() => switchRole(role)}
                    disabled={switching}
                    className={`flex-1 cursor-pointer rounded-lg py-1.5 text-xs font-semibold capitalize transition-colors ${
                      active ? "bg-white text-violet-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ) : (
            <Link
              href="/dashboard/settings"
              className="block rounded-xl border border-dashed border-violet-300 bg-violet-50 px-3 py-2.5 text-center text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
            >
              + Become a creator
            </Link>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active = pathname === item.href.split("#")[0];
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-violet-50 text-violet-700"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-100 p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-full bg-linear-to-br from-violet-400 to-purple-600 flex items-center justify-center shrink-0">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-white">
                  {initialsOf(profile.displayName) || "?"}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-900">
                {profile.displayName || "Member"}
              </p>
              <p className="truncate text-xs text-zinc-400">{email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="mt-3 w-full cursor-pointer rounded-lg border border-zinc-200 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1L15 4.5V11.5L8 15L1 11.5V4.5L8 1Z" />
            </svg>
          </div>
          <span className="font-semibold text-zinc-900">Chichi</span>
        </div>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100"
          aria-label="Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
          {canSwitch && (
            <div className="mb-3 flex rounded-xl bg-zinc-100 p-1">
              {(["creator", "member"] as const).map((key) => {
                const role: Role = key === "member" ? "buyer" : "creator";
                const active = profile.activeRole === role;
                return (
                  <button
                    key={key}
                    onClick={() => switchRole(role)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold capitalize ${
                      active ? "bg-white text-violet-700 shadow-sm" : "text-zinc-500"
                    }`}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          )}
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={signOut}
            className="mt-2 w-full rounded-lg border border-zinc-200 py-2 text-xs font-semibold text-zinc-600"
          >
            Sign out
          </button>
        </div>
      )}

      {/* Content */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
