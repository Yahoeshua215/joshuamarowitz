import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getContentStore } from "@/lib/store";
import { ProjectSchema } from "@/lib/store/types";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const store = getContentStore();
  const project = await store.getProject(slug);

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PUT(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;

  try {
    const body = await request.json();
    const parsed = ProjectSchema.parse({ ...body, slug });
    const store = getContentStore();
    const project = await store.upsertProject(parsed);
    return NextResponse.json(project);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const store = getContentStore();
  await store.deleteProject(slug);
  return NextResponse.json({ ok: true });
}
