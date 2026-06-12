import { redirect } from "next/navigation";
import { AdminForm } from "@/components/admin-form";
import { Container } from "@/components/container";
import { isAdminAuthenticated } from "@/lib/auth";

export default async function NewProjectPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin");

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">New project</h1>
          <p className="text-sm text-muted">Add a new entry to the timeline.</p>
        </div>
        <AdminForm />
      </div>
    </Container>
  );
}
