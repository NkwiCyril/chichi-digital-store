"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import type {
  CourseWithCurriculum,
  CourseLevel,
  SectionWithLessons,
} from "@/lib/db/courses";
import { COURSE_LEVELS, formatDuration, formatXAF } from "@/lib/db/courses";
import CurriculumBuilder from "./CurriculumBuilder";

type Tab = "details" | "curriculum" | "pricing";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "en,fr", label: "English & French" },
];

export default function CourseEditor({
  course: initial,
}: {
  course: CourseWithCurriculum;
}) {
  const router = useRouter();
  const [course, setCourse] = useState(initial);
  const [tab, setTab] = useState<Tab>("details");
  const [saving, startSaving] = useTransition();
  const [publishing, startPublishing] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: course.title,
    slug: course.slug,
    summary: course.summary,
    description: course.description,
    cover_url: course.cover_url,
    price_xaf: course.price_xaf,
    level: course.level,
    language: course.language,
  });

  const update = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const saveDetails = () => {
    setError(null);
    setSuccess(null);
    startSaving(async () => {
      const res = await fetch(`/api/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save.");
        return;
      }
      const updated = await res.json();
      setCourse((c) => ({ ...c, ...updated }));
      setSuccess("Changes saved.");
      setTimeout(() => setSuccess(null), 3000);
    });
  };

  const handlePublish = () => {
    setError(null);
    startPublishing(async () => {
      const action = course.status === "published" ? "unpublish" : "publish";
      const res = await fetch(`/api/courses/${course.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to update status.");
        return;
      }
      setCourse((c) => ({ ...c, status: data.status, published_at: data.published_at }));
      router.refresh();
    });
  };

  const onCurriculumChange = useCallback(
    (sections: SectionWithLessons[]) => {
      const lessonCount = sections.reduce((sum, s) => sum + s.lessons.length, 0);
      const totalDuration = sections
        .flatMap((s) => s.lessons)
        .reduce((sum, l) => sum + (l.duration_sec || 0), 0);
      setCourse((c) => ({
        ...c,
        sections,
        lesson_count: lessonCount,
        total_duration_sec: totalDuration,
      }));
    },
    []
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "details", label: "Details" },
    { key: "curriculum", label: "Curriculum" },
    { key: "pricing", label: "Pricing" },
  ];

  const readyLessons = course.sections
    .flatMap((s) => s.lessons)
    .filter((l) => l.status === "ready").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/dashboard/creator/courses"
            className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Courses
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 truncate">
            {course.title || "Untitled course"}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <span
              className={`rounded-full px-2.5 py-1 font-semibold ${
                course.status === "published"
                  ? "bg-emerald-50 text-emerald-700"
                  : course.status === "archived"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {course.status === "published" ? "Published" : course.status === "archived" ? "Archived" : "Draft"}
            </span>
            <span>{course.lesson_count} lessons</span>
            {course.total_duration_sec > 0 && <span>{formatDuration(course.total_duration_sec)}</span>}
            {readyLessons > 0 && <span>{readyLessons} ready</span>}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className={`inline-flex cursor-pointer items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
              course.status === "published"
                ? "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200/60"
            }`}
          >
            {publishing
              ? "Updating..."
              : course.status === "published"
              ? "Unpublish"
              : "Publish"}
          </button>
        </div>
      </header>

      {/* Alerts */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 cursor-pointer rounded-lg py-2 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "bg-white text-violet-700 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Details tab */}
      {tab === "details" && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-5">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-zinc-700">Title</label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => update({ title: e.target.value })}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500"
              placeholder="Course title"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="slug" className="text-sm font-medium text-zinc-700">URL slug</label>
            <input
              id="slug"
              type="text"
              value={form.slug}
              onChange={(e) => update({ slug: e.target.value })}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500"
              placeholder="course-slug"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="summary" className="text-sm font-medium text-zinc-700">Summary</label>
            <input
              id="summary"
              type="text"
              value={form.summary}
              onChange={(e) => update({ summary: e.target.value })}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500"
              placeholder="A short one-liner about the course"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-zinc-700">Description</label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              rows={5}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500 resize-none"
              placeholder="Detailed course description..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="cover_url" className="text-sm font-medium text-zinc-700">Cover image URL</label>
            <input
              id="cover_url"
              type="text"
              value={form.cover_url}
              onChange={(e) => update({ cover_url: e.target.value })}
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500"
              placeholder="https://..."
            />
            {form.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.cover_url} alt="Cover preview" className="mt-2 h-32 w-auto rounded-lg object-cover" />
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="level" className="text-sm font-medium text-zinc-700">Level</label>
              <select
                id="level"
                value={form.level}
                onChange={(e) => update({ level: e.target.value as CourseLevel })}
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500 bg-white cursor-pointer"
              >
                {COURSE_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="language" className="text-sm font-medium text-zinc-700">Language</label>
              <select
                id="language"
                value={form.language}
                onChange={(e) => update({ language: e.target.value })}
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500 bg-white cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={saveDetails}
              disabled={saving}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200/60 transition-colors hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      )}

      {/* Curriculum tab */}
      {tab === "curriculum" && (
        <CurriculumBuilder
          courseId={course.id}
          sections={course.sections}
          onChange={onCurriculumChange}
        />
      )}

      {/* Pricing tab */}
      {tab === "pricing" && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-5">
          <div className="space-y-2">
            <label htmlFor="price" className="text-sm font-medium text-zinc-700">
              Price (XAF)
            </label>
            <div className="flex items-stretch rounded-xl border border-zinc-200 focus-within:ring-2 focus-within:ring-violet-200 focus-within:border-violet-500 overflow-hidden">
              <span className="flex items-center bg-zinc-50 px-3 text-sm text-zinc-400 border-r border-zinc-200">
                XAF
              </span>
              <input
                id="price"
                type="number"
                min={0}
                step={500}
                value={form.price_xaf}
                onChange={(e) => update({ price_xaf: parseInt(e.target.value) || 0 })}
                className="flex-1 px-3 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                placeholder="25000"
              />
            </div>
            <p className="text-xs text-zinc-400">
              Set to 0 for a free course. Current: {formatXAF(form.price_xaf)}
            </p>
          </div>

          <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
            A 10% commission applies to each sale. You receive{" "}
            <strong>{formatXAF(Math.round(form.price_xaf * 0.9))}</strong> per sale.
          </div>

          <button
            type="button"
            onClick={saveDetails}
            disabled={saving}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200/60 transition-colors hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save price"}
          </button>
        </div>
      )}
    </div>
  );
}
