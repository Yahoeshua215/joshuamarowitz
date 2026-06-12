import { ProjectImage } from "./store/types";

const VIDEO_EXTENSIONS = [".webm", ".mp4", ".mov"];

export function inferMediaType(src: string): "image" | "video" {
  const lower = src.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext)) ? "video" : "image";
}

export function normalizeProjectImage(image: ProjectImage): ProjectImage {
  return {
    ...image,
    type: image.type ?? inferMediaType(image.src),
  };
}

export function normalizeProjectImages(images: ProjectImage[]): ProjectImage[] {
  return images.map(normalizeProjectImage);
}

export function getHeroMedia(images: ProjectImage[]): ProjectImage | null {
  if (images.length === 0) return null;
  const normalized = normalizeProjectImages(images);
  return normalized.find((img) => img.type === "video") ?? normalized[0];
}
