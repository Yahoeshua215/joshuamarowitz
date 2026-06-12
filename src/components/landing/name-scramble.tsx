"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#%*<>/+=";
const RESOLVE_MS = 1200;
const REPEAT_MS = 60000;

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

// Decrypts `text` left-to-right on mount, then rebuilds itself every ~minute.
export function NameScramble({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(text);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    let start = 0;

    const run = (now: number) => {
      if (!mounted) return;
      if (!start) start = now;
      const progress = Math.min((now - start) / RESOLVE_MS, 1);
      const locked = Math.floor(progress * text.length);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        if (text[i] === " ") out += " ";
        else if (i < locked) out += text[i];
        else out += randomGlyph();
      }
      setDisplay(out);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(run);
      } else {
        setDisplay(text);
      }
    };

    const build = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      start = 0;
      frameRef.current = requestAnimationFrame(run);
    };

    build();
    const interval = setInterval(build, REPEAT_MS);

    return () => {
      mounted = false;
      clearInterval(interval);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [text]);

  return (
    <span className={className} style={{ whiteSpace: "pre" }}>
      {display}
    </span>
  );
}
