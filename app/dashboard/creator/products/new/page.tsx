"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_MB = 500;
const ACCEPTED = ".pdf,.zip,.epub,.mp4,.mp3,.png,.jpg,.jpeg,.gif,.txt,.docx,.pptx,.xlsx";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewProductPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceXaf, setPriceXaf] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (f: File | null) => {
    setFileError(null);
    if (!f) { setFile(null); return; }
    if (f.size > MAX_MB * 1024 * 1024) {
      setFileError(`File exceeds ${MAX_MB} MB limit.`);
      setFile(null);
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setFileError("Please select a file to upload."); return; }
    if (!title.trim()) { setError("Title is required."); return; }

    setUploading(true);
    setProgress(0);
    setError(null);

    const body = new FormData();
    body.append("file", file);
    body.append("title", title.trim());
    body.append("description", description.trim());
    body.append("price_xaf", String(Number(priceXaf) || 0));

    // Simulate progress (real XHR progress could be added later)
    const ticker = setInterval(() => setProgress((p) => Math.min(p + 8, 90)), 300);

    try {
      const res = await fetch("/api/products/upload", { method: "POST", body });
      clearInterval(ticker);
      setProgress(100);
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Upload failed."); setUploading(false); return; }
      router.push("/dashboard/creator/products");
      router.refresh();
    } catch {
      clearInterval(ticker);
      setError("Network error. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-xl">
      <header>
        <p className="text-sm text-zinc-500">Creator dashboard · Products</p>
        <h1 className="text-2xl font-bold text-zinc-900">Upload a digital product</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* File drop zone */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">File</label>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0] ?? null); }}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center cursor-pointer hover:border-violet-300 hover:bg-violet-50 transition-colors"
          >
            <svg className="w-8 h-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {file ? (
              <div>
                <p className="text-sm font-semibold text-violet-700">{file.name}</p>
                <p className="text-xs text-zinc-400">{formatBytes(file.size)}</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-zinc-600">Click or drag a file here</p>
                <p className="text-xs text-zinc-400 mt-0.5">PDF, ZIP, MP4, MP3, EPUB and more — up to {MAX_MB} MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          {fileError && <p className="mt-1.5 text-xs text-red-500">{fileError}</p>}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-700 mb-1.5">Title</label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Brand Identity Starter Kit"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="desc" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Description <span className="text-zinc-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's included? Who is it for?"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 resize-none"
          />
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Price (XAF) <span className="text-zinc-400 font-normal">— enter 0 for free</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400 select-none">XAF</span>
            <input
              id="price"
              type="number"
              min={0}
              step={100}
              value={priceXaf}
              onChange={(e) => setPriceXaf(e.target.value)}
              placeholder="5000"
              className="w-full rounded-xl border border-zinc-200 bg-white pl-14 pr-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {uploading && (
          <div>
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>Uploading…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-200">
              <div
                className="h-1.5 rounded-full bg-violet-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={uploading}
            className="flex-1 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {uploading ? "Uploading…" : "Save as draft"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={uploading}
            className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-60 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
