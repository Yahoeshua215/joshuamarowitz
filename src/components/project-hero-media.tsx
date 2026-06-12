"use client";

import { Maximize2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { getHeroMedia, inferMediaType } from "@/lib/media";
import { ProjectImage } from "@/lib/store/types";
import { MediaPlayer } from "./media-player";
import { VideoModal } from "./video-modal";

function getMediaType(image: ProjectImage): "image" | "video" {
  return image.type ?? inferMediaType(image.src);
}

type ProjectHeroMediaProps = {
  images: ProjectImage[];
  title?: string;
};

export function ProjectHeroMedia({ images, title }: ProjectHeroMediaProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const hero = getHeroMedia(images);
  if (!hero) return null;

  const type = getMediaType(hero);

  return (
    <>
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-black">
        {type === "video" ? (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="group/video absolute inset-0 h-full w-full cursor-pointer"
            aria-label={`Expand ${hero.alt}`}
          >
            <MediaPlayer
              src={hero.src}
              alt={hero.alt}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute inset-0 bg-black/0 transition-colors group-hover/video:bg-black/20" />
            <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-md border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground opacity-80 backdrop-blur-sm transition-opacity sm:opacity-0 sm:group-hover/video:opacity-100">
              <Maximize2 className="h-3.5 w-3.5" />
              Expand walkthrough
            </span>
          </button>
        ) : (
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            className="object-cover"
            priority
            unoptimized={hero.src.endsWith(".svg")}
          />
        )}
      </div>

      {type === "video" && (
        <VideoModal
          src={hero.src}
          alt={hero.alt}
          title={title}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
