import { GlobeCanvas } from "@/components/globe/globe-canvas";
import { MISSION_CATEGORY_ORDER } from "@/components/landing/landing-data";
import { loadWeeklyLog } from "@/lib/log/load-log";
import { getContentStore } from "@/lib/store";
import { Project } from "@/lib/store/types";

type PageProps = {
  searchParams: Promise<{ focus?: string }>;
};

const VALID = MISSION_CATEGORY_ORDER;

export default async function OrbitPage({ searchParams }: PageProps) {
  const store = getContentStore();
  const [projects, logWeeks] = await Promise.all([
    store.listProjects(),
    loadWeeklyLog(),
  ]);
  const { focus } = await searchParams;

  const initialFocus = VALID.includes(focus as Project["category"])
    ? (focus as Project["category"])
    : null;

  return (
    <GlobeCanvas
      projects={projects}
      logWeeks={logWeeks}
      initialFocus={initialFocus}
    />
  );
}
