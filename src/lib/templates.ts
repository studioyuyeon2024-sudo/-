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
