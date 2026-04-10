"use client";

import { TemplateMetadata } from "@/lib/types";

interface Props {
  templates: TemplateMetadata[];
  selectedId: string;
  onChange: (id: string) => void;
}

export default function TemplateSelector({
  templates,
  selectedId,
  onChange,
}: Props) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        대본 템플릿
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onChange(template.id)}
            className={`text-left p-4 rounded-lg border-2 transition-all ${
              selectedId === template.id
                ? "border-rose-500 bg-rose-50 ring-1 ring-rose-300"
                : "border-gray-200 bg-white hover:border-rose-300"
            }`}
          >
            <div className="text-sm font-semibold text-gray-800">
              {template.name}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {template.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
