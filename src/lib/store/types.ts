import { z } from "zod";

export const ProjectLinksSchema = z.object({
  live: z.string().url().optional(),
  github: z.string().url().optional(),
  video: z.string().url().optional(),
  figma: z.string().url().optional(),
});

export const ProjectImageSchema = z.object({
  src: z.string(),
  alt: z.string(),
  type: z.enum(["image", "video"]).optional(),
});

export const CaseStudySchema = z.object({
  problem: z.string(),
  solution: z.string(),
  outcome: z.string(),
});

export const ProjectSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(["personal", "onesignal"]),
  tags: z.array(z.string()),
  dateStart: z.string(),
  dateEnd: z.union([z.string(), z.literal("ongoing")]),
  summary: z.string(),
  status: z.enum(["shipped", "prototype", "experiment"]),
  links: ProjectLinksSchema.optional(),
  images: z.array(ProjectImageSchema),
  caseStudy: CaseStudySchema.optional(),
  featured: z.boolean().default(false),
  order: z.number().default(0),
  sourcePath: z.string().optional(),
  embedUrl: z.string().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;
export type ProjectInput = z.input<typeof ProjectSchema>;
export type ProjectImage = z.infer<typeof ProjectImageSchema>;
export type CaseStudy = z.infer<typeof CaseStudySchema>;

export interface ContentStore {
  listProjects(): Promise<Project[]>;
  getProject(slug: string): Promise<Project | null>;
  upsertProject(data: ProjectInput): Promise<Project>;
  deleteProject(slug: string): Promise<void>;
  saveImage(slug: string, filename: string, buffer: Buffer): Promise<string>;
}
