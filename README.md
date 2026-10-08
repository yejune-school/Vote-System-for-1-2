# VOTE — Google 로그인 1인 1투표

## GitHub Pages에서 Google 로그인이 안 될 때 (필수 설정)

### 1. config.js 문법
`SUPABASE_ANON_KEY` 뒤에 **쉼표(,)** 가 있어야 합니다.

### 2. Supabase → Authentication → URL Configuration

**Site URL**
```
https://yejune-school.github.io/Vote-System-for-1-2
```

**Redirect URLs** (한 줄씩 추가)
```
https://yejune-school.github.io/Vote-System-for-1-2/**
https://yejune-school.github.io/Vote-System-for-1-2/
https://yejune-school.github.io/Vote-System-for-1-2/index.html
https://yejune-school.github.io/Vote-System-for-1-2/admin.html
http://localhost:3000/**
http://localhost:3000/index.html
```

### 3. Google Cloud Console → OAuth 클라이언트

**승인된 JavaScript 원본**
```
https://yejune-school.github.io
http://localhost:3000
```

**승인된 리디렉션 URI** (Supabase 콜백 — 앱 주소가 아님!)
```
https://cdveejymrjdbchxkjfew.supabase.co/auth/v1/callback
```

### 4. Supabase → Authentication → Providers → Google
Client ID / Client Secret을 Google Cloud에서 복사해 넣고 활성화.

### 5. SQL
`supabase.sql` 전체 실행.

관리자: `sj10225@dge.go.kr`
