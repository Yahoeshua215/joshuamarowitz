import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseStudy } from "@/components/case-study";
import { Container } from "@/components/container";
import { ProjectHeroMedia } from "@/components/project-hero-media";
import { StatusBadge } from "@/components/status-badge";
import { TagChip } from "@/components/tag-chip";
import { getContentStore } from "@/lib/store";
import { formatDateRange } from "@/lib/utils";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const store = getContentStore();
  const projects = await store.listProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const store = getContentStore();
  const project = await store.getProject(slug);

  if (!project) notFound();

  return (
    <Container>
    <article className="space-y-8">
      <Link
        href="/timeline"
        className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to timeline
      </Link>

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={project.status} />
          <span className="text-xs text-muted">
            {formatDateRange(project.dateStart, project.dateEnd)}
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{project.title}</h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted">
          {project.summary}
        </p>
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <TagChip key={tag} label={tag} />
            ))}
          </div>
        )}
      </header>

      <ProjectHeroMedia images={project.images} title={project.title} />

      {project.caseStudy ? (
        <CaseStudy caseStudy={project.caseStudy} />
      ) : (
        <p className="text-sm text-muted">No case study written yet.</p>
      )}
    </article>
    </Container>
  );
}
