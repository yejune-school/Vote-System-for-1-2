const client = supabase.createClient(
  window.VOTE_CONFIG.SUPABASE_URL,
  window.VOTE_CONFIG.SUPABASE_ANON_KEY
);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadSettings() {
  const { data } = await client
    .from("vote_settings")
    .select("title")
    .eq("id", 1)
    .maybeSingle();

  if (data?.title) {
    const h1 = document.querySelector(".hero h1");
    if (h1) h1.textContent = data.title + " 결과";
    document.title = data.title + " — 투표 결과";
  }
}

async function loadResults() {
  const resultList = document.getElementById("resultList");
  const message = document.getElementById("resultMessage");

  await loadSettings();

  const { data: candidates, error: candidateError } = await client
    .from("candidates")
    .select("*")
    .order("id");

  if (candidateError) {
    message.textContent = candidateError.message;
    return;
  }

  const { data: votes, error: voteError } = await client
    .from("votes")
    .select("candidate_id");

  if (voteError) {
    message.textContent = voteError.message;
    return;
  }

  const counts = {};
  (votes || []).forEach(v => {
    counts[v.candidate_id] = (counts[v.candidate_id] || 0) + 1;
  });

  const total = (votes || []).length;

  if (!candidates?.length) {
    resultList.innerHTML = '<div class="empty">등록된 후보가 없습니다.</div>';
    return;
  }

  const sorted = [...candidates].sort(
    (a, b) => (counts[b.id] || 0) - (counts[a.id] || 0)
  );

  resultList.innerHTML = sorted.map((candidate, index) => {
    const count = counts[candidate.id] || 0;
    const percent = total ? Math.round((count / total) * 100) : 0;

    return `
      <div class="result-row">
        <div class="result-top">
          <strong>${index + 1}. ${escapeHtml(candidate.name)}</strong>
          <span>${count}표 · ${percent}%</span>
        </div>
        <div class="bar">
          <div class="bar-fill" style="width:${percent}%"></div>
        </div>
      </div>
    `;
  }).join("");

  message.textContent = `총 ${total}표`;
}

loadResults();
