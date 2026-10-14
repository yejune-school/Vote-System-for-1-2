const client = supabase.createClient(VOTE_CONFIG.SUPABASE_URL, VOTE_CONFIG.SUPABASE_ANON_KEY);
const $=id=>document.getElementById(id);
function toast(msg){const e=$("toast");e.textContent=msg;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2600)}
function isAdmin(u){return (VOTE_CONFIG.ADMIN_EMAILS||[]).map(x=>x.toLowerCase()).includes((u?.email||"").toLowerCase())}
async function getUser(){const {data:{session}}=await client.auth.getSession();return session?.user||null}
async function logout(){await client.auth.signOut();location.href="login.html"}

async function init(){
  const u=await getUser();
  if(!u||!isAdmin(u)){location.href="index.html";return}
  await loadSettings();await loadResults();
}
async function loadSettings(){
  const {data,error}=await client.from("vote_settings").select("title,description,is_open").eq("id",1).maybeSingle();
  if(error){toast(error.message);return}
  $("settingTitle").value=data?.title||"";
  $("settingDescription").value=data?.description||"";
  $("isOpen").checked=data?.is_open!==false;
}
async function saveSettings(){
  const {error}=await client.from("vote_settings").update({
    title:$("settingTitle").value.trim(),
    description:$("settingDescription").value.trim(),
    is_open:$("isOpen").checked
  }).eq("id",1);
  if(error){toast(error.message);return}
  toast("변경사항을 저장했습니다.");
}
async function loadResults(){
  const {data,error}=await client.rpc("get_vote_results");
  if(error){toast(error.message);return}
  const c={"찬성":0,"반대":0,"기권":0};
  (data||[]).forEach(x=>c[x.choice]=Number(x.count));
  const total=c["찬성"]+c["반대"]+c["기권"];
  $("totalCount").textContent=total+"명";
  $("agreeCount").textContent=c["찬성"];$("disagreeCount").textContent=c["반대"];$("abstainCount").textContent=c["기권"];
  $("agreeBar").style.width=total?c["찬성"]/total*100+"%":"0%";
  $("disagreeBar").style.width=total?c["반대"]/total*100+"%":"0%";
  $("abstainBar").style.width=total?c["기권"]/total*100+"%":"0%";
}
async function resetVotes(){
  if(!confirm("모든 투표 기록을 삭제할까요?\n이 작업은 되돌릴 수 없습니다."))return;
  const {error}=await client.rpc("reset_votes");
  if(error){toast(error.message);return}
  toast("투표를 초기화했습니다.");await loadResults();
}
$("saveSettings").onclick=saveSettings;
$("resetVotes").onclick=resetVotes;
$("logoutButton").onclick=logout;
init();