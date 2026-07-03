"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function NewCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!title.trim()) {
      setError("Please enter a course title.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to create course.");
        return;
      }

      const course = await res.json();
      router.push(`/dashboard/creator/courses/${course.id}`);
    });
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <p className="text-sm text-zinc-500">Courses</p>
        <h1 className="text-2xl font-bold text-zinc-900">Create a new course</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Give your course a working title. You can change everything later.
        </p>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium text-zinc-700">
            Course title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Package Design Masterclass"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500"
          />
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200/60 transition-colors hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Creating..." : "Create course"}
          </button>
        </div>
      </div>
    </div>
  );
}
