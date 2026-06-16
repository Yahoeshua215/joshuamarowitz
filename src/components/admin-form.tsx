"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { inferMediaType } from "@/lib/media";
import { Project, ProjectImage } from "@/lib/store/types";
import { slugify } from "@/lib/utils";

type AdminFormProps = {
  initial?: Project;
};

const emptyProject: Project = {
  slug: "",
  title: "",
  category: "personal",
  tags: [],
  dateStart: new Date().toISOString().slice(0, 10),
  dateEnd: "ongoing",
  summary: "",
  status: "prototype",
  links: {},
  images: [],
  featured: false,
  order: 0,
};

export function AdminForm({ initial }: AdminFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<Project>(initial ?? emptyProject);
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(initial);

  const update = <K extends keyof Project>(key: K, value: Project[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const slug = form.slug || slugify(form.title);
    const payload: Project = {
      ...form,
      slug,
      tags: tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    const response = await fetch(
      isEditing ? `/api/admin/projects/${slug}` : "/api/admin/projects",
      {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Failed to save");
      setSaving(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const slug = form.slug || slugify(form.title);
    if (!slug) {
      setError("Add a title before uploading media");
      return;
    }

    const formData = new FormData();
    formData.append("slug", slug);
    formData.append("file", file);

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Upload failed");
      return;
    }

    const media: ProjectImage = await response.json();
    update("images", [...form.images, media]);
    event.target.value = "";
  };

  const moveMedia = (index: number, direction: -1 | 1) => {
    const next = [...form.images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update("images", next);
  };

  const removeMedia = (index: number) => {
    update(
      "images",
      form.images.filter((_, i) => i !== index)
    );
  };

  const handleDelete = async () => {
    if (!initial) return;
    if (!confirm(`Delete ${initial.title}?`)) return;

    await fetch(`/api/admin/projects/${initial.slug}`, { method: "DELETE" });
    router.push("/admin");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <input
            className="input"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            required
          />
        </Field>
        <Field label="Slug">
          <input
            className="input"
            value={form.slug}
            onChange={(e) => update("slug", e.target.value)}
            placeholder="auto-generated from title"
          />
        </Field>
        <Field label="Category">
          <select
            className="input"
            value={form.category}
            onChange={(e) =>
              update("category", e.target.value as Project["category"])
            }
          >
            <option value="onesignal">OneSignal Projects</option>
            <option value="personal">Josh Projects</option>
          </select>
        </Field>
        <Field label="Status">
          <select
            className="input"
            value={form.status}
            onChange={(e) =>
              update("status", e.target.value as Project["status"])
            }
          >
            <option value="shipped">Shipped</option>
            <option value="prototype">Prototype</option>
            <option value="experiment">Experiment</option>
          </select>
        </Field>
        <Field label="Start date">
          <input
            type="date"
            className="input"
            value={form.dateStart}
            onChange={(e) => update("dateStart", e.target.value)}
            required
          />
        </Field>
        <Field label="End date">
          <input
            type="date"
            className="input"
            value={form.dateEnd === "ongoing" ? "" : form.dateEnd}
            onChange={(e) =>
              update("dateEnd", e.target.value || "ongoing")
            }
          />
          <label className="mt-2 flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={form.dateEnd === "ongoing"}
              onChange={(e) =>
                update("dateEnd", e.target.checked ? "ongoing" : form.dateStart)
              }
            />
            Ongoing
          </label>
        </Field>
      </div>

      <Field label="Summary">
        <textarea
          className="input min-h-24"
          value={form.summary}
          onChange={(e) => update("summary", e.target.value)}
          required
        />
      </Field>

      <Field label="Tags (comma-separated)">
        <input
          className="input"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        {(["live", "github", "video", "figma"] as const).map((key) => (
          <Field key={key} label={`${key} URL`}>
            <input
              className="input"
              value={form.links?.[key] ?? ""}
              onChange={(e) =>
                update("links", { ...form.links, [key]: e.target.value || undefined })
              }
            />
          </Field>
        ))}
      </div>

      <Field label="Embed URL (live interactive demo)">
        <input
          className="input"
          value={form.embedUrl ?? ""}
          onChange={(e) => update("embedUrl", e.target.value || undefined)}
          placeholder="/embeds/<slug>/index.html — run `npm run build-embeds`"
        />
      </Field>

      <div className="space-y-3">
        <Field label="Case study — Problem">
          <textarea
            className="input min-h-20"
            value={form.caseStudy?.problem ?? ""}
            onChange={(e) =>
              update("caseStudy", {
                problem: e.target.value,
                solution: form.caseStudy?.solution ?? "",
                outcome: form.caseStudy?.outcome ?? "",
              })
            }
          />
        </Field>
        <Field label="Case study — Solution">
          <textarea
            className="input min-h-20"
            value={form.caseStudy?.solution ?? ""}
            onChange={(e) =>
              update("caseStudy", {
                problem: form.caseStudy?.problem ?? "",
                solution: e.target.value,
                outcome: form.caseStudy?.outcome ?? "",
              })
            }
          />
        </Field>
        <Field label="Case study — Outcome">
          <textarea
            className="input min-h-20"
            value={form.caseStudy?.outcome ?? ""}
            onChange={(e) =>
              update("caseStudy", {
                problem: form.caseStudy?.problem ?? "",
                solution: form.caseStudy?.solution ?? "",
                outcome: e.target.value,
              })
            }
          />
        </Field>
      </div>

      <Field label="Upload image or video">
        <input
          type="file"
          accept="image/*,video/webm,video/mp4,video/quicktime"
          onChange={handleMediaUpload}
        />
        {form.images.length > 0 && (
          <ul className="mt-3 space-y-3">
            {form.images.map((image, index) => {
              const type = image.type ?? inferMediaType(image.src);
              return (
                <li
                  key={`${image.src}-${index}`}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
                    {type === "video" ? (
                      <video
                        src={image.src}
                        muted
                        playsInline
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        className="object-cover"
                        unoptimized={image.src.endsWith(".svg")}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-xs font-medium">{image.src}</p>
                    <p className="text-[11px] uppercase tracking-wide text-muted">
                      {type}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => moveMedia(index, -1)}
                        disabled={index === 0}
                        className="text-xs text-muted hover:text-foreground disabled:opacity-40"
                      >
                        Move up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveMedia(index, 1)}
                        disabled={index === form.images.length - 1}
                        className="text-xs text-muted hover:text-foreground disabled:opacity-40"
                      >
                        Move down
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        className="text-xs text-red-500 hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Field>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity disabled:opacity-50"
        >
          {saving ? "Saving..." : isEditing ? "Update project" : "Create project"}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-md border border-border px-4 py-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
