-- 스타일 프로필 테이블
-- 24개 샘플 대본에서 추출한 스타일 요약을 저장
-- 매 대본 생성 시 원문 대신 이 프로필만 전송 (비용 99% 절감)

CREATE TABLE IF NOT EXISTS style_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile TEXT NOT NULL,
  sample_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 비활성화 (1인 사용)
ALTER TABLE style_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON style_profiles FOR ALL USING (true) WITH CHECK (true);
