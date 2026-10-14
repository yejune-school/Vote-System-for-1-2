# 1-2 VOTE

1-2 부반장 최지혁 탄핵 투표 시스템.

## 포함 기능
- Google 로그인
- Kakao 로그인
- 찬성 / 반대 / 기권
- 1인 1표
- 관리자 대시보드
- 제목/설명 수정
- 투표 열기/닫기
- 결과 확인
- 투표 초기화

## 설치
1. config.js의 SUPABASE_ANON_KEY를 실제 Publishable Key로 교체합니다.
2. supabase.sql을 Supabase SQL Editor에서 실행합니다.
3. Supabase Authentication에서 Google/Kakao Provider를 활성화합니다.
4. Google/Kakao callback URL은:
   https://cdveejymrjdbchxkjfew.supabase.co/auth/v1/callback
5. Supabase URL Configuration의 Redirect URL에 GitHub Pages 주소를 추가합니다.
