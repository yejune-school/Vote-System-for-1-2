const client = supabase.createClient(VOTE_CONFIG.SUPABASE_URL, VOTE_CONFIG.SUPABASE_ANON_KEY);
const $ = id => document.getElementById(id);

function toast(msg){const e=$("toast");if(!e)return;e.textContent=msg;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2600)}
function redirect(){return location.origin+location.pathname.replace(/[^/]*$/,"")}
function isAdmin(u){return (VOTE_CONFIG.ADMIN_EMAILS||[]).map(x=>x.toLowerCase()).includes((u?.email||"").toLowerCase())}

async function oauth(provider){
  const {error}=await client.auth.signInWithOAuth({provider,options:{redirectTo:redirect()}});
  if(error) toast(error.message);
}
async function user(){
  const {data:{session}}=await client.auth.getSession(); return session?.user||null;
}
async function logout(){await client.auth.signOut();location.href="login.html"}

$("googleLogin")?.addEventListener("click",()=>oauth("google"));
$("kakaoLogin")?.addEventListener("click",()=>oauth("kakao"));
$("logoutButton")?.addEventListener("click",logout);

async function loadMain(){
  const u=await user(); if(!u){location.href="login.html";return}
  $("userName").textContent=u.user_metadata?.full_name||u.user_metadata?.name||u.email||"로그인됨";
  if(isAdmin(u)) $("adminButton")?.classList.remove("hidden");

  const {data:s,error:se}=await client.from("vote_settings").select("title,description,is_open").eq("id",1).maybeSingle();
  if(se){toast(se.message);return}
  if(s){
    $("title").textContent=s.title;
    $("description").textContent=s.description;
    $("openState").textContent=s.is_open?"투표 진행 중":"투표 종료";
    document.querySelector(".dot")?.classList.toggle("closed",!s.is_open);
    if(!s.is_open){$("status").textContent="현재 투표가 종료되었습니다.";document.querySelectorAll(".vote-button").forEach(b=>b.disabled=true);return}
  }

  const {data:v,error}=await client.from("votes").select("choice").eq("user_id",u.id).maybeSingle();
  if(error){toast(error.message);return}
  if(v){
    $("status").textContent=`투표 완료 · ${v.choice}`;
    document.querySelectorAll(".vote-button").forEach(b=>{b.disabled=true;if(b.dataset.choice===v.choice)b.classList.add("selected")});
  }else $("status").textContent="찬성, 반대, 기권 중 하나를 선택하세요.";
}

async function cast(choice){
  const u=await user(); if(!u){location.href="login.html";return}
  if(!confirm(`${choice}에 투표하시겠습니까?\n투표 후 변경할 수 없습니다.`))return;
  const {error}=await client.from("votes").insert({user_id:u.id,choice});
  if(error){toast(error.code==="23505"?"이미 투표했습니다.":error.message);await loadMain();return}
  toast("투표가 완료되었습니다.");await loadMain();
}
document.querySelectorAll(".vote-button").forEach(b=>b.addEventListener("click",()=>cast(b.dataset.choice)));

if(location.pathname.endsWith("/")||location.pathname.endsWith("index.html")) loadMain();