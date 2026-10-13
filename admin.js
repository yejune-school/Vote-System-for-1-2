const client = supabase.createClient(
  window.VOTE_CONFIG.SUPABASE_URL,
  window.VOTE_CONFIG.SUPABASE_ANON_KEY
);

const $ = id => document.getElementById(id);

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

function getRedirectUrl(filename = "admin.html") {
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
    options: { redirectTo: getRedirectUrl("admin.html") }
  });
  if (error) showToast(error.message);
}

async function logout() {
  await client.auth.signOut();
  location.reload();
}

$("loginBtn")?.addEventListener("click", login);
$("logoutBtn")?.addEventListener("click", logout);

async function loadSettings() {
  const { data, error } = await client
    .from("vote_settings")
    .select("title, description")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    showToast("설정을 불러오지 못했습니다: " + error.message);
    return;
  }

  if (data) {
    $("settingTitle").value = data.title || "";
    $("settingDesc").value = data.description || "";
  }
}

async function saveSettings() {
  const title = $("settingTitle").value.trim();
  if (!title) {
    showToast("제목을 입력하세요.");
    return;
  }

  const { error } = await client
    .from("vote_settings")
    .update({
      title,
      description: $("settingDesc").value.trim(),
      updated_at: new Date().toISOString()
    })
    .eq("id", 1);

  if (error) {
    showToast("저장 실패: " + error.message);
    return;
  }

  showToast("투표 설정이 저장되었습니다.");
}

async function loadCounts() {
  const { data, error } = await client.rpc("get_vote_results");

  if (error) {
    $("adminResults").textContent = "결과 불러오기 실패: " + error.message;
    return;
  }

  const counts = Object.fromEntries((data || []).map(row => [row.choice, Number(row.vote_count)]));
  $("adminResults").innerHTML = `
    <div class="admin-counts">
      <div><strong>찬성</strong><span>${counts["찬성"] || 0}표</span></div>
      <div><strong>반대</strong><span>${counts["반대"] || 0}표</span></div>
      <div><strong>기권</strong><span>${counts["기권"] || 0}표</span></div>
    </div>
  `;
}

async function resetVotes() {
  if (!confirm("모든 투표를 초기화할까요?\n이 작업은 되돌릴 수 없습니다.")) return;

  const { error } = await client.rpc("reset_votes");

  if (error) {
    showToast("초기화 실패: " + error.message);
    return;
  }

  showToast("모든 투표가 초기화되었습니다.");
  await loadCounts();
}

$("saveSettingsBtn")?.addEventListener("click", saveSettings);
$("resetVotesBtn")?.addEventListener("click", resetVotes);

async function init() {
  cleanAuthHash();

  const { data: { session } } = await client.auth.getSession();

  if (!session?.user) {
    $("loginNotice")?.classList.remove("hidden");
    $("deniedNotice")?.classList.add("hidden");
    $("adminPanel")?.classList.add("hidden");
    $("logoutBtn")?.classList.add("hidden");
    return;
  }

  $("logoutBtn")?.classList.remove("hidden");
  $("userName").textContent =
    session.user.user_metadata?.full_name || session.user.email || "로그인됨";

  if (!isAdmin(session.user)) {
    $("loginNotice")?.classList.add("hidden");
    $("deniedNotice")?.classList.remove("hidden");
    $("adminPanel")?.classList.add("hidden");
    return;
  }

  $("loginNotice")?.classList.add("hidden");
  $("deniedNotice")?.classList.add("hidden");
  $("adminPanel")?.classList.remove("hidden");

  await loadSettings();
  await loadCounts();
}

client.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") init();
  if (event === "SIGNED_OUT") init();
});

init();
