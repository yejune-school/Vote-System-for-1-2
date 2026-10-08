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

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2800);
}

async function login() {
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/index.html"
    }
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

async function loadCandidates(user) {
  const { data: candidates, error } = await client
    .from("candidates")
    .select("*")
    .order("id");

  if (error) {
    candidateList.innerHTML = `<div class="empty">후보를 불러오지 못했습니다.<br>${error.message}</div>`;
    return;
  }

  const { data: myVote } = await client
    .from("votes")
    .select("candidate_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (myVote) {
    voteStatus.textContent = "이미 투표했습니다. 한 사람당 한 표만 가능합니다.";
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
  const { data: { session } } = await client.auth.getSession();

  if (!session?.user) {
    loginNotice.classList.remove("hidden");
    voteSection.classList.add("hidden");
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    return;
  }

  loginNotice.classList.add("hidden");
  voteSection.classList.remove("hidden");
  loginBtn.classList.add("hidden");
  logoutBtn.classList.remove("hidden");

  const user = session.user;
  userName.textContent = user.user_metadata?.full_name || user.email || "로그인됨";

  await loadCandidates(user);
}

client.auth.onAuthStateChange((_event, session) => {
  if (session) init();
});

init();
