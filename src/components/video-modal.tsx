"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

type VideoModalProps = {
  src: string;
  alt: string;
  title?: string;
  open: boolean;
  onClose: () => void;
};

export function VideoModal({ src, alt, title, open, onClose }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      void video.play().catch(() => {});
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      video?.pause();
    };
  }, [open, onClose, src]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? alt}
    >
      <button
        type="button"
        aria-label="Close video"
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-6xl">
        <div className="mb-3 flex items-center justify-between gap-4 px-1">
          {title ? (
            <p className="text-sm font-medium text-foreground">{title}</p>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className="cut-modal"
          style={{ ["--cut-accent" as string]: "#5ee0c8", ["--cut" as string]: "18px" }}
        >
          <div className="cut-modal-inner bg-black">
            <video
              ref={videoRef}
              src={src}
              autoPlay
              loop
              muted
              playsInline
              controls
              className="aspect-video max-h-[80vh] w-full object-contain"
              aria-label={alt}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
