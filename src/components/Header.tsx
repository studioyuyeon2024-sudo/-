"use client";

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-200">
      <div className="max-w-7xl mx-auto px-4 py-5">
        <h1 className="text-2xl font-bold text-rose-900 tracking-tight">
          Wedding MC Script Generator
        </h1>
        <p className="text-sm text-rose-600 mt-1">
          식순과 특이사항을 입력하면 맞춤형 사회 대본을 자동으로 생성합니다
        </p>
      </div>
    </header>
  );
}
