const client = supabase.createClient(
  window.VOTE_CONFIG.SUPABASE_URL,
  window.VOTE_CONFIG.SUPABASE_ANON_KEY
);

const userName = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");
const loginBtn = document.getElementById("loginBtn");
const loginNotice = document.getElementById("loginNotice");
const deniedNotice = document.getElementById("deniedNotice");
const adminPanel = document.getElementById("adminPanel");
const toast = document.getElementById("toast");
const settingTitle = document.getElementById("settingTitle");
const settingDesc = document.getElementById("settingDesc");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const newName = document.getElementById("newName");
const newDesc = document.getElementById("newDesc");
const newImage = document.getElementById("newImage");
const addCandidateBtn = document.getElementById("addCandidateBtn");
const adminCandidateList = document.getElementById("adminCandidateList");

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

function cleanAuthHash() {
  if (window.location.hash && /access_token|refresh_token|error=/.test(window.location.hash)) {
    const clean = window.location.pathname + window.location.search;
    window.history.replaceState({}, document.title, clean || "/");
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function login() {
  const redirectTo = window.location.origin + "/admin.html";
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
logoutBtn?.addEventListener("click", logout);

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
    settingTitle.value = data.title || "";
    settingDesc.value = data.description || "";
  }
}

async function saveSettings() {
  const title = settingTitle.value.trim();
  if (!title) {
    showToast("제목을 입력하세요.");
    return;
  }

  const { error } = await client
    .from("vote_settings")
    .update({
      title,
      description: settingDesc.value.trim(),
      updated_at: new Date().toISOString()
    })
    .eq("id", 1);

  if (error) {
    showToast("저장 실패: " + error.message);
    return;
  }
  showToast("제목이 저장되었습니다.");
}

saveSettingsBtn?.addEventListener("click", saveSettings);

async function loadCandidates() {
  const { data, error } = await client
    .from("candidates")
    .select("*")
    .order("id");

  if (error) {
    adminCandidateList.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
    return;
  }

  if (!data?.length) {
    adminCandidateList.innerHTML = `<div class="empty">등록된 후보가 없습니다.</div>`;
    return;
  }

  adminCandidateList.innerHTML = data.map(c => `
    <div class="admin-item" data-id="${c.id}">
      <div class="admin-item-fields">
        <label class="field">
          <span>이름</span>
          <input class="edit-name" type="text" value="${escapeHtml(c.name)}">
        </label>
        <label class="field">
          <span>설명</span>
          <textarea class="edit-desc" rows="2">${escapeHtml(c.description || "")}</textarea>
        </label>
        <label class="field">
          <span>이미지 URL</span>
          <input class="edit-image" type="url" value="${escapeHtml(c.image_url || "")}" placeholder="https://...">
        </label>
      </div>
      <div class="admin-item-actions">
        <button class="primary save-btn">저장</button>
        <button class="ghost danger delete-btn">삭제</button>
      </div>
    </div>
  `).join("");

  adminCandidateList.querySelectorAll(".admin-item").forEach(item => {
    const id = Number(item.dataset.id);
    item.querySelector(".save-btn").addEventListener("click", () => updateCandidate(id, item));
    item.querySelector(".delete-btn").addEventListener("click", () => deleteCandidate(id));
  });
}

async function updateCandidate(id, item) {
  const name = item.querySelector(".edit-name").value.trim();
  const description = item.querySelector(".edit-desc").value.trim();
  const image_url = item.querySelector(".edit-image").value.trim() || null;

  if (!name) {
    showToast("이름은 필수입니다.");
    return;
  }

  const { error } = await client
    .from("candidates")
    .update({ name, description, image_url })
    .eq("id", id);

  if (error) {
    showToast("수정 실패: " + error.message);
    return;
  }
  showToast("후보가 수정되었습니다.");
  await loadCandidates();
}

async function deleteCandidate(id) {
  if (!confirm("이 후보를 삭제하시겠습니까? 관련 투표도 함께 삭제됩니다.")) return;

  const { error } = await client
    .from("candidates")
    .delete()
    .eq("id", id);

  if (error) {
    showToast("삭제 실패: " + error.message);
    return;
  }
  showToast("후보가 삭제되었습니다.");
  await loadCandidates();
}

async function addCandidate() {
  const name = newName.value.trim();
  if (!name) {
    showToast("이름을 입력하세요.");
    return;
  }

  const { error } = await client.from("candidates").insert({
    name,
    description: newDesc.value.trim() || null,
    image_url: newImage.value.trim() || null
  });

  if (error) {
    showToast("추가 실패: " + error.message);
    return;
  }

  newName.value = "";
  newDesc.value = "";
  newImage.value = "";
  showToast("후보가 추가되었습니다.");
  await loadCandidates();
}

addCandidateBtn?.addEventListener("click", addCandidate);

async function init() {
  cleanAuthHash();

  const { data: { session } } = await client.auth.getSession();

  if (!session?.user) {
    loginNotice.classList.remove("hidden");
    deniedNotice.classList.add("hidden");
    adminPanel.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    return;
  }

  logoutBtn.classList.remove("hidden");
  userName.textContent = session.user.user_metadata?.full_name || session.user.email || "로그인됨";

  if (!isAdmin(session.user)) {
    loginNotice.classList.add("hidden");
    deniedNotice.classList.remove("hidden");
    adminPanel.classList.add("hidden");
    return;
  }

  loginNotice.classList.add("hidden");
  deniedNotice.classList.add("hidden");
  adminPanel.classList.remove("hidden");

  await loadSettings();
  await loadCandidates();
}

client.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
    cleanAuthHash();
    init();
  }
  if (event === "SIGNED_OUT") init();
});

init();
