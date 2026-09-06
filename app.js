(() => {
  const cfg = window.LYNKORA_CONFIG || {};
  const hasSb = window.supabase && cfg.SUPABASE_URL && !cfg.SUPABASE_URL.startsWith("YOUR_");
  const sb = hasSb ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY) : null;
  const $ = (id) => document.getElementById(id);
  const esc = (s="") => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const errText = e => e?.message || String(e || "Có lỗi xảy ra");

  async function requireUser() {
    if (!sb) { alert("Bạn chưa cấu hình Supabase trong config.js"); location.href="index.html"; return null; }
    const { data } = await sb.auth.getUser();
    if (!data.user) { location.href="auth.html"; return null; }
    return data.user;
  }

  if ($("authForm")) {
    let mode = location.hash === "#register" ? "register" : "login";
    const paint = () => {
      $("loginTab").classList.toggle("active", mode==="login");
      $("registerTab").classList.toggle("active", mode==="register");
      $("nameWrap").classList.toggle("hidden", mode!=="register");
      $("authTitle").textContent = mode==="login" ? "Chào mừng trở lại" : "Tạo tài khoản";
      $("authHint").textContent = mode==="login" ? "Đăng nhập để quản lý link của bạn." : "Bắt đầu tạo và theo dõi link.";
      $("submitBtn").textContent = mode==="login" ? "Đăng nhập" : "Đăng ký";
    };
    $("loginTab").onclick=()=>{mode="login";history.replaceState(null,"",location.pathname);paint()};
    $("registerTab").onclick=()=>{mode="register";history.replaceState(null,"","#register");paint()};
    paint();
    $("authForm").onsubmit = async e => {
      e.preventDefault(); $("msg").textContent="";
      if (!sb) return $("msg").textContent="Hãy cấu hình Supabase trong config.js trước.";
      const email=$("email").value.trim(), password=$("password").value;
      $("submitBtn").disabled=true;
      try {
        if (mode==="register") {
          const {data,error}=await sb.auth.signUp({email,password,options:{data:{display_name:$("displayName").value.trim()}}});
          if(error) throw error;
          $("msg").textContent = data.session ? "Đăng ký thành công." : "Đăng ký thành công. Hãy xác nhận email rồi đăng nhập.";
          if(data.session) location.href="dashboard.html";
        } else {
          const {error}=await sb.auth.signInWithPassword({email,password});
          if(error) throw error; location.href="dashboard.html";
        }
      } catch(e2){$("msg").textContent=errText(e2)} finally {$("submitBtn").disabled=false}
    };
  }

  async function loadLinks() {
    const u=await requireUser(); if(!u) return;
    $("userEmail").textContent=u.email||"";
    const {data,error}=await sb.rpc("lynkora_my_links");
    if(error){$("linksList").innerHTML=`<p class="msg">${esc(error.message)}</p>`;return}
    const rows=data||[];
    $("totalLinks").textContent=rows.length;
    $("totalClicks").textContent=rows.reduce((a,x)=>a+Number(x.click_count||0),0);
    $("validClicks").textContent=rows.reduce((a,x)=>a+Number(x.valid_click_count||0),0);
    $("linksList").innerHTML=rows.length?rows.map(x=>`<article class="link-row"><div><b>${esc(x.code)}</b><small>${esc(x.target_url)}</small></div><div><span>${Number(x.click_count||0)} mở</span><a class="primary tiny" href="go.html?c=${encodeURIComponent(x.code)}">Mở</a></div></article>`).join(""):`<p class="muted">Bạn chưa có link nào.</p>`;
  }

  if ($("shortenForm")) {
    loadLinks();
    $("logoutBtn").onclick=async()=>{await sb.auth.signOut();location.href="index.html"};
    $("refreshBtn").onclick=loadLinks;
    $("shortenForm").onsubmit=async e=>{
      e.preventDefault(); $("createMsg").textContent="";
      const url=$("targetUrl").value.trim();
      $("shortenForm").querySelector("button").disabled=true;
      try{
        const {data,error}=await sb.rpc("lynkora_create_link",{p_target_url:url});
        if(error) throw error;
        $("createMsg").textContent=`Đã tạo: go.html?c=${data}`;
        $("targetUrl").value=""; await loadLinks();
      }catch(ex){$("createMsg").textContent=errText(ex)}
      finally{$("shortenForm").querySelector("button").disabled=false}
    };
  }

  if ($("countdown")) {
    const code=new URLSearchParams(location.search).get("c")||"";
    let target=null, token=null;
    (async()=>{
      if(!sb){$("gateMsg").textContent="Website chưa được cấu hình backend.";return}
      const {data,error}=await sb.rpc("lynkora_open_link",{p_code:code});
      if(error){$("gateMsg").textContent=errText(error);return}
      target=data?.target_url; token=data?.visit_token;
      let n=5; $("countdown").textContent=n;
      const timer=setInterval(()=>{n--; $("countdown").textContent=n; if(n<=0){clearInterval(timer);$("continueBtn").disabled=false;$("continueBtn").textContent="Tiếp tục đến liên kết"}},1000);
    })();
    $("continueBtn").onclick=async()=>{
      if(!target||!token)return;
      $("continueBtn").disabled=true;
      try{
        const {error}=await sb.rpc("lynkora_complete_visit",{p_visit_token:token});
        if(error) throw error;
        location.href=target;
      }catch(ex){$("gateMsg").textContent=errText(ex);$("continueBtn").disabled=false}
    };
  }
})();