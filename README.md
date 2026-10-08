# VOTE — Google 로그인 1인 1투표

GitHub Pages + Supabase 기반 투표 웹사이트입니다.

## 1. Supabase 프로젝트 만들기

Supabase 프로젝트를 만든 뒤 SQL Editor에서 `supabase.sql`의 내용을 실행하세요.

## 2. 후보 추가

SQL Editor에서 예:

```sql
insert into public.candidates (name, description)
values
('후보 A', '첫 번째 후보입니다.'),
('후보 B', '두 번째 후보입니다.'),
('후보 C', '세 번째 후보입니다.');
```

## 3. config.js 설정

`config.js`에서 다음 두 값을 입력하세요.

- SUPABASE_URL
- SUPABASE_ANON_KEY 또는 Publishable Key

`service_role` 키는 절대 넣지 마세요.

## 4. Google 로그인 설정

Supabase Dashboard:

Authentication → Providers → Google

Google Cloud Console에서 OAuth Client를 만들고 Client ID / Secret을 Supabase에 입력하세요.

Supabase Authentication → URL Configuration에서 GitHub Pages 주소를 Site URL / Redirect URL에 맞게 등록하세요.

예:

https://USERNAME.github.io/REPOSITORY/

그리고 OAuth Redirect URL에는 Supabase가 제공하는 Callback URL을 등록하세요.

## 5. GitHub Pages

이 폴더의 파일을 GitHub repository에 업로드하고:

Settings → Pages → Deploy from a branch

에서 main 브랜치 / root를 선택하세요.

## 6. 1인 1표

`votes.user_id`에 UNIQUE 제약이 있기 때문에 같은 로그인 계정은 한 번만 투표할 수 있습니다.

RLS 정책도 함께 적용되어 있습니다.

## 주의

결과 페이지는 현재 모든 방문자에게 득표수를 보여줍니다.

실제 학교 선거처럼 민감한 투표라면 결과 공개 시점, 익명성, 관리자 권한, 투표 종료 기능 등을 추가하는 것이 좋습니다.
