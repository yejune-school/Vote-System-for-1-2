const client = supabase.createClient(
  window.VOTE_CONFIG.SUPABASE_URL,
  window.VOTE_CONFIG.SUPABASE_ANON_KEY
);

const $ = (id) => document.getElementById(id);

function showToast(message) {
  const toast = $("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2800);
}

function isAdmin(user) {
  const email = (user?.email || "").toLowerCase();
  return (window.VOTE_CONFIG.ADMIN_EMAILS || [])
    .map(e => String(e).trim().toLowerCase())
    .includes(email);
}

function getRedirectUrl(filename = "index.html") {
  const path = window.location.pathname;
  const base = path.endsWith("/") ? path : path.replace(/\/[^/]*$/, "/");
  return window.location.origin + base + filename;
}

function cleanAuthHash() {
  if (window.location.hash && /access_token|refresh_token|error=/.test(window.location.hash)) {
    window.history.replaceState({}, document.title,
      window.location.pathname + window.location.search || "/");
  }
}

async function login() {
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: getRedirectUrl("index.html") }
  });
  if (error) showToast(error.message);
}

async function logout() {
  await client.auth.signOut();
  location.reload();
}

$("loginBtn")?.addEventListener("click", login);
$("loginBtn2")?.addEventListener("click", login);
$("logoutBtn")?.addEventListener("click", logout);

async function loadSettings() {
  const { data, error } = await client
    .from("vote_settings")
    .select("title, description")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error(error);
    return;
  }

  if (data) {
    if ($("heroTitle")) $("heroTitle").textContent = data.title || "투표에 참여하세요.";
    if ($("heroDesc")) $("heroDesc").textContent = data.description || "";
    document.title = (data.title || "Vote") + " — 투표";
  }
}

async function loadVote(user) {
  const list = $("candidateList");
  if (!list) return;

  const { data: myVote, error } = await client
    .from("votes")
    .select("choice")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    list.innerHTML = `<div class="empty">투표 정보를 불러오지 못했습니다.<br>${escapeHtml(error.message)}</div>`;
    return;
  }

  $("voteStatus").textContent = myVote
    ? `이미 투표했습니다. 선택: ${myVote.choice} · 한 사람당 한 표만 가능합니다.`
    : "찬성, 반대, 기권 중 하나를 선택해주세요.";

  const choices = [
    { value: "찬성", icon: "✓", description: "이 안건에 찬성합니다." },
    { value: "반대", icon: "×", description: "이 안건에 반대합니다." },
    { value: "기권", icon: "—", description: "찬성과 반대 어느 쪽도 선택하지 않습니다." }
  ];

  list.innerHTML = "";

  choices.forEach(choice => {
    const card = document.createElement("article");
    card.className = "choice-card";
    const selected = myVote?.choice === choice.value;
    const disabled = Boolean(myVote);

    card.innerHTML = `
      <div class="choice-icon">${choice.icon}</div>
      <h3>${choice.value}</h3>
      <p>${choice.description}</p>
      <button class="primary vote-button" ${disabled ? "disabled" : ""}>
        ${selected ? "내가 선택한 항목" : choice.value + " 선택"}
      </button>
    `;

    card.querySelector(".vote-button").addEventListener("click", () => castVote(choice.value, user));
    list.appendChild(card);
  });
}

async function castVote(choice, user) {
  if (!["찬성", "반대", "기권"].includes(choice)) return;

  if (!confirm(`${choice}을(를) 선택하시겠습니까?\n\n투표 후에는 변경할 수 없습니다.`)) return;

  const { error } = await client.from("votes").insert({
    user_id: user.id,
    choice
  });

  if (error) {
    showToast(error.code === "23505" ? "이미 투표했습니다." : "투표 실패: " + error.message);
    await loadVote(user);
    return;
  }

  showToast(`${choice} 투표가 완료되었습니다.`);
  await loadVote(user);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function init() {
  cleanAuthHash();
  await loadSettings();

  const { data: { session } } = await client.auth.getSession();

  if (!session?.user) {
    $("loginNotice")?.classList.remove("hidden");
    $("voteSection")?.classList.add("hidden");
    $("loginBtn")?.classList.remove("hidden");
    $("logoutBtn")?.classList.add("hidden");
    $("adminLink")?.classList.add("hidden");
    return;
  }

  $("loginNotice")?.classList.add("hidden");
  $("voteSection")?.classList.remove("hidden");
  $("loginBtn")?.classList.add("hidden");
  $("logoutBtn")?.classList.remove("hidden");

  const user = session.user;
  if ($("userName")) $("userName").textContent =
    user.user_metadata?.full_name || user.email || "로그인됨";

  if ($("adminLink")) $("adminLink").classList.toggle("hidden", !isAdmin(user));

  await loadVote(user);
}

client.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
    if (session) init();
  }
  if (event === "SIGNED_OUT") init();
});

init();
