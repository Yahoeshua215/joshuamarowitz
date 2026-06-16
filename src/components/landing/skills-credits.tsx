"use client";

import { CREDITS_SKILLS } from "./landing-data";

export function SkillsCredits() {
  // Duplicate the list so the -50% translate loops seamlessly.
  const loop = [...CREDITS_SKILLS, ...CREDITS_SKILLS];

  return (
    <div className="relative h-full min-h-[140px] font-mono">
      <div className="credits-mask absolute inset-0 overflow-hidden">
        <ul className="credits-track space-y-2.5">
          {loop.map((skill, i) => (
            <li
              key={`${skill}-${i}`}
              className="flex items-center gap-2 text-xs tracking-[0.12em] text-white/60"
            >
              <span className="h-1 w-1 rounded-full bg-white/30" />
              {skill}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
