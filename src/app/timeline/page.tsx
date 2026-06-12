import { Container } from "@/components/container";
import { Timeline } from "@/components/timeline";
import { getContentStore } from "@/lib/store";

export default async function TimelinePage() {
  const store = getContentStore();
  const projects = await store.listProjects();

  return (
    <Container>
      <div className="space-y-8">
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Work log</h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted">
            An ongoing changelog of personal experiments and product design work —
            expand any entry to see previews, links, and case studies.
          </p>
        </section>

        <Timeline projects={projects} />
      </div>
    </Container>
  );
}
