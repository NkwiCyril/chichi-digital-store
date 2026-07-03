import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchCourseCurriculum, fetchOwnerStore } from "@/lib/db/courses";
import CourseEditor from "./CourseEditor";

export default async function CourseEditorPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const store = await fetchOwnerStore(supabase, user.id);
  if (!store) redirect("/dashboard/creator/courses");

  const course = await fetchCourseCurriculum(supabase, courseId);
  if (!course || course.store_id !== store.id) redirect("/dashboard/creator/courses");

  return <CourseEditor course={course} />;
}
