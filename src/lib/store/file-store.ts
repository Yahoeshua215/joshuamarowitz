import fs from "fs/promises";
import path from "path";
import {
  Project,
  ProjectInput,
  ProjectSchema,
  ContentStore,
} from "./types";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content", "projects");
const PUBLIC_DIR = path.join(ROOT, "public", "projects");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function projectDir(slug: string) {
  return path.join(CONTENT_DIR, slug);
}

function entryPath(slug: string) {
  return path.join(projectDir(slug), "entry.json");
}

function caseStudyPath(slug: string) {
  return path.join(projectDir(slug), "case-study.md");
}

export class FileContentStore implements ContentStore {
  async listProjects(): Promise<Project[]> {
    try {
      const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
      const projects: Project[] = [];

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const project = await this.getProject(entry.name);
        if (project) projects.push(project);
      }

      return projects.sort((a, b) => {
        const dateA = new Date(a.dateStart).getTime();
        const dateB = new Date(b.dateStart).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return b.order - a.order;
      });
    } catch {
      return [];
    }
  }

  async getProject(slug: string): Promise<Project | null> {
    try {
      const raw = await fs.readFile(entryPath(slug), "utf-8");
      const parsed = ProjectSchema.parse(JSON.parse(raw));

      try {
        const mdx = await fs.readFile(caseStudyPath(slug), "utf-8");
        if (!parsed.caseStudy && mdx.trim()) {
          parsed.caseStudy = parseCaseStudyMarkdown(mdx);
        }
      } catch {
        // optional case-study.md
      }

      return parsed;
    } catch {
      return null;
    }
  }

  async upsertProject(data: ProjectInput): Promise<Project> {
    const project = ProjectSchema.parse(data);
    const dir = projectDir(project.slug);
    await ensureDir(dir);

    const { caseStudy, ...entry } = project;
    await fs.writeFile(
      entryPath(project.slug),
      JSON.stringify(entry, null, 2),
      "utf-8"
    );

    if (caseStudy) {
      await fs.writeFile(
        caseStudyPath(project.slug),
        formatCaseStudyMarkdown(caseStudy),
        "utf-8"
      );
    }

    return project;
  }

  async deleteProject(slug: string): Promise<void> {
    await fs.rm(projectDir(slug), { recursive: true, force: true });
    await fs.rm(path.join(PUBLIC_DIR, slug), { recursive: true, force: true });
  }

  async saveImage(
    slug: string,
    filename: string,
    buffer: Buffer
  ): Promise<string> {
    const dir = path.join(PUBLIC_DIR, slug);
    await ensureDir(dir);
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
    const filePath = path.join(dir, safeName);
    await fs.writeFile(filePath, buffer);
    return `/projects/${slug}/${safeName}`;
  }
}

function parseCaseStudyMarkdown(mdx: string) {
  const sections = {
    problem: "",
    solution: "",
    outcome: "",
  };

  const problemMatch = mdx.match(
    /## Problem\s*\n([\s\S]*?)(?=\n## |\n*$)/
  );
  const solutionMatch = mdx.match(
    /## Solution\s*\n([\s\S]*?)(?=\n## |\n*$)/
  );
  const outcomeMatch = mdx.match(
    /## Outcome\s*\n([\s\S]*?)(?=\n## |\n*$)/
  );

  if (problemMatch) sections.problem = problemMatch[1].trim();
  if (solutionMatch) sections.solution = solutionMatch[1].trim();
  if (outcomeMatch) sections.outcome = outcomeMatch[1].trim();

  return sections;
}

function formatCaseStudyMarkdown(caseStudy: {
  problem: string;
  solution: string;
  outcome: string;
}) {
  return `## Problem\n\n${caseStudy.problem}\n\n## Solution\n\n${caseStudy.solution}\n\n## Outcome\n\n${caseStudy.outcome}\n`;
}
