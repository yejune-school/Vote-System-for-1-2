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

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2800);
}

function isAdmin(user) {
  const email = (user?.email || "").toLowerCase();
  const admins = (window.VOTE_CONFIG.ADMIN_EMAILS || []).map(e => e.toLowerCase());
  return admins.includes(email);
}

/** GitHub Pages 하위 경로 지원 (예: /Vote-System-for-1-2/) */
function getRedirectUrl(filename) {
  const path = window.location.pathname;
  const base = path.endsWith("/")
    ? path
    : path.replace(/\/[^/]*$/, "/");
  return window.location.origin + base + (filename || "index.html");
}

/** OAuth 후 URL에 남는 #access_token=... 해시 제거 */
function cleanAuthHash() {
  if (window.location.hash && /access_token|refresh_token|error=/.test(window.location.hash)) {
    const clean = window.location.pathname + window.location.search;
    window.history.replaceState({}, document.title, clean || "/");
  }
}

async function login() {
  const redirectTo = getRedirectUrl("index.html");
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo }
  });
  if (error) showToast(error.message);
}

async function logout() {
  await client.auth.signOut();
  location.reload();
}

loginBtn?.addEventListener("click", login);
loginBtn2?.addEventListener("click", login);
logoutBtn?.addEventListener("click", logout);

async function loadSettings() {
  const { data } = await client
    .from("vote_settings")
    .select("title, description")
    .eq("id", 1)
    .maybeSingle();

  if (data) {
    if (heroTitle) heroTitle.textContent = data.title || "투표에 참여하세요.";
    if (heroDesc) heroDesc.textContent = data.description || "";
    document.title = (data.title || "Vote") + " — 투표";
  }
}

async function loadCandidates(user) {
  const { data: candidates, error } = await client
    .from("candidates")
    .select("*")
    .order("id");

  if (error) {
    candidateList.innerHTML = `<div class="empty">후보를 불러오지 못했습니다.<br>${escapeHtml(error.message)}</div>`;
    return;
  }

  const { data: myVote } = await client
    .from("votes")
    .select("candidate_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (myVote) {
    voteStatus.textContent = "이미 투표했습니다. 한 사람당 한 표만 가능합니다.";
  } else {
    voteStatus.textContent = "한 사람당 한 표입니다.";
  }

  candidateList.innerHTML = "";

  if (!candidates?.length) {
    candidateList.innerHTML = `<div class="empty">등록된 후보가 없습니다.</div>`;
    return;
  }

  candidates.forEach(candidate => {
    const card = document.createElement("article");
    card.className = "candidate";

    const image = candidate.image_url
      ? `<img src="${escapeHtml(candidate.image_url)}" alt="">`
      : `<div class="candidate-placeholder">V</div>`;

    const disabled = !!myVote;

    card.innerHTML = `
      ${image}
      <div class="candidate-body">
        <h3>${escapeHtml(candidate.name)}</h3>
        <p>${escapeHtml(candidate.description || "")}</p>
        <button class="primary vote-button" ${disabled ? "disabled" : ""}
          data-id="${candidate.id}">
          ${myVote?.candidate_id === candidate.id ? "내가 선택한 항목" : "이 항목에 투표"}
        </button>
      </div>
    `;

    card.querySelector(".vote-button").addEventListener("click", () => castVote(candidate.id, user));
    candidateList.appendChild(card);
  });
}

async function castVote(candidateId, user) {
  if (!confirm("이 항목에 투표하시겠습니까? 투표 후 변경할 수 없습니다.")) return;

  const { error } = await client.from("votes").insert({
    user_id: user.id,
    candidate_id: candidateId
  });

  if (error) {
    if (error.code === "23505") {
      showToast("이미 투표했습니다.");
    } else {
      showToast("투표에 실패했습니다: " + error.message);
    }
    await loadCandidates(user);
    return;
  }

  showToast("투표가 완료되었습니다.");
  await loadCandidates(user);
}

function escapeHtml(value) {
  return String(value)
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
    loginNotice?.classList.remove("hidden");
    voteSection?.classList.add("hidden");
    loginBtn?.classList.remove("hidden");
    logoutBtn?.classList.add("hidden");
    adminLink?.classList.add("hidden");
    return;
  }

  loginNotice?.classList.add("hidden");
  voteSection?.classList.remove("hidden");
  loginBtn?.classList.add("hidden");
  logoutBtn?.classList.remove("hidden");

  const user = session.user;
  userName.textContent = user.user_metadata?.full_name || user.email || "로그인됨";

  if (adminLink) {
    adminLink.classList.toggle("hidden", !isAdmin(user));
  }

  await loadCandidates(user);
}

client.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
    cleanAuthHash();
    if (session) init();
  }
  if (event === "SIGNED_OUT") init();
});

init();
