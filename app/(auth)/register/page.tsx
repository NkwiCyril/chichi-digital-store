'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Status = { type: "success" | "error"; message: string } | null;

export default function RegisterPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [isPending, startTransition] = useTransition();

  const nextPath = searchParams.get("next") ?? "/";

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const url = new URL("/auth/callback", window.location.origin);
    if (nextPath) {
      url.searchParams.set("next", nextPath);
    }
    return url.toString();
  }, [nextPath]);

  useEffect(() => {
    const errorMessage = searchParams.get("message");
    if (errorMessage && status?.message !== errorMessage) {
      setStatus({ type: "error", message: errorMessage });
    }
  }, [searchParams, status]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!acceptedTerms) {
      setStatus({ type: "error", message: "Please agree to the terms to continue." });
      return;
    }

    startTransition(async () => {
      setStatus(null);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
        },
      });

      if (error) {
        setStatus({ type: "error", message: error.message });
        return;
      }

      setStatus({
        type: "success",
        message: "Account created! Check your email to confirm and continue.",
      });
      router.push(nextPath);
      router.refresh();
    });
  };

  const handleGoogleSignUp = () => {
    startTransition(async () => {
      setStatus(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl ?? undefined,
        },
      });

      if (error) {
        setStatus({ type: "error", message: error.message });
      } else {
        setStatus({ type: "success", message: "Redirecting you to Google..." });
      }
    });
  };

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md space-y-10">
          <header className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-violet-600">
              Start selling
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-zinc-900">Create your Chichi account</h1>
              <p className="text-sm text-zinc-500">
                Launch your digital storefront in minutes with built-in Supabase authentication.
              </p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-zinc-700">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500"
                  placeholder="Abeni Adeola"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-zinc-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-zinc-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500"
                  placeholder="Create a strong password"
                />
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
                <div className="flex items-start gap-3">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border border-zinc-300 text-violet-600 focus:ring-violet-400"
                  />
                  <label htmlFor="terms" className="text-xs leading-relaxed text-zinc-500">
                    I agree to the{" "}
                    <Link href="#" className="font-medium text-violet-600 hover:text-violet-700">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="#" className="font-medium text-violet-600 hover:text-violet-700">
                      Privacy Policy
                    </Link>
                    .
                  </label>
                </div>
              </div>
            </div>

            {status && (
              <div
                role="alert"
                className={
                  "rounded-xl border px-4 py-3 text-sm " +
                  (status.type === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-600"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700")
                }
              >
                {status.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full inline-flex justify-center items-center cursor-pointer gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 shadow-lg shadow-violet-200/60 transition-colors"
            >
              {isPending ? "Creating account..." : "Create account"}
            </button>

            <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-zinc-400">
              <span className="h-px flex-1 bg-zinc-200" />
              <span>or</span>
              <span className="h-px flex-1 bg-zinc-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isPending}
              className="w-full inline-flex justify-center items-center cursor-pointer gap-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-sm font-semibold text-zinc-700 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" viewBox="0 0 533.5 544.3">
                <path fill="#4285f4" d="M533.5 278.4c0-17.4-1.5-34-4.3-50.2H272.1v95h146.9c-6.3 34.1-25.3 62.9-54.1 82.2l87.3 67.7c50.9-46.9 81.3-116 81.3-194.7z" />
                <path fill="#34a853" d="M272.1 544.3c73.5 0 135.2-24.3 180.2-66.1l-87.3-67.7c-24.3 16.3-55.4 25.8-92.9 25.8-71.5 0-132.1-48.2-153.8-113.1l-90.6 70.1c41.5 82.6 127 151 244.4 151z" />
                <path fill="#fbbc04" d="M118.3 323.2c-10.8-32.2-10.8-66.9 0-99.1l-90.6-70.1c-39.7 79.2-39.7 170.1 0 249.3z" />
                <path fill="#ea4335" d="M272.1 107.7c39.9-.6 77.3 13.6 106.4 39.8l79.3-79.3C405.6 24.7 344-0.5 272.1 0 154.7 0 69.2 68.4 27.7 151l90.6 70.1c21.8-64.9 82.4-113.4 153.8-113.4z" />
              </svg>
              {isPending ? "Please wait..." : "Sign up with Google"}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link
              href={{ pathname: "/login", query: { next: nextPath } }}
              className="font-semibold text-violet-600 hover:text-violet-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden lg:block">
        <div className="absolute inset-0 bg-linear-to-br from-violet-500 via-violet-600 to-indigo-700" />
        <Image
          src="/images/register-side-image.jpg"
          alt="Floating globe illustration"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-xs tracking-[0.3em] uppercase">
              Creator-first
            </span>
            <h2 className="mt-6 text-3xl font-semibold leading-tight">
              Launch products, automate delivery, and welcome new customers every day.
            </h2>
          </div>
          <p className="text-sm text-white/70">
            Chichi handles checkout, analytics, and fulfilment so you can stay focused on building experiences your audience loves.
          </p>
        </div>
      </div>
    </div>
  );
}
