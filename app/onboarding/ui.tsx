"use client";

import { ReactNode, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { ACCEPTED_AVATAR_TYPES, uploadAvatar } from "@/lib/supabase/storage";
import { BRAND_NAME } from "@/lib/brand";

export function OnboardingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-violet-50 via-white to-indigo-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1L15 4.5V11.5L8 15L1 11.5V4.5L8 1Z" />
          </svg>
        </div>
        <span className="text-lg font-semibold text-zinc-900 tracking-tight">{BRAND_NAME}</span>
      </div>
      {children}
    </div>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl shadow-violet-100/50">
      {children}
    </div>
  );
}

export function ProgressSteps({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
          Step {current} of {total}
        </span>
        <span className="text-xs text-zinc-400">{Math.round((current / total) * 100)}%</span>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < current ? "bg-violet-600" : "bg-zinc-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-zinc-700">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-zinc-400">{hint}</p>}
      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500";

export function TextField({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  prefix,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  prefix?: string;
}) {
  if (prefix) {
    return (
      <div className="flex items-stretch rounded-xl border border-zinc-200 focus-within:ring-2 focus-within:ring-violet-200 focus-within:border-violet-500 overflow-hidden">
        <span className="flex items-center bg-zinc-50 px-3 text-sm text-zinc-400 border-r border-zinc-200">
          {prefix}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
        />
      </div>
    );
  }
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputClass}
    />
  );
}

export function TextArea({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`${inputClass} resize-none`}
    />
  );
}

export function SelectField({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClass} cursor-pointer bg-white`}
    >
      <option value="" disabled>
        Select an option
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function AvatarUploadField({
  supabase,
  userId,
  value,
  onChange,
  displayName,
}: {
  supabase: SupabaseClient;
  userId: string;
  value: string;
  onChange: (v: string) => void;
  displayName: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = (displayName || "")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    const { url, error: uploadError } = await uploadAvatar(supabase, userId, file);
    setUploading(false);
    if (uploadError) {
      setError(uploadError);
      return;
    }
    if (url) onChange(url);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-linear-to-br from-violet-400 to-purple-600 flex items-center justify-center">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Avatar preview" className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-white">{initials || "?"}</span>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>

      <div className="flex-1">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_AVATAR_TYPES.join(",")}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 transition-colors"
          >
            {uploading ? "Uploading..." : value ? "Change photo" : "Upload photo"}
          </button>
          {value && !uploading && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="cursor-pointer text-xs font-medium text-zinc-400 hover:text-rose-600"
            >
              Remove
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-zinc-400">PNG, JPG, WEBP or GIF · up to 2 MB.</p>
        {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
      </div>
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex flex-1 cursor-pointer justify-center items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 px-5 shadow-lg shadow-violet-200/60 transition-colors"
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex cursor-pointer justify-center items-center gap-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-sm font-semibold text-zinc-700 py-3 px-5 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600"
    >
      {message}
    </div>
  );
}
