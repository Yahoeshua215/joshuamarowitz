import { notFound, redirect } from "next/navigation";
import { AdminForm } from "@/components/admin-form";
import { Container } from "@/components/container";
import { isAdminAuthenticated } from "@/lib/auth";
import { getContentStore } from "@/lib/store";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EditProjectPage({ params }: PageProps) {
  if (!(await isAdminAuthenticated())) redirect("/admin");

  const { slug } = await params;
  const store = getContentStore();
  const project = await store.getProject(slug);

  if (!project) notFound();

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Edit project</h1>
          <p className="text-sm text-muted">{project.title}</p>
        </div>
        <AdminForm initial={project} />
      </div>
    </Container>
  );
}
