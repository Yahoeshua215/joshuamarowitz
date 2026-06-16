"use client";

import { useEffect, useRef } from "react";
import { CREDITS_SKILLS } from "./landing-data";

export function SkillsCredits() {
  // Duplicate the list so the -50% translate loops seamlessly.
  const loop = [...CREDITS_SKILLS, ...CREDITS_SKILLS];
  const maskRef = useRef<HTMLDivElement>(null);

  // Each frame, score every skill by how close it is to the list's vertical
  // center (1 at dead center → 0 further away) and expose it as `--focus`. CSS
  // uses it to bold/brighten/scale the word, so whichever skill is centered is
  // always emphasized, easing in and out as the list scrolls.
  useEffect(() => {
    const mask = maskRef.current;
    if (!mask) return;
    const items = Array.from(mask.querySelectorAll<HTMLElement>(".credit-item"));
    let raf = 0;
    const tick = () => {
      const rect = mask.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const range = rect.height * 0.15; // focus falls to 0 ~one item away
      for (const li of items) {
        const r = li.getBoundingClientRect();
        const dist = Math.abs(r.top + r.height / 2 - center);
        const f = Math.max(0, 1 - dist / range);
        const eased = f * f * (3 - 2 * f); // smoothstep
        li.style.setProperty("--focus", eased.toFixed(3));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative h-full min-h-[140px] font-mono">
      <div ref={maskRef} className="credits-mask absolute inset-0 overflow-hidden">
        <ul className="credits-track space-y-2.5">
          {loop.map((skill, i) => (
            <li
              key={`${skill}-${i}`}
              className="credit-item flex items-center gap-2 text-xs tracking-[0.12em]"
            >
              <span className="h-1 w-1 shrink-0 rounded-full bg-white/30" />
              {skill}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
