"use client";

import { useEffect, useRef } from "react";

type MediaPlayerProps = {
  src: string;
  alt: string;
  className?: string;
};

export function MediaPlayer({ src, alt, className }: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const play = () => {
      void video.play().catch(() => {
        // Autoplay may be blocked until user interaction; retry on visibility.
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible) {
          play();
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(video);
    play();

    return () => observer.disconnect();
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      className={className}
      aria-label={alt}
    />
  );
}
