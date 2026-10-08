/*
  IMPORTANT:
  이 파일에 Supabase URL과 Publishable/Anon Key를 입력하세요.
  Supabase의 Publishable/Anon Key는 브라우저에 노출될 수 있습니다.
  service_role key는 절대로 여기에 넣지 마세요.
*/
window.VOTE_CONFIG = {
  SUPABASE_URL: "YOUR_SUPABASE_URL",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY",
  // 관리자 이메일 목록 (투표 제목/후보 수정 가능)
  ADMIN_EMAILS: [
    "sj10225@dge.go.kr"
  ]
};
