"use client";

import { useEffect, useRef, useState } from "react";
import { SCRAMBLE_TOOLS } from "./landing-data";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>#*+";

// Phases: a word resolves character-by-character, holds, then scrambles away
// before the next word resolves — the "spinning characters spelling something"
// effect.
const RESOLVE_MS = 900;
const HOLD_MS = 1400;
const SCRAMBLE_MS = 500;

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

export function SkillScramble({ words = SCRAMBLE_TOOLS }: { words?: string[] }) {
  const [display, setDisplay] = useState("");
  const indexRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    let phaseStart = performance.now();
    let phase: "resolve" | "hold" | "scramble" = "resolve";
    let mounted = true;

    const tick = (now: number) => {
      if (!mounted) return;
      const word = words[indexRef.current % words.length];
      const elapsed = now - phaseStart;

      if (phase === "resolve") {
        const progress = Math.min(elapsed / RESOLVE_MS, 1);
        const locked = Math.floor(progress * word.length);
        let out = "";
        for (let i = 0; i < word.length; i++) {
          out += i < locked || word[i] === " " ? word[i] : randomGlyph();
        }
        setDisplay(out);
        if (progress >= 1) {
          setDisplay(word);
          phase = "hold";
          phaseStart = now;
        }
      } else if (phase === "hold") {
        if (elapsed >= HOLD_MS) {
          phase = "scramble";
          phaseStart = now;
        }
      } else {
        const progress = Math.min(elapsed / SCRAMBLE_MS, 1);
        const dissolved = Math.floor(progress * word.length);
        let out = "";
        for (let i = 0; i < word.length; i++) {
          out += i < dissolved || word[i] === " " ? " " : randomGlyph();
        }
        setDisplay(out);
        if (progress >= 1) {
          indexRef.current += 1;
          phase = "resolve";
          phaseStart = now;
        }
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [words]);

  return (
    <p
      className="min-h-[1.5em] whitespace-pre font-mono text-lg font-semibold tracking-[0.15em] text-[#5ee0c8]"
      style={{ textShadow: "0 0 12px rgba(94,224,200,0.5)" }}
    >
      {display || "\u00a0"}
    </p>
  );
}
