import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getContentStore } from "@/lib/store";
import { ProjectSchema } from "@/lib/store/types";

export async function GET() {
  const store = getContentStore();
  const projects = await store.listProjects();
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = ProjectSchema.parse(body);
    const store = getContentStore();
    const project = await store.upsertProject(parsed);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
