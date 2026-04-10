"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function SpecialNotesInput({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        특이사항
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`예시:\n- 신랑 직업: 의사, 신부 직업: 교사\n- 두 분은 대학 동기로 만남\n- 축가: 김민수 (곡: 너를 위해)\n- 하객 약 200명 예상\n- 특별 이벤트: 깜짝 프러포즈 영상 상영`}
        rows={5}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none resize-vertical"
      />
    </div>
  );
}
