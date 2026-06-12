import {
  ContentStore,
  Project,
  ProjectInput,
} from "./types";

/**
 * Stub for future Supabase migration.
 * Flip CONTENT_BACKEND=supabase once schema + env vars are configured.
 */
export class SupabaseContentStore implements ContentStore {
  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "SupabaseContentStore requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
      );
    }
  }

  async listProjects(): Promise<Project[]> {
    throw new Error("SupabaseContentStore.listProjects is not implemented yet");
  }

  async getProject(slug: string): Promise<Project | null> {
    void slug;
    throw new Error("SupabaseContentStore.getProject is not implemented yet");
  }

  async upsertProject(data: ProjectInput): Promise<Project> {
    void data;
    throw new Error("SupabaseContentStore.upsertProject is not implemented yet");
  }

  async deleteProject(slug: string): Promise<void> {
    void slug;
    throw new Error("SupabaseContentStore.deleteProject is not implemented yet");
  }

  async saveImage(
    slug: string,
    filename: string,
    buffer: Buffer
  ): Promise<string> {
    void slug;
    void filename;
    void buffer;
    throw new Error("SupabaseContentStore.saveImage is not implemented yet");
  }
}
