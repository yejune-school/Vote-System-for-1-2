const supabaseClient = supabase.createClient(
  window.VOTE_CONFIG.SUPABASE_URL,
  window.VOTE_CONFIG.SUPABASE_ANON_KEY
);

const $ = (id) => document.getElementById(id);

function toast(message) {
  const el = $("toast");

  if (!el) {
    alert(message);
    return;
  }

  el.textContent = message;
  el.classList.add("show");

  setTimeout(() => {
    el.classList.remove("show");
  }, 2500);
}

function isAdmin(user) {
  const email = (user?.email || "").toLowerCase();

  return (window.VOTE_CONFIG.ADMIN_EMAILS || [])
    .map(x => x.toLowerCase())
    .includes(email);
}

function getRedirectUrl() {
  return window.location.origin +
    window.location.pathname.replace(/[^/]*$/, "");
}

async function login(provider) {
  const { error } =
    await supabaseClient.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getRedirectUrl()
      }
    });

  if (error) {
    toast("로그인 실패: " + error.message);
  }
}

async function logout() {
  await supabaseClient.auth.signOut();
  location.href = "login.html";
}

async function getUser() {
  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  return session?.user || null;
}

async function loadVote() {
  const user = await getUser();

  if (!user) {
    location.href = "login.html";
    return;
  }

  $("userName").textContent =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    "로그인됨";

  if (isAdmin(user)) {
    $("adminButton")?.classList.remove("hidden");
  }

  const { data, error } =
    await supabaseClient
      .from("votes")
      .select("choice")
      .eq("user_id", user.id)
      .maybeSingle();

  if (error) {
    toast("투표 상태를 불러오지 못했습니다.");
    console.error(error);
    return;
  }

  if (data) {
    $("status").textContent =
      `이미 투표했습니다: ${data.choice}`;

    document
      .querySelectorAll(".vote-button")
      .forEach(button => {
        button.disabled = true;

        if (button.dataset.choice === data.choice) {
          button.textContent = "내가 선택한 항목";
        } else {
          button.textContent = "투표 완료";
        }
      });

    return;
  }

  $("status").textContent =
    "찬성, 반대, 기권 중 하나를 선택하세요.";
}

async function vote(choice) {
  const user = await getUser();

  if (!user) {
    location.href = "login.html";
    return;
  }

  const ok = confirm(
    `${choice}에 투표하시겠습니까?\n\n투표 후 변경할 수 없습니다.`
  );

  if (!ok) return;

  const { error } =
    await supabaseClient
      .from("votes")
      .insert({
        user_id: user.id,
        choice: choice
      });

  if (error) {
    if (error.code === "23505") {
      toast("이미 투표했습니다.");
    } else {
      toast("투표 실패: " + error.message);
    }

    await loadVote();
    return;
  }

  toast("투표가 완료되었습니다.");

  await loadVote();
}

async function showResult() {
  const user = await getUser();

  if (!user || !isAdmin(user)) {
    toast("관리자만 볼 수 있습니다.");
    return;
  }

  const { data, error } =
    await supabaseClient.rpc("get_vote_results");

  if (error) {
    toast("결과를 불러오지 못했습니다.");
    console.error(error);
    return;
  }

  const counts = {
    "찬성": 0,
    "반대": 0,
    "기권": 0
  };

  (data || []).forEach(row => {
    counts[row.choice] = Number(row.count);
  });

  const total =
    counts["찬성"] +
    counts["반대"] +
    counts["기권"];

  $("result").innerHTML = `
    <h2>투표 결과</h2>

    <div class="result-row">
      <span>찬성</span>
      <strong>${counts["찬성"]}</strong>
    </div>

    <div class="result-row">
      <span>반대</span>
      <strong>${counts["반대"]}</strong>
    </div>

    <div class="result-row">
      <span>기권</span>
      <strong>${counts["기권"]}</strong>
    </div>

    <p>총 투표자: ${total}명</p>
  `;

  $("result").classList.remove("hidden");
}

async function resetVotes() {
  const user = await getUser();

  if (!user || !isAdmin(user)) {
    toast("관리자만 초기화할 수 있습니다.");
    return;
  }

  const ok = confirm(
    "모든 투표를 삭제하고 초기화하시겠습니까?"
  );

  if (!ok) return;

  const { error } =
    await supabaseClient.rpc("reset_votes");

  if (error) {
    toast("초기화 실패: " + error.message);
    return;
  }

  toast("투표가 초기화되었습니다.");

  await loadVote();
}


// 로그인 페이지
if ($("googleLogin")) {
  $("googleLogin").onclick = () => login("google");
}

if ($("kakaoLogin")) {
  $("kakaoLogin").onclick = () => login("kakao");
}


// 메인 페이지
if ($("logoutButton")) {
  $("logoutButton").onclick = logout;
}

document
  .querySelectorAll(".vote-button")
  .forEach(button => {
    button.addEventListener("click", () => {
      vote(button.dataset.choice);
    });
  });

$("resultButton")?.addEventListener(
  "click",
  showResult
);

$("resetButton")?.addEventListener(
  "click",
  resetVotes
);


// 인증 상태 확인
if (
  location.pathname.endsWith("/") ||
  location.pathname.endsWith("index.html")
) {
  loadVote();
}
