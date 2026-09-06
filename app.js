(() => {
  const cfg = window.LYNKORA_CONFIG || {};
  const hasSb = window.supabase && cfg.SUPABASE_URL && !cfg.SUPABASE_URL.startsWith("YOUR_");
  const sb = hasSb ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY) : null;
  const $ = id => document.getElementById(id);
  const esc = (s="") => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const errText = e => e?.message || String(e || "Có lỗi xảy ra");
  const fmtDate = s => s ? new Date(s).toLocaleString("vi-VN") : "—";
  const basePath = location.pathname.replace(/[^/]*$/, "");
  const shortUrl = code => `${location.origin}${basePath}go.html?c=${encodeURIComponent(code)}`;

  async function requireUser() {
    if (!sb) { alert("Bạn chưa cấu hình Supabase trong config.js"); location.href="index.html"; return null; }
    const { data, error } = await sb.auth.getUser();
    if (error || !data.user) { location.href="auth.html"; return null; }
    return data.user;
  }

  async function myRole() {
    const {data,error}=await sb.rpc("lynkora_my_role");
    if(error) return "user";
    return data || "user";
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

  async function copyText(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
      const old=btn.textContent; btn.textContent="Đã chép ✓";
      setTimeout(()=>btn.textContent=old,1200);
    } catch {
      prompt("Sao chép link này:", text);
    }
  }

  async function loadLinks() {
    const u=await requireUser(); if(!u) return;
    $("userEmail").textContent=u.email||"";
    const role=await myRole();
    $("adminNav")?.classList.toggle("hidden", role!=="admin");
    $("adminSide")?.classList.toggle("hidden", role!=="admin");
    const {data,error}=await sb.rpc("lynkora_my_links");
    if(error){$("linksList").innerHTML=`<p class="msg">${esc(error.message)}</p>`;return}
    const rows=data||[];
    $("totalLinks").textContent=rows.length;
    $("totalClicks").textContent=rows.reduce((a,x)=>a+Number(x.click_count||0),0);
    $("validClicks").textContent=rows.reduce((a,x)=>a+Number(x.valid_click_count||0),0);
    $("linksList").innerHTML=rows.length?rows.map(x=>{
      const url=shortUrl(x.code);
      return `<article class="link-row ${x.is_active?'':'disabled-link'}" data-code="${esc(x.code)}">
        <div class="link-main"><div class="code-line"><b>${esc(x.code)}</b><span class="status ${x.is_active?'on':'off'}">${x.is_active?'ĐANG BẬT':'ĐÃ TẮT'}</span></div><small>${esc(x.target_url)}</small><small class="short-preview">${esc(url)}</small></div>
        <div class="link-actions"><span>${Number(x.click_count||0)} mở • ${Number(x.valid_click_count||0)} hợp lệ</span>
          <button class="ghost tiny" data-action="copy" data-url="${esc(url)}">Sao chép</button>
          <a class="primary tiny" href="${esc(url)}">Mở</a>
          <button class="ghost tiny" data-action="toggle" data-active="${x.is_active?'1':'0'}">${x.is_active?'Tắt':'Bật'}</button>
          <button class="danger tiny" data-action="delete">Xóa</button>
        </div></article>`;
    }).join(""):`<p class="muted">Bạn chưa có link nào.</p>`;
  }

  if ($("shortenForm")) {
    loadLinks();
    $("logoutBtn").onclick=async()=>{await sb.auth.signOut();location.href="index.html"};
    $("refreshBtn").onclick=loadLinks;
    $("shortenForm").onsubmit=async e=>{
      e.preventDefault(); $("createMsg").textContent="";
      const url=$("targetUrl").value.trim(), btn=$("shortenForm").querySelector("button");
      btn.disabled=true;
      try{
        const {data,error}=await sb.rpc("lynkora_create_link",{p_target_url:url});
        if(error) throw error;
        $("createMsg").textContent=`Đã tạo: ${shortUrl(data)}`;
        $("targetUrl").value=""; await loadLinks();
      }catch(ex){$("createMsg").textContent=errText(ex)}
      finally{btn.disabled=false}
    };
    $("linksList").onclick=async e=>{
      const btn=e.target.closest("button[data-action]"); if(!btn) return;
      const row=btn.closest(".link-row"), code=row?.dataset.code; if(!code) return;
      const action=btn.dataset.action;
      if(action==="copy") return copyText(btn.dataset.url,btn);
      btn.disabled=true;
      try{
        if(action==="toggle"){
          const next=btn.dataset.active!=="1";
          const {error}=await sb.rpc("lynkora_set_my_link_active",{p_code:code,p_active:next});
          if(error) throw error;
        }
        if(action==="delete"){
          if(!confirm(`Xóa link ${code}? Dữ liệu lượt truy cập của link này cũng sẽ bị xóa.`)){btn.disabled=false;return}
          const {error}=await sb.rpc("lynkora_delete_my_link",{p_code:code});
          if(error) throw error;
        }
        await loadLinks();
      }catch(ex){$("createMsg").textContent=errText(ex);btn.disabled=false}
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
        const {data,error}=await sb.rpc("lynkora_complete_visit",{p_visit_token:token});
        if(error) throw error;
        if(data!==true) throw new Error("Lượt truy cập chưa đủ điều kiện hoặc token đã được sử dụng.");
        location.href=target;
      }catch(ex){$("gateMsg").textContent=errText(ex);$("continueBtn").disabled=false}
    };
  }

  async function loadAdmin(){
    const u=await requireUser(); if(!u) return;
    $("adminEmail").textContent=u.email||"";
    const role=await myRole();
    if(role!=="admin"){alert("Tài khoản này không có quyền Admin.");location.href="dashboard.html";return}
    const [{data:stats,error:se},{data:users,error:ue},{data:links,error:le}] = await Promise.all([
      sb.rpc("lynkora_admin_stats"),
      sb.rpc("lynkora_admin_users"),
      sb.rpc("lynkora_admin_links")
    ]);
    if(se||ue||le){$("adminMsg").textContent=errText(se||ue||le);return}
    $("admUsers").textContent=stats?.users_count??0;
    $("admLinks").textContent=stats?.links_count??0;
    $("admClicks").textContent=stats?.clicks_count??0;
    $("admValid").textContent=stats?.valid_clicks_count??0;
    $("usersBody").innerHTML=(users||[]).map(x=>`<tr><td>${esc(x.email)}</td><td>${esc(x.display_name||"—")}</td><td><span class="status ${x.role==="admin"?"on":"off"}">${esc(x.role)}</span></td><td>${Number(x.links_count||0)}</td><td>${Number(x.clicks_count||0)}</td><td>${Number(x.valid_clicks_count||0)}</td><td>${fmtDate(x.created_at)}</td></tr>`).join("")||'<tr><td colspan="7">Chưa có dữ liệu.</td></tr>';
    $("adminLinksBody").innerHTML=(links||[]).map(x=>`<tr data-id="${esc(x.link_id)}"><td><b>${esc(x.code)}</b></td><td>${esc(x.owner_email)}</td><td class="url-cell">${esc(x.target_url)}</td><td><span class="status ${x.is_active?"on":"off"}">${x.is_active?"Bật":"Tắt"}</span></td><td>${Number(x.click_count||0)}</td><td>${Number(x.valid_click_count||0)}</td><td><div class="table-actions"><button class="ghost tiny" data-admin-action="toggle" data-active="${x.is_active?'1':'0'}">${x.is_active?'Tắt':'Bật'}</button><button class="danger tiny" data-admin-action="delete">Xóa</button></div></td></tr>`).join("")||'<tr><td colspan="7">Chưa có link.</td></tr>';
  }

  if($("usersBody")){
    loadAdmin();
    $("adminLogoutBtn").onclick=async()=>{await sb.auth.signOut();location.href="index.html"};
    $("adminRefreshBtn").onclick=loadAdmin;
    $("adminLinksBody").onclick=async e=>{
      const btn=e.target.closest("button[data-admin-action]");if(!btn)return;
      const row=btn.closest("tr"), id=row?.dataset.id;if(!id)return;
      btn.disabled=true;$("adminMsg").textContent="";
      try{
        if(btn.dataset.adminAction==="toggle"){
          const {error}=await sb.rpc("lynkora_admin_set_link_active",{p_link_id:id,p_active:btn.dataset.active!=="1"});
          if(error)throw error;
        }else if(btn.dataset.adminAction==="delete"){
          if(!confirm("Admin xóa link này? Dữ liệu lượt truy cập liên quan cũng sẽ bị xóa.")){btn.disabled=false;return}
          const {error}=await sb.rpc("lynkora_admin_delete_link",{p_link_id:id});
          if(error)throw error;
        }
        await loadAdmin();
      }catch(ex){$("adminMsg").textContent=errText(ex);btn.disabled=false}
    };
  }
})();