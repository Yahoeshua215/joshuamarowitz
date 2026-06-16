"use client";

import { CategoryFilter } from "@/lib/utils";
import { SegmentedToggle } from "./segmented-toggle";
import { TagChip } from "./tag-chip";

type TimelineFiltersProps = {
  category: CategoryFilter;
  onCategoryChange: (value: CategoryFilter) => void;
  tags: string[];
  activeTags: string[];
  onTagToggle: (tag: string) => void;
  showTags: boolean;
};

export function TimelineFilters({
  category,
  onCategoryChange,
  tags,
  activeTags,
  onTagToggle,
  showTags,
}: TimelineFiltersProps) {
  return (
    <div className="space-y-4">
      <SegmentedToggle
        value={category}
        onChange={onCategoryChange}
        options={[
          { value: "all", label: "All" },
          { value: "onesignal", label: "OneSignal Projects" },
          { value: "personal", label: "Josh Projects" },
        ]}
      />

      {showTags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              active={activeTags.includes(tag)}
              onClick={() => onTagToggle(tag)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
