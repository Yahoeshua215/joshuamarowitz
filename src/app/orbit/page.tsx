import { GlobeCanvas } from "@/components/globe/globe-canvas";
import { getContentStore } from "@/lib/store";
import { Project } from "@/lib/store/types";

type PageProps = {
  searchParams: Promise<{ focus?: string }>;
};

const VALID: Project["category"][] = ["personal", "onesignal", "onesignal-work"];

export default async function OrbitPage({ searchParams }: PageProps) {
  const store = getContentStore();
  const projects = await store.listProjects();
  const { focus } = await searchParams;

  const initialFocus = VALID.includes(focus as Project["category"])
    ? (focus as Project["category"])
    : null;

  return <GlobeCanvas projects={projects} initialFocus={initialFocus} />;
}
