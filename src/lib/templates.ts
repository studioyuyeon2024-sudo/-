import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { TemplateMetadata } from "./types";

const templatesDir = path.join(process.cwd(), "src", "templates");

export function getTemplates(): TemplateMetadata[] {
  const files = fs.readdirSync(templatesDir).filter((f) => f.endsWith(".md"));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(templatesDir, file), "utf-8");
    const { data, content } = matter(raw);
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      defaultSteps: data.defaultSteps || [],
      content: content.trim(),
    };
  });
}

export function getTemplateById(id: string): TemplateMetadata | undefined {
  const templates = getTemplates();
  return templates.find((t) => t.id === id);
}

export function parseTemplateSteps(content: string): Record<string, string> {
  const steps: Record<string, string> = {};
  const lines = content.split("\n");
  let currentStep = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^##\s+(.+)/);
    if (headerMatch) {
      if (currentStep && currentContent.length > 0) {
        steps[currentStep] = currentContent.join("\n").trim();
      }
      currentStep = headerMatch[1].trim();
      currentContent = [];
    } else if (currentStep) {
      // 구분선 건너뛰기
      if (!line.match(/^---+$/)) {
        currentContent.push(line);
      }
    }
  }

  if (currentStep && currentContent.length > 0) {
    steps[currentStep] = currentContent.join("\n").trim();
  }

  return steps;
}

export function replaceVariables(
  text: string,
  vars: { groomName: string; brideName: string; weddingDate: string; venue: string }
): string {
  return text
    .replace(/\{\{groomName\}\}/g, vars.groomName || "OOO")
    .replace(/\{\{brideName\}\}/g, vars.brideName || "OOO")
    .replace(/\{\{weddingDate\}\}/g, vars.weddingDate || "")
    .replace(/\{\{venue\}\}/g, vars.venue || "");
}
