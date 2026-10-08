# VOTE — Google 로그인 1인 1투표

GitHub Pages + Supabase 기반 투표 웹사이트입니다.

## 1. Supabase 프로젝트 만들기

Supabase 프로젝트를 만든 뒤 SQL Editor에서 `supabase.sql`의 내용을 **전체 실행**하세요.

> 이미 프로젝트가 있다면 `supabase.sql`을 다시 실행해 주세요.  
> `vote_settings` 테이블, 관리자 RLS 정책, 결과 페이지용 votes SELECT 정책이 추가됩니다.

## 2. 후보 / 제목 관리

- **일반**: SQL로 후보를 넣어도 됩니다.
- **관리자 UI**: 관리자 이메일로 로그인 후 상단 **관리자** 링크 → 제목 변경, 후보 추가/수정/삭제

```sql
insert into public.candidates (name, description)
values
('후보 A', '첫 번째 후보입니다.'),
('후보 B', '두 번째 후보입니다.');
```

## 3. config.js 설정

`config.js`에서 다음 값을 입력하세요.

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (또는 Publishable Key)
- `ADMIN_EMAILS` — 관리자 이메일 배열

`service_role` 키는 절대 넣지 마세요.

```js
window.VOTE_CONFIG = {
  SUPABASE_URL: "https://xxxx.supabase.co",
  SUPABASE_ANON_KEY: "eyJ...",
  ADMIN_EMAILS: [
    "sj10225@dge.go.kr"
  ]
};
```

**관리자를 추가할 때** `config.js`의 `ADMIN_EMAILS`와 `supabase.sql`의 RLS 정책 안 이메일 배열을 **둘 다** 수정해야 합니다.

## 4. Google 로그인 설정

Supabase Dashboard:

Authentication → Providers → Google

Google Cloud Console에서 OAuth Client를 만들고 Client ID / Secret을 Supabase에 입력하세요.

Supabase Authentication → URL Configuration에서:

- **Site URL**: `http://localhost:3000` (로컬) 또는 GitHub Pages 주소
- **Redirect URLs**:  
  - `http://localhost:3000/**`  
  - `http://localhost:3000/index.html`  
  - `https://USERNAME.github.io/REPOSITORY/**`  
  - Supabase가 제공하는 Callback URL

OAuth 후 `#access_token=...`가 URL에 잠깐 보이더라도 앱이 자동으로 제거하고 세션을 처리합니다.

## 5. GitHub Pages

이 폴더의 파일을 GitHub repository에 업로드하고:

Settings → Pages → Deploy from a branch

에서 main 브랜치 / root를 선택하세요.

## 6. 1인 1표

`votes.user_id`에 UNIQUE 제약이 있기 때문에 같은 로그인 계정은 한 번만 투표할 수 있습니다.

RLS 정책도 함께 적용되어 있습니다.

## 관리자 기능

- 로그인 후 이메일이 `ADMIN_EMAILS`에 있으면 상단에 **관리자** 링크가 보입니다.
- `/admin.html`에서:
  - 투표 제목·설명 수정
  - 후보 추가 / 이름·설명·이미지 URL 수정 / 삭제

## 주의

결과 페이지는 현재 모든 방문자에게 득표수를 보여줍니다.

실제 학교 선거처럼 민감한 투표라면 결과 공개 시점, 익명성, 관리자 권한, 투표 종료 기능 등을 추가하는 것이 좋습니다.
