import { FileContentStore } from "./file-store";
import { SupabaseContentStore } from "./supabase-store";
import { ContentStore } from "./types";

let store: ContentStore | null = null;

export function getContentStore(): ContentStore {
  if (store) return store;

  const backend = process.env.CONTENT_BACKEND ?? "file";

  if (backend === "supabase") {
    store = new SupabaseContentStore();
  } else {
    store = new FileContentStore();
  }

  return store;
}

export * from "./types";
