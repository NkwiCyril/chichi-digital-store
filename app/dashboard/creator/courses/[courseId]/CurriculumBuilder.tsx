"use client";

import { useState, useTransition } from "react";

import type { Lesson, SectionWithLessons } from "@/lib/db/courses";
import { formatDuration } from "@/lib/db/courses";
import LessonUploader from "./LessonUploader";

interface CurriculumBuilderProps {
  courseId: string;
  sections: SectionWithLessons[];
  onChange: (sections: SectionWithLessons[]) => void;
}

export default function CurriculumBuilder({
  courseId,
  sections,
  onChange,
}: CurriculumBuilderProps) {
  const [pending, startTransition] = useTransition();
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [addingLessonToSection, setAddingLessonToSection] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);

  const addSection = () => {
    if (!newSectionTitle.trim()) return;
    startTransition(async () => {
      const res = await fetch(`/api/courses/${courseId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSectionTitle.trim() }),
      });
      if (res.ok) {
        const section = await res.json();
        onChange([...sections, { ...section, lessons: [] }]);
        setNewSectionTitle("");
      }
    });
  };

  const updateSection = (sectionId: string) => {
    if (!sectionTitle.trim()) return;
    startTransition(async () => {
      const res = await fetch(`/api/courses/${courseId}/sections/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: sectionTitle.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        onChange(sections.map((s) => (s.id === sectionId ? { ...s, title: updated.title } : s)));
        setEditingSectionId(null);
      }
    });
  };

  const deleteSection = (sectionId: string) => {
    startTransition(async () => {
      const res = await fetch(`/api/courses/${courseId}/sections/${sectionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onChange(sections.filter((s) => s.id !== sectionId));
      }
    });
  };

  const addLesson = (sectionId: string) => {
    if (!newLessonTitle.trim()) return;
    startTransition(async () => {
      const res = await fetch(`/api/courses/${courseId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section_id: sectionId, title: newLessonTitle.trim() }),
      });
      if (res.ok) {
        const lesson = await res.json();
        onChange(
          sections.map((s) =>
            s.id === sectionId ? { ...s, lessons: [...s.lessons, lesson] } : s
          )
        );
        setNewLessonTitle("");
        setAddingLessonToSection(null);
      }
    });
  };

  const updateLesson = (lessonId: string, sectionId: string) => {
    if (!lessonTitle.trim()) return;
    startTransition(async () => {
      const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: lessonTitle.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        onChange(
          sections.map((s) =>
            s.id === sectionId
              ? { ...s, lessons: s.lessons.map((l) => (l.id === lessonId ? { ...s.lessons.find((x) => x.id === lessonId)!, ...updated } : l)) }
              : s
          )
        );
        setEditingLessonId(null);
      }
    });
  };

  const deleteLesson = (lessonId: string, sectionId: string) => {
    startTransition(async () => {
      const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onChange(
          sections.map((s) =>
            s.id === sectionId
              ? { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) }
              : s
          )
        );
      }
    });
  };

  const togglePreview = (lesson: Lesson, sectionId: string) => {
    startTransition(async () => {
      const res = await fetch(`/api/courses/${courseId}/lessons/${lesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_preview: !lesson.is_preview }),
      });
      if (res.ok) {
        onChange(
          sections.map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  lessons: s.lessons.map((l) =>
                    l.id === lesson.id ? { ...l, is_preview: !l.is_preview } : l
                  ),
                }
              : s
          )
        );
      }
    });
  };

  const syncLesson = (lessonId: string, sectionId: string) => {
    startTransition(async () => {
      const res = await fetch(`/api/lessons/${lessonId}/sync`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        onChange(
          sections.map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  lessons: s.lessons.map((l) => (l.id === lessonId ? { ...l, ...updated } : l)),
                }
              : s
          )
        );
      }
    });
  };

  const onUploadComplete = (lessonId: string, sectionId: string, updatedLesson: Partial<Lesson>) => {
    onChange(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              lessons: s.lessons.map((l) =>
                l.id === lessonId ? { ...l, ...updatedLesson } : l
              ),
            }
          : s
      )
    );
    setUploadingLessonId(null);
  };

  const statusIcon = (status: string) => {
    if (status === "ready")
      return <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Ready" />;
    if (status === "error")
      return <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" title="Error" />;
    return <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0 animate-pulse" title="Processing" />;
  };

  return (
    <div className="space-y-4">
      {sections.map((section, sIndex) => (
        <div key={section.id} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
          {/* Section header */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 bg-zinc-50">
            {editingSectionId === section.id ? (
              <div className="flex items-center gap-2 flex-1 mr-2">
                <input
                  type="text"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && updateSection(section.id)}
                  className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                  autoFocus
                />
                <button
                  onClick={() => updateSection(section.id)}
                  disabled={pending}
                  className="cursor-pointer text-xs font-semibold text-violet-600 hover:text-violet-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingSectionId(null)}
                  className="cursor-pointer text-xs text-zinc-400 hover:text-zinc-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-zinc-400">S{sIndex + 1}</span>
                <h3 className="text-sm font-semibold text-zinc-900 truncate">{section.title}</h3>
                <span className="text-xs text-zinc-400">{section.lessons.length} lessons</span>
              </div>
            )}

            {editingSectionId !== section.id && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditingSectionId(section.id);
                    setSectionTitle(section.title);
                  }}
                  className="cursor-pointer text-xs font-medium text-zinc-400 hover:text-zinc-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this section and all its lessons?")) {
                      deleteSection(section.id);
                    }
                  }}
                  disabled={pending}
                  className="cursor-pointer text-xs font-medium text-zinc-400 hover:text-rose-600"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Lessons */}
          <div className="divide-y divide-zinc-50">
            {section.lessons.map((lesson) => (
              <div key={lesson.id} className="px-5 py-3">
                {uploadingLessonId === lesson.id ? (
                  <LessonUploader
                    courseId={courseId}
                    lessonId={lesson.id}
                    lessonTitle={lesson.title}
                    onComplete={(updated) => onUploadComplete(lesson.id, section.id, updated)}
                    onCancel={() => setUploadingLessonId(null)}
                  />
                ) : editingLessonId === lesson.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && updateLesson(lesson.id, section.id)}
                      className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                      autoFocus
                    />
                    <button
                      onClick={() => updateLesson(lesson.id, section.id)}
                      disabled={pending}
                      className="cursor-pointer text-xs font-semibold text-violet-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingLessonId(null)}
                      className="cursor-pointer text-xs text-zinc-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {statusIcon(lesson.status)}
                      <span className="text-sm text-zinc-900 truncate">{lesson.title}</span>
                      {lesson.duration_sec > 0 && (
                        <span className="text-xs text-zinc-400">{formatDuration(lesson.duration_sec)}</span>
                      )}
                      {lesson.is_preview && (
                        <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-600 uppercase">
                          Preview
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!lesson.video_uid && (
                        <button
                          onClick={() => setUploadingLessonId(lesson.id)}
                          className="cursor-pointer rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-600 hover:bg-violet-100 transition-colors"
                        >
                          Upload video
                        </button>
                      )}
                      {lesson.video_uid && lesson.status === "processing" && (
                        <button
                          onClick={() => syncLesson(lesson.id, section.id)}
                          disabled={pending}
                          className="cursor-pointer rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                        >
                          Check status
                        </button>
                      )}
                      {lesson.video_uid && lesson.status === "ready" && (
                        <span className="text-xs text-emerald-600 font-medium">Video ready</span>
                      )}
                      {lesson.video_uid && lesson.status === "error" && (
                        <button
                          onClick={() => setUploadingLessonId(lesson.id)}
                          className="cursor-pointer rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
                        >
                          Re-upload
                        </button>
                      )}
                      <button
                        onClick={() => togglePreview(lesson, section.id)}
                        className={`cursor-pointer text-xs font-medium ${
                          lesson.is_preview ? "text-violet-600" : "text-zinc-400 hover:text-zinc-600"
                        }`}
                        title={lesson.is_preview ? "Remove preview" : "Mark as free preview"}
                      >
                        {lesson.is_preview ? "Previewing" : "Preview"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingLessonId(lesson.id);
                          setLessonTitle(lesson.title);
                        }}
                        className="cursor-pointer text-xs text-zinc-400 hover:text-zinc-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this lesson?")) {
                            deleteLesson(lesson.id, section.id);
                          }
                        }}
                        disabled={pending}
                        className="cursor-pointer text-xs text-zinc-400 hover:text-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add lesson */}
            {addingLessonToSection === section.id ? (
              <div className="flex items-center gap-2 px-5 py-3">
                <input
                  type="text"
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLesson(section.id)}
                  placeholder="Lesson title"
                  className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                  autoFocus
                />
                <button
                  onClick={() => addLesson(section.id)}
                  disabled={pending}
                  className="cursor-pointer text-xs font-semibold text-violet-600 hover:text-violet-700"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setAddingLessonToSection(null);
                    setNewLessonTitle("");
                  }}
                  className="cursor-pointer text-xs text-zinc-400 hover:text-zinc-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAddingLessonToSection(section.id);
                  setNewLessonTitle("");
                }}
                className="w-full cursor-pointer px-5 py-3 text-left text-xs font-medium text-zinc-400 hover:bg-zinc-50 hover:text-violet-600 transition-colors"
              >
                + Add lesson
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add section */}
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSection()}
            placeholder="New section title"
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
          />
          <button
            onClick={addSection}
            disabled={pending || !newSectionTitle.trim()}
            className="cursor-pointer rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add section
          </button>
        </div>
      </div>
    </div>
  );
}
