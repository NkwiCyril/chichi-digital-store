"use client";

import { useRef, useState } from "react";
import * as tus from "tus-js-client";
import type { Lesson } from "@/lib/db/courses";

interface LessonUploaderProps {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  onComplete: (updated: Partial<Lesson>) => void;
  onCancel: () => void;
}

interface UploadTarget {
  uploadURL: string;
  uid: string;
}

export default function LessonUploader({
  courseId,
  lessonId,
  lessonTitle,
  onComplete,
  onCancel,
}: LessonUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<"select" | "uploading" | "done" | "error">("select");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const uploadRef = useRef<tus.Upload | null>(null);

  const startUpload = async (file: File) => {
    setPhase("uploading");
    setProgress(0);
    setError(null);

    try {
      // 1. Ask our API for a one-time Cloudflare direct-creator upload URL.
      const targetRes = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadLength: file.size, fileName: file.name }),
      });

      if (!targetRes.ok) {
        const data = await targetRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to prepare upload.");
      }

      const target: UploadTarget = await targetRes.json();

      // 2. Upload directly to Cloudflare Stream via resumable TUS.
      await uploadToStream(target, file);

      setPhase("done");
      onComplete({
        video_uid: target.uid,
        status: "processing",
      });
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  };

  const uploadToStream = (target: UploadTarget, file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(file, {
        uploadUrl: target.uploadURL,
        chunkSize: 50 * 1024 * 1024,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        metadata: { filename: file.name, filetype: file.type },
        onProgress: (bytesSent, bytesTotal) => {
          if (bytesTotal > 0) {
            setProgress(Math.round((bytesSent / bytesTotal) * 100));
          }
        },
        onError: (err) => reject(err instanceof Error ? err : new Error(String(err))),
        onSuccess: () => resolve(),
      });
      uploadRef.current = upload;
      upload.start();
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024 * 1024; // 5 GB
    if (file.size > maxSize) {
      setError("File is too large. Maximum size is 5 GB.");
      return;
    }

    if (!file.type.startsWith("video/")) {
      setError("Please select a video file.");
      return;
    }

    startUpload(file);
  };

  const cancelUpload = () => {
    if (uploadRef.current) {
      void uploadRef.current.abort();
    }
    onCancel();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-900">{lessonTitle}</p>
        <button
          onClick={cancelUpload}
          className="cursor-pointer text-xs text-zinc-400 hover:text-zinc-600"
        >
          Cancel
        </button>
      </div>

      {phase === "select" && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer w-full rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-6 py-8 text-center hover:border-violet-300 hover:bg-violet-50/50 transition-colors"
          >
            <svg className="mx-auto h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="mt-2 text-sm font-medium text-zinc-600">
              Click to select a video file
            </p>
            <p className="mt-1 text-xs text-zinc-400">MP4, MOV, WEBM up to 5 GB</p>
          </button>
        </div>
      )}

      {phase === "uploading" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-violet-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Upload complete. The video is now being processed by Cloudflare Stream.
        </div>
      )}

      {(phase === "error" || error) && (
        <div className="space-y-2">
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
            {error}
          </div>
          <button
            onClick={() => {
              setPhase("select");
              setError(null);
            }}
            className="cursor-pointer text-xs font-medium text-violet-600 hover:text-violet-700"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
