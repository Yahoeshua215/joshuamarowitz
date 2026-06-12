import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { inferMediaType } from "@/lib/media";
import { getContentStore } from "@/lib/store";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const slug = formData.get("slug");
    const file = formData.get("file");

    if (typeof slug !== "string" || !slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const store = getContentStore();
    const src = await store.saveImage(slug, file.name, buffer);

    const type = inferMediaType(src);

    return NextResponse.json({
      src,
      alt: file.name,
      type,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
