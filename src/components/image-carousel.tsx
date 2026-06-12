"use client";

import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { inferMediaType } from "@/lib/media";
import { ProjectImage } from "@/lib/store/types";
import { MediaPlayer } from "./media-player";
import { VideoModal } from "./video-modal";

function getMediaType(image: ProjectImage): "image" | "video" {
  return image.type ?? inferMediaType(image.src);
}

type MediaSlideProps = {
  image: ProjectImage;
  onVideoClick?: () => void;
};

function MediaSlide({ image, onVideoClick }: MediaSlideProps) {
  const type = getMediaType(image);

  if (type === "video") {
    return (
      <button
        type="button"
        onClick={onVideoClick}
        className="group/video absolute inset-0 h-full w-full cursor-pointer"
        aria-label={`Expand ${image.alt}`}
      >
        <MediaPlayer
          src={image.src}
          alt={image.alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <span className="absolute inset-0 bg-black/0 transition-colors group-hover/video:bg-black/20" />
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-background/80 px-2.5 py-1.5 text-xs font-medium text-foreground opacity-80 backdrop-blur-sm transition-opacity sm:opacity-0 sm:group-hover/video:opacity-100">
          <Maximize2 className="h-3.5 w-3.5" />
          Expand
        </span>
      </button>
    );
  }

  return (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 100vw, 640px"
      unoptimized={image.src.endsWith(".svg")}
    />
  );
}

type ImageCarouselProps = {
  images: ProjectImage[];
  title?: string;
};

export function ImageCarousel({ images, title }: ImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-lg border border-dashed border-border bg-surface text-sm text-muted">
        No preview yet
      </div>
    );
  }

  const current = images[index];
  const hasMultiple = images.length > 1;
  const currentIsVideo = getMediaType(current) === "video";

  return (
    <>
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded-lg border border-border bg-surface">
          <div className="relative aspect-[16/10] bg-black">
            <MediaSlide
              image={current}
              onVideoClick={
                currentIsVideo ? () => setModalOpen(true) : undefined
              }
            />
          </div>
          {hasMultiple && (
            <>
              <button
                type="button"
                aria-label="Previous media"
                onClick={() =>
                  setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                }
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-md border border-border bg-background/80 p-1.5 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next media"
                onClick={() =>
                  setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                }
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-md border border-border bg-background/80 p-1.5 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
        {hasMultiple && (
          <div className="flex justify-center gap-1.5">
            {images.map((image, i) => (
              <button
                key={image.src}
                type="button"
                aria-label={`Show media ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === index ? "bg-accent" : "bg-border"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {currentIsVideo && (
        <VideoModal
          src={current.src}
          alt={current.alt}
          title={title}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

export { ImageCarousel as MediaCarousel };
