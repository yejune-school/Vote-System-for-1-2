const client = supabase.createClient(
  window.VOTE_CONFIG.SUPABASE_URL,
  window.VOTE_CONFIG.SUPABASE_ANON_KEY
);

const userName = document.getElementById("userName");
const loginBtn = document.getElementById("loginBtn");
const loginBtn2 = document.getElementById("loginBtn2");
const logoutBtn = document.getElementById("logoutBtn");
const loginNotice = document.getElementById("loginNotice");
const voteSection = document.getElementById("voteSection");
const candidateList = document.getElementById("candidateList");
const voteStatus = document.getElementById("voteStatus");
const toast = document.getElementById("toast");
const adminLink = document.getElementById("adminLink");
const heroTitle = document.getElementById("heroTitle");
const heroDesc = document.getElementById("heroDesc");


/* =========================
   알림
========================= */

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}


/* =========================
   관리자 확인
========================= */

function isAdmin(user) {
  const email = (user?.email || "").toLowerCase();

  const admins = (window.VOTE_CONFIG.ADMIN_EMAILS || [])
    .map(e => String(e).toLowerCase());

  return admins.includes(email);
}


/* =========================
   GitHub Pages 경로 처리
========================= */

function getRedirectUrl(filename) {
  const path = window.location.pathname;

  const base = path.endsWith("/")
    ? path
    : path.replace(/\/[^/]*$/, "/");

  return window.location.origin + base + (filename || "index.html");
}


/* =========================
   OAuth 해시 제거
========================= */

function cleanAuthHash() {
  if (
    window.location.hash &&
    /access_token|refresh_token|error=/.test(window.location.hash)
  ) {
    const clean =
      window.location.pathname +
      window.location.search;

    window.history.replaceState(
      {},
      document.title,
      clean || "/"
    );
  }
}


/* =========================
   로그인
========================= */

async function login() {
  const redirectTo = getRedirectUrl("index.html");

  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo
    }
  });

  if (error) {
    showToast(error.message);
  }
}


/* =========================
   로그아웃
========================= */

async function logout() {
  await client.auth.signOut();
  location.reload();
}


/* =========================
   로그인 버튼 이벤트
========================= */

loginBtn?.addEventListener("click", login);
loginBtn2?.addEventListener("click", login);
logoutBtn?.addEventListener("click", logout);


/* =========================
   투표 설정 불러오기
========================= */

async function loadSettings() {
  const { data, error } = await client
    .from("vote_settings")
    .select("title, description")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("설정 불러오기 오류:", error);
    return;
  }

  if (data) {
    if (heroTitle) {
      heroTitle.textContent =
        data.title || "투표에 참여하세요.";
    }

    if (heroDesc) {
      heroDesc.textContent =
        data.description || "";
    }

    document.title =
      (data.title || "Vote") + " — 투표";
  }
}


/* =========================
   투표 화면
   찬성 / 반대 / 기권
========================= */

async function loadCandidates(user) {

  /*
   * 기존 candidates 테이블은 더 이상
   * 투표 선택에 사용하지 않습니다.
   *
   * votes 테이블에서 현재 사용자의
   * 투표 여부만 확인합니다.
   */

  const { data: myVote, error } = await client
    .from("votes")
    .select("choice")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("내 투표 확인 오류:", error);

    if (candidateList) {
      candidateList.innerHTML = `
        <div class="empty">
          투표 정보를 불러오지 못했습니다.<br>
          ${escapeHtml(error.message)}
        </div>
      `;
    }

    return;
  }


  /* =========================
     이미 투표한 경우
  ========================= */

  if (myVote) {

    if (voteStatus) {
      voteStatus.textContent =
        `이미 투표했습니다. 선택: ${myVote.choice} · 한 사람당 한 표만 가능합니다.`;
    }

  } else {

    if (voteStatus) {
      voteStatus.textContent =
        "찬성, 반대, 기권 중 하나를 선택해주세요.";
    }
  }


  if (!candidateList) return;

  candidateList.innerHTML = "";


  /* =========================
     투표 선택지
  ========================= */

  const choices = [
    {
      value: "찬성",
      title: "찬성",
      description: "이 안건에 찬성합니다.",
      icon: "✓"
    },
    {
      value: "반대",
      title: "반대",
      description: "이 안건에 반대합니다.",
      icon: "✕"
    },
    {
      value: "기권",
      title: "기권",
      description: "찬성과 반대 어느 쪽도 선택하지 않습니다.",
      icon: "—"
    }
  ];


  /* =========================
     버튼 생성
  ========================= */

  choices.forEach(choice => {

    const card = document.createElement("article");

    card.className = "candidate";


    const disabled = !!myVote;

    const selected =
      myVote?.choice === choice.value;


    card.innerHTML = `
      <div class="candidate-body">

        <div class="candidate-placeholder">
          ${choice.icon}
        </div>

        <h3>
          ${escapeHtml(choice.title)}
        </h3>

        <p>
          ${escapeHtml(choice.description)}
        </p>

        <button
          class="primary vote-button"
          ${disabled ? "disabled" : ""}
          data-choice="${escapeHtml(choice.value)}"
        >
          ${
            selected
              ? "내가 선택한 항목"
              : choice.title + " 선택"
          }
        </button>

      </div>
    `;


    const button =
      card.querySelector(".vote-button");


    button?.addEventListener("click", () => {
      castVote(choice.value, user);
    });


    candidateList.appendChild(card);
  });
}


/* =========================
   투표하기
========================= */

async function castVote(choice, user) {

  /* 잘못된 값 방지 */

  const allowedChoices = [
    "찬성",
    "반대",
    "기권"
  ];

  if (!allowedChoices.includes(choice)) {
    showToast("올바르지 않은 투표입니다.");
    return;
  }


  /* 최종 확인 */

  const confirmed = confirm(
    `${choice}을(를) 선택하시겠습니까?\n\n` +
    "투표 후에는 변경할 수 없습니다."
  );

  if (!confirmed) {
    return;
  }


  /* =========================
     DB에 투표 저장
  ========================= */

  const { error } = await client
    .from("votes")
    .insert({
      user_id: user.id,
      choice: choice
    });


  /* =========================
     오류 처리
  ========================= */

  if (error) {

    console.error("투표 오류:", error);


    /* 1인 1표 */

    if (error.code === "23505") {
      showToast("이미 투표했습니다.");
    }

    else {
      showToast(
        "투표에 실패했습니다: " +
        error.message
      );
    }


    await loadCandidates(user);

    return;
  }


  /* =========================
     성공
  ========================= */

  showToast(
    `${choice} 투표가 완료되었습니다.`
  );


  await loadCandidates(user);
}


/* =========================
   HTML 이스케이프
========================= */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================
   초기화
========================= */

async function init() {

  cleanAuthHash();

  await loadSettings();


  /* 현재 로그인 세션 */

  const {
    data: { session }
  } = await client.auth.getSession();


  /* =========================
     로그인하지 않은 경우
  ========================= */

  if (!session?.user) {

    loginNotice?.classList.remove("hidden");

    voteSection?.classList.add("hidden");

    loginBtn?.classList.remove("hidden");

    logoutBtn?.classList.add("hidden");

    adminLink?.classList.add("hidden");

    return;
  }


  /* =========================
     로그인한 경우
  ========================= */

  loginNotice?.classList.add("hidden");

  voteSection?.classList.remove("hidden");

  loginBtn?.classList.add("hidden");

  logoutBtn?.classList.remove("hidden");


  const user = session.user;


  if (userName) {
    userName.textContent =
      user.user_metadata?.full_name ||
      user.email ||
      "로그인됨";
  }


  /* 관리자 링크 */

  if (adminLink) {
    adminLink.classList.toggle(
      "hidden",
      !isAdmin(user)
    );
  }


  /* 투표 화면 */

  await loadCandidates(user);
}


/* =========================
   Supabase 인증 상태 감시
========================= */

client.auth.onAuthStateChange(
  (event, session) => {

    if (
      event === "SIGNED_IN" ||
      event === "TOKEN_REFRESHED" ||
      event === "INITIAL_SESSION"
    ) {

      cleanAuthHash();

      if (session) {
        init();
      }
    }


    if (event === "SIGNED_OUT") {
      init();
    }
  }
);


/* =========================
   시작
========================= */

init();
