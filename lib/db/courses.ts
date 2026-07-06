import type { SupabaseClient } from "@supabase/supabase-js";

export type CourseStatus = "draft" | "published" | "archived";
export type CourseLevel = "beginner" | "intermediate" | "advanced" | "all_levels";
export type LessonStatus = "processing" | "ready" | "error";

export const COURSE_LEVELS: { value: CourseLevel; label: string }[] = [
  { value: "all_levels", label: "All levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export interface Course {
  id: string;
  store_id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  cover_url: string;
  price_xaf: number;
  level: CourseLevel;
  language: string;
  status: CourseStatus;
  total_duration_sec: number;
  lesson_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  position: number;
}

export interface Lesson {
  id: string;
  section_id: string;
  course_id: string;
  title: string;
  position: number;
  is_preview: boolean;
  video_uid: string | null;
  video_provider: string;
  status: LessonStatus;
  duration_sec: number;
  thumbnail_url: string;
}

export interface SectionWithLessons extends CourseSection {
  lessons: Lesson[];
}

export interface CourseWithCurriculum extends Course {
  sections: SectionWithLessons[];
}

export interface OwnerStore {
  id: string;
  slug: string;
  name: string;
}

const COURSE_COLUMNS =
  "id, store_id, title, slug, summary, description, cover_url, price_xaf, level, language, status, total_duration_sec, lesson_count, published_at, created_at, updated_at";

const LESSON_COLUMNS =
  "id, section_id, course_id, title, position, is_preview, video_uid, video_provider, status, duration_sec, thumbnail_url";

/** The store owned by a user (one per creator in the current model). */
export async function fetchOwnerStore(
  supabase: SupabaseClient,
  userId: string
): Promise<OwnerStore | null> {
  const { data, error } = await supabase
    .from("stores")
    .select("id, slug, name")
    .eq("owner_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as OwnerStore;
}

/** All courses belonging to a store, newest first. */
export async function listCoursesForStore(
  supabase: SupabaseClient,
  storeId: string
): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as Course[];
}

/** A single course with its sections and lessons, ordered for display. */
export async function fetchCourseCurriculum(
  supabase: SupabaseClient,
  courseId: string
): Promise<CourseWithCurriculum | null> {
  const { data: course, error } = await supabase
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("id", courseId)
    .maybeSingle();
  if (error || !course) return null;

  const { data: sections } = await supabase
    .from("course_sections")
    .select("id, course_id, title, position")
    .eq("course_id", courseId)
    .order("position", { ascending: true });

  const { data: lessons } = await supabase
    .from("lessons")
    .select(LESSON_COLUMNS)
    .eq("course_id", courseId)
    .order("position", { ascending: true });

  const lessonList = (lessons ?? []) as Lesson[];
  const sectionList: SectionWithLessons[] = ((sections ?? []) as CourseSection[]).map((s) => ({
    ...s,
    lessons: lessonList.filter((l) => l.section_id === s.id),
  }));

  return { ...(course as Course), sections: sectionList };
}

/** Recompute and persist lesson_count + total_duration_sec from current lessons. */
export async function recomputeCourseAggregates(
  supabase: SupabaseClient,
  courseId: string
): Promise<{ lessonCount: number; totalDuration: number }> {
  const { data: lessons } = await supabase
    .from("lessons")
    .select("duration_sec")
    .eq("course_id", courseId);

  const list = (lessons ?? []) as { duration_sec: number }[];
  const lessonCount = list.length;
  const totalDuration = list.reduce((acc, l) => acc + (l.duration_sec || 0), 0);

  await supabase
    .from("courses")
    .update({ lesson_count: lessonCount, total_duration_sec: totalDuration })
    .eq("id", courseId);

  return { lessonCount, totalDuration };
}

/** Human-friendly duration, e.g. "1h 12m" or "8m". */
export function formatDuration(totalSec: number): string {
  if (!totalSec || totalSec < 1) return "0m";
  const h = Math.floor(totalSec / 3600);
  const m = Math.round((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Format an integer amount of XAF, e.g. 25000 -> "XAF 25,000". */
export function formatXAF(amount: number): string {
  return `XAF ${Math.round(amount).toLocaleString("en-US")}`;
}
