import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CaseStudySchema } from "@/lib/store/types";
import { z } from "zod";

type CaseStudyData = z.infer<typeof CaseStudySchema>;

export function CaseStudy({ caseStudy }: { caseStudy: CaseStudyData }) {
  const markdown = `## Problem\n\n${caseStudy.problem}\n\n## Solution\n\n${caseStudy.solution}\n\n## Outcome\n\n${caseStudy.outcome}`;

  return (
    <div className="prose-case rounded-lg border border-border bg-surface p-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
