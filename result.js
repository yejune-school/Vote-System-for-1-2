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

async function loadResults() {
  const resultList = document.getElementById("resultList");
  const message = document.getElementById("resultMessage");

  const { data: settings } = await client
    .from("vote_settings")
    .select("title")
    .eq("id", 1)
    .maybeSingle();

  if (settings?.title) {
    const h1 = document.querySelector(".hero h1");
    if (h1) h1.textContent = settings.title + " 결과";
    document.title = settings.title + " — 투표 결과";
  }

  // 결과 화면은 votes 원본 행을 읽지 않고 RPC로 집계 결과만 받습니다.
  const { data, error } = await client.rpc("get_vote_results");

  if (error) {
    message.textContent = "결과를 불러오지 못했습니다: " + error.message;
    return;
  }

  const rows = [
    { choice: "찬성", icon: "✓" },
    { choice: "반대", icon: "×" },
    { choice: "기권", icon: "—" }
  ];

  const counts = Object.fromEntries((data || []).map(row => [row.choice, Number(row.vote_count)]));
  const total = rows.reduce((sum, row) => sum + (counts[row.choice] || 0), 0);

  resultList.innerHTML = rows.map((row) => {
    const count = counts[row.choice] || 0;
    const percent = total ? Math.round((count / total) * 100) : 0;

    return `
      <div class="result-row">
        <div class="result-top">
          <strong>${row.icon} ${escapeHtml(row.choice)}</strong>
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
