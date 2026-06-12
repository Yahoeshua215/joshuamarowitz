import Link from "next/link";
import { AdminLogin } from "@/components/admin-login";
import { Container } from "@/components/container";
import { isAdminAuthenticated } from "@/lib/auth";
import { getContentStore } from "@/lib/store";
import { categoryLabel, formatDateRange } from "@/lib/utils";

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();

  if (!authed) {
    return (
      <Container>
        <AdminLogin />
      </Container>
    );
  }

  const store = getContentStore();
  const projects = await store.listProjects();

  return (
    <Container>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm text-muted">
            Manage timeline entries, media, and case studies.
          </p>
        </div>
        <Link
          href="/admin/new"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          New project
        </Link>
      </div>

      <div className="divide-y divide-border rounded-xl border border-border bg-surface">
        {projects.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted">No projects yet.</p>
        ) : (
          projects.map((project) => (
            <Link
              key={project.slug}
              href={`/admin/${project.slug}`}
              className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-hover"
            >
              <div>
                <p className="text-sm font-medium">{project.title}</p>
                <p className="text-xs text-muted">
                  {categoryLabel(project.category)} ·{" "}
                  {formatDateRange(project.dateStart, project.dateEnd)}
                </p>
              </div>
              <span className="text-xs text-muted">{project.status}</span>
            </Link>
          ))
        )}
      </div>
    </div>
    </Container>
  );
}
