"use client";

import { CeremonyStep } from "@/lib/types";
import { useState } from "react";

const PRESET_STEPS = [
  "개식선언",
  "신랑입장",
  "신부입장",
  "신부 인도",
  "성혼 선서",
  "성혼 선언",
  "주례사",
  "축가",
  "축하 영상",
  "양가 부모님께 인사",
  "내빈께 인사",
  "반지 교환",
  "기도",
  "찬송가",
  "폐식 선언",
];

interface Props {
  steps: CeremonyStep[];
  onChange: (steps: CeremonyStep[]) => void;
}

export default function CeremonyOrderInput({ steps, onChange }: Props) {
  const [customStep, setCustomStep] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const addStep = (name: string) => {
    const newStep: CeremonyStep = {
      id: crypto.randomUUID(),
      name,
      notes: "",
    };
    onChange([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    onChange(steps.filter((s) => s.id !== id));
  };

  const updateNotes = (id: string, notes: string) => {
    onChange(steps.map((s) => (s.id === id ? { ...s, notes } : s)));
  };

  const moveStep = (from: number, to: number) => {
    const newSteps = [...steps];
    const [moved] = newSteps.splice(from, 1);
    newSteps.splice(to, 0, moved);
    onChange(newSteps);
  };

  const addCustomStep = () => {
    if (customStep.trim()) {
      addStep(customStep.trim());
      setCustomStep("");
    }
  };

  const availablePresets = PRESET_STEPS.filter(
    (p) => !steps.some((s) => s.name === p)
  );

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-700">
        식순 (진행 순서)
      </label>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {availablePresets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => addStep(preset)}
            className="px-3 py-1.5 text-sm bg-rose-50 text-rose-700 rounded-full border border-rose-200 hover:bg-rose-100 transition-colors"
          >
            + {preset}
          </button>
        ))}
      </div>

      {/* Custom step input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customStep}
          onChange={(e) => setCustomStep(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomStep())}
          placeholder="직접 식순 입력..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none"
        />
        <button
          type="button"
          onClick={addCustomStep}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700 transition-colors"
        >
          추가
        </button>
      </div>

      {/* Ordered step list */}
      {steps.length > 0 && (
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== index) {
                  moveStep(dragIndex, index);
                }
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`border rounded-lg p-3 bg-white transition-all ${
                dragIndex === index
                  ? "opacity-50 border-rose-400"
                  : "border-gray-200 hover:border-rose-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="cursor-grab text-gray-400 hover:text-gray-600">
                  &#x2630;
                </span>
                <span className="text-sm font-medium text-rose-800 bg-rose-50 px-2 py-0.5 rounded">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-800">
                  {step.name}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveStep(index, Math.max(0, index - 1))}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="위로"
                  >
                    &#9650;
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      moveStep(index, Math.min(steps.length - 1, index + 1))
                    }
                    disabled={index === steps.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="아래로"
                  >
                    &#9660;
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStep(step.id)}
                    className="p-1 text-red-400 hover:text-red-600"
                    title="삭제"
                  >
                    &#10005;
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={step.notes}
                onChange={(e) => updateNotes(step.id, e.target.value)}
                placeholder="메모 (예: 아버지와 함께 입장, 축가 가수명 등)"
                className="mt-2 w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-rose-300 focus:border-rose-300 outline-none"
              />
            </div>
          ))}
        </div>
      )}

      {steps.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          위 버튼을 클릭하여 식순을 추가해 주세요
        </p>
      )}
    </div>
  );
}
