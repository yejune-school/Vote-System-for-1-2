# VOTE — 찬성 / 반대 / 기권

기존 후보자 투표 구조를 제거하고 다음 3가지 선택으로 변경한 버전입니다.

- 찬성
- 반대
- 기권

## 1. config.js

다음 두 값을 입력하세요.

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` 또는 Publishable Key

그리고 `ADMIN_EMAILS`에 관리자 Google 이메일을 넣으세요.

## 2. Supabase SQL

`supabase.sql` 전체를 Supabase SQL Editor에서 실행하세요.

중요:
`supabase.sql` 안의 `여기에_관리자_Google_이메일`도 실제 관리자 이메일로 바꿔야 합니다.

SQL에는 기존 투표를 초기화하는 `delete from public.votes;`가 포함되어 있습니다.

## 3. GitHub Pages

파일을 저장소 루트에 업로드하세요.

- index.html
- login.html
- result.html
- admin.html
- app.js
- result.js
- admin.js
- config.js
- style.css
- supabase.sql

## 4. 결과

로그인 → 찬성/반대/기권 중 하나 선택 → 1인 1표

결과 페이지에서는 개인의 user_id가 공개되지 않고 집계 결과만 표시됩니다.
