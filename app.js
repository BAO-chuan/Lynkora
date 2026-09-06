(() => {
  const cfg = window.LYNKORA_CONFIG || {};
  const hasSb = window.supabase && cfg.SUPABASE_URL && !cfg.SUPABASE_URL.startsWith("YOUR_");
  const sb = hasSb ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY) : null;
  const $ = id => document.getElementById(id);
  const esc = (s="") => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const errText = e => e?.message || String(e || "Có lỗi xảy ra");
  const fmtDate = s => s ? new Date(s).toLocaleString("vi-VN") : "—";
  const fmtShortDate = s => {
    const d = new Date(`${s}T00:00:00`);
    return d.toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit"});
  };
  const basePath = location.pathname.replace(/[^/]*$/, "");
  const shortUrl = code => `${location.origin}${basePath}go.html?c=${encodeURIComponent(code)}`;
  const pct = (a,b) => b > 0 ? Math.round((a/b)*100) : 0;
  const fmtVnd = n => `${Math.round(Number(n||0)).toLocaleString("vi-VN")} ₫`;
  const fraudReasonLabel = reason => ({
    rapid_repeat: "Lặp nhanh",
    too_fast: "Quá nhanh",
    expired: "Hết hạn"
  })[reason] || reason || "Khác";
  const withdrawalStatusLabel = status => ({
    pending:"Chờ duyệt", approved:"Đã duyệt", rejected:"Từ chối"
  })[status] || status || "—";
  const payoutMethodLabel = method => ({
    bank:"Ngân hàng", momo:"MoMo", zalopay:"ZaloPay", other:"Khác"
  })[method] || method || "—";
  const clientKey = () => {
    let k=localStorage.getItem("lynkora_client_key");
    if(!k){ k=(crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`); localStorage.setItem("lynkora_client_key",k); }
    return k;
  };
  const edgeUrl = name => `${cfg.SUPABASE_URL}/functions/v1/${name}`;
  async function edgePost(name, body) {
    const res=await fetch(edgeUrl(name),{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "apikey":cfg.SUPABASE_PUBLISHABLE_KEY
      },
      body:JSON.stringify(body)
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
    return data;
  }

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
          if(data.session) location.href="dashboard.html?v=19";
        } else {
          const {error}=await sb.auth.signInWithPassword({email,password});
          if(error) throw error; location.href="dashboard.html?v=19";
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

  function renderDailyChart(el, rows, summaryEl) {
    if (!el) return;
    rows = rows || [];
    const total = rows.reduce((a,x)=>a+Number(x.opens||0),0);
    const valid = rows.reduce((a,x)=>a+Number(x.valid||0),0);
    if(summaryEl) summaryEl.textContent=`${total} mở • ${valid} hợp lệ`;
    const max = Math.max(1, ...rows.map(x=>Number(x.opens||0)));
    el.innerHTML = rows.map(x=>{
      const opens=Number(x.opens||0), good=Number(x.valid||0);
      const openH=Math.max(opens?8:2,Math.round(opens/max*100));
      const validH=Math.max(good?8:2,Math.round(good/max*100));
      return `<div class="day-col" title="${esc(x.day)}: ${opens} mở, ${good} hợp lệ">
        <div class="bar-stack"><i class="bar-open" style="height:${openH}%"></i><i class="bar-valid" style="height:${validH}%"></i></div>
        <b>${opens}</b><small>${fmtShortDate(x.day)}</small>
      </div>`;
    }).join("") || '<p class="muted">Chưa có dữ liệu.</p>';
  }

  async function loadMyDaily() {
    if(!$("dailyChart")) return;
    const {data,error}=await sb.rpc("lynkora_my_daily_stats",{p_days:7});
    if(error){$("dailyChart").innerHTML=`<p class="msg">${esc(error.message)}</p>`;return}
    renderDailyChart($("dailyChart"),data,$("weekSummary"));
  }


  async function loadLinkDaily(code) {
    if(!$("linkDailyChart") || !code) return;
    $("linkDailyChart").innerHTML='<p class="muted">Đang tải...</p>';
    const {data,error}=await sb.rpc("lynkora_my_link_daily_stats",{
      p_code:code,
      p_days:7
    });
    if(error){
      $("linkDailyChart").innerHTML=`<p class="msg">${esc(errText(error))}</p>`;
      return;
    }
    const rows=data||[];
    renderDailyChart($("linkDailyChart"),rows,null);
    const totalOpens=rows.reduce((a,x)=>a+Number(x.opens||0),0);
    const totalValid=rows.reduce((a,x)=>a+Number(x.valid||0),0);
    const totalInvalid=rows.reduce((a,x)=>a+Number(x.invalid||0),0);
    const revenue=rows.reduce((a,x)=>a+Number(x.earned_vnd||0),0);
    if($("linkDetailTitle")) $("linkDetailTitle").textContent=`${code} • 7 ngày`;
    if($("linkDetailSubtitle")) $("linkDetailSubtitle").textContent=
      `${totalOpens} mở • ${totalValid} hợp lệ • ${totalInvalid} không hợp lệ • ${pct(totalValid,totalOpens)}% hợp lệ`;
    if($("linkDailyRevenue")) $("linkDailyRevenue").innerHTML=
      `<span><small>Doanh thu 7 ngày</small><b>${fmtVnd(revenue)}</b></span>`;
  }

  async function loadLinkAnalytics() {
    if(!$("linkAnalyticsBody")) return;
    const {data,error}=await sb.rpc("lynkora_my_link_analytics");
    if(error){
      $("linkAnalyticsBody").innerHTML=`<tr><td colspan="7" class="msg">${esc(errText(error))}</td></tr>`;
      if($("linkAnalyticsCards")) $("linkAnalyticsCards").innerHTML=`<p class="msg">${esc(errText(error))}</p>`;
      return;
    }

    const rows=data||[];
    if($("linkAnalyticsCount")) $("linkAnalyticsCount").textContent=`${rows.length} link`;

    $("linkAnalyticsBody").innerHTML=rows.map(x=>`<tr>
      <td><b>${esc(x.code)}</b><small class="analytics-target">${esc(x.target_url||"")}</small></td>
      <td>${Number(x.opens||0)}</td>
      <td>${Number(x.valid_clicks||0)}</td>
      <td>${Number(x.invalid_clicks||0)}</td>
      <td><b>${Number(x.valid_rate||0).toFixed(1)}%</b></td>
      <td><b>${fmtVnd(x.earned_vnd)}</b></td>
      <td><button class="ghost tiny link-detail-btn" data-code="${esc(x.code)}">7 ngày</button></td>
    </tr>`).join("")||'<tr><td colspan="7">Bạn chưa có link nào.</td></tr>';

    if($("linkAnalyticsCards")) $("linkAnalyticsCards").innerHTML=rows.map(x=>`<article class="mobile-admin-card">
      <div class="row-between gap">
        <div><b>${esc(x.code)}</b><small>${x.is_active?"Đang bật":"Đã tắt"}</small></div>
        <b>${fmtVnd(x.earned_vnd)}</b>
      </div>
      <div class="mini-metrics link-analytics-metrics">
        <span><b>${Number(x.opens||0)}</b><small>Mở</small></span>
        <span><b>${Number(x.valid_clicks||0)}</b><small>Hợp lệ</small></span>
        <span><b>${Number(x.invalid_clicks||0)}</b><small>Không hợp lệ</small></span>
        <span><b>${Number(x.valid_rate||0).toFixed(1)}%</b><small>Tỷ lệ</small></span>
      </div>
      <button class="ghost tiny link-detail-btn" data-code="${esc(x.code)}">Xem biểu đồ 7 ngày</button>
    </article>`).join("")||'<p class="muted">Bạn chưa có link nào.</p>';

    if($("linkAnalyticsSelect")){
      $("linkAnalyticsSelect").innerHTML=rows.length
        ? rows.map(x=>`<option value="${esc(x.code)}">${esc(x.code)}</option>`).join("")
        : '<option value="">Chưa có link</option>';
      $("linkAnalyticsSelect").disabled=!rows.length;
      if(rows.length) await loadLinkDaily(rows[0].code);
    }

    document.querySelectorAll(".link-detail-btn").forEach(btn=>{
      btn.onclick=async()=>{
        const code=btn.dataset.code||"";
        if($("linkAnalyticsSelect")) $("linkAnalyticsSelect").value=code;
        await loadLinkDaily(code);
        $("linkDailyChart")?.scrollIntoView({behavior:"smooth",block:"center"});
      };
    });
  }

  async function loadWallet() {
    if(!$("walletBalance")) return;
    const [{data:wallet,error:we},{data:history,error:he}] = await Promise.all([
      sb.rpc("lynkora_my_wallet_summary"),
      sb.rpc("lynkora_my_earnings_history",{p_limit:50})
    ]);
    if(we||he) {
      if($("earningsBody")) $("earningsBody").innerHTML=`<tr><td colspan="4" class="msg">${esc(errText(we||he))}</td></tr>`;
      return;
    }

    $("walletBalance").textContent=fmtVnd(wallet?.available_vnd ?? wallet?.balance_vnd);
    $("walletLifetime").textContent=fmtVnd(wallet?.lifetime_earned_vnd);
    if($("walletPending")) $("walletPending").textContent=fmtVnd(wallet?.pending_vnd);
    if($("walletApproved")) $("walletApproved").textContent=fmtVnd(wallet?.approved_vnd);
    $("walletEarnedVisits").textContent=Number(wallet?.earned_visits||0);
    $("publisherCpm").textContent=`CPM hiện tại ${fmtVnd(wallet?.current_cpm_vnd)}`;

    const rows=history||[];
    if($("earningsCount")) $("earningsCount").textContent=`${rows.length} mục`;
    if($("earningsBody")) $("earningsBody").innerHTML=rows.map(x=>`<tr>
      <td>${fmtDate(x.earned_at)}</td>
      <td><b>${esc(x.link_code||"—")}</b></td>
      <td>${fmtVnd(x.cpm_vnd)}</td>
      <td><b>+${fmtVnd(x.amount_vnd)}</b></td>
    </tr>`).join("")||'<tr><td colspan="4">Chưa có doanh thu được ghi nhận.</td></tr>';

    if($("earningsCards")) $("earningsCards").innerHTML=rows.map(x=>`<article class="mobile-admin-card">
      <div class="row-between gap"><div><b>${esc(x.link_code||"—")}</b><small>${fmtDate(x.earned_at)}</small></div><b class="earning-plus">+${fmtVnd(x.amount_vnd)}</b></div>
      <small>CPM tại thời điểm ghi nhận: ${fmtVnd(x.cpm_vnd)}</small>
    </article>`).join("")||'<p class="muted">Chưa có doanh thu được ghi nhận.</p>';
  }


  async function loadPendingEarnings(){
    if(!$('pendingEarningsCard')) return;
    const {data,error}=await sb.rpc('lynkora_my_pending_earnings_summary');
    if(error){
      if($('pendingEarningsStatus')) $('pendingEarningsStatus').textContent=errText(error);
      return;
    }
    const pending=Number(data?.pending_valid_visits||0);
    if($('pendingValidVisits')) $('pendingValidVisits').textContent=pending.toLocaleString('vi-VN');
    if($('pendingEarningsStatus')) {
      $('pendingEarningsStatus').textContent=pending>0?`${pending.toLocaleString('vi-VN')} valid đang chờ`:'Không có lượt đang chờ';
      $('pendingEarningsStatus').classList.add('ok');
    }
    if($('pendingSettlementState')) $('pendingSettlementState').textContent=pending>0?'Đang chờ chốt kỳ':'Đã cập nhật';
  }


  async function loadPublisherModel(){
    if(!$('publisherModelCard')) return;
    const {data,error}=await sb.rpc('lynkora_my_publisher_model');
    if(error){ if($('myModelStatus')) $('myModelStatus').textContent=errText(error); return; }
    if($('myModelStatus')) { $('myModelStatus').textContent='Theo Revenue Cycles'; $('myModelStatus').classList.add('ok'); }
    if($('mySettledCycles')) $('mySettledCycles').textContent=Number(data?.settled_cycles||0).toLocaleString('vi-VN');
    if($('myPaidVisits')) $('myPaidVisits').textContent=Number(data?.paid_visits||0).toLocaleString('vi-VN');
    if($('myCycleEarnings')) $('myCycleEarnings').textContent=fmtVnd(data?.cycle_earnings_vnd);
    if($('myLastCycleCpm')) $('myLastCycleCpm').textContent=fmtVnd(data?.last_cycle_cpm_vnd);
    if($('publisherCpm')) $('publisherCpm').textContent=`CPM kỳ gần nhất ${fmtVnd(data?.last_cycle_cpm_vnd)}`;
  }


  async function loadPayoutProfile() {
    if(!$("payoutProfileForm")) return;
    const {data,error}=await sb.rpc("lynkora_my_payout_profile");
    if(error){
      $("payoutProfileMsg").textContent=errText(error);
      return;
    }
    if(data?.configured){
      $("payoutMethod").value=data.method||"bank";
      $("payoutName").value=data.account_name||"";
      $("payoutAccount").value=data.account_ref||"";
      $("payoutProvider").value=data.provider||"";
      $("payoutProfileStatus").textContent="Đã lưu";
    }else{
      $("payoutProfileStatus").textContent="Chưa lưu";
    }
  }

  async function loadWithdrawals() {
    if (!$("withdrawBody")) return;

    const [{data:summary,error:se},{data:rows,error:re}] = await Promise.all([
      sb.rpc("lynkora_my_withdrawal_summary"),
      sb.rpc("lynkora_my_withdrawals",{p_limit:50})
    ]);

    if (se || re) {
      if ($("withdrawMsg")) $("withdrawMsg").textContent=errText(se||re);
      $("withdrawBody").innerHTML=`<tr><td colspan="5" class="msg">${esc(errText(se||re))}</td></tr>`;
      if ($("withdrawCards")) $("withdrawCards").innerHTML=`<p class="msg">${esc(errText(se||re))}</p>`;
      return;
    }

    if ($("withdrawAvailable")) $("withdrawAvailable").textContent=`Khả dụng ${fmtVnd(summary?.available_vnd)}`;
    if ($("withdrawMinimum")) $("withdrawMinimum").textContent=fmtVnd(summary?.minimum_vnd);
    if ($("withdrawAmount")) {
      $("withdrawAmount").min=Math.max(1,Number(summary?.minimum_vnd||1000));
      $("withdrawAmount").step=1000;
    }

    const items=rows||[];
    $("withdrawBody").innerHTML=items.map(x=>`<tr>
      <td>${fmtDate(x.created_at)}</td>
      <td><b>${fmtVnd(x.amount_vnd)}</b></td>
      <td>${esc(payoutMethodLabel(x.payment_method))}</td>
      <td><span class="status ${x.status==="approved"?"on":"off"}">${esc(withdrawalStatusLabel(x.status))}</span></td>
      <td>${esc(x.admin_note||"—")}</td>
    </tr>`).join("")||'<tr><td colspan="5">Chưa có yêu cầu rút.</td></tr>';

    if ($("withdrawCards")) $("withdrawCards").innerHTML=items.map(x=>`<article class="mobile-admin-card">
      <div class="row-between gap">
        <div><b>${fmtVnd(x.amount_vnd)}</b><small>${fmtDate(x.created_at)} • ${esc(payoutMethodLabel(x.payment_method))}</small></div>
        <span class="status ${x.status==="approved"?"on":"off"}">${esc(withdrawalStatusLabel(x.status))}</span>
      </div>
      <small>${esc(x.admin_note||x.note||"Không có ghi chú")}</small>
    </article>`).join("")||'<p class="muted">Chưa có yêu cầu rút.</p>';
  }

  async function loadAccount() {
    if(!$('accountProfileForm')) return;
    const u=await requireUser(); if(!u) return;
    if($('accountEmail')) $('accountEmail').textContent=u.email||'—';
    if($('accountCreatedAt')) $('accountCreatedAt').textContent=fmtDate(u.created_at);
    const {data,error}=await sb.rpc('lynkora_my_account_profile');
    if(error){
      if($('accountProfileMsg')) $('accountProfileMsg').textContent=errText(error);
      return;
    }
    if($('accountDisplayName')) $('accountDisplayName').value=data?.display_name||'';
    if($('accountRole')) $('accountRole').textContent=(data?.role||'publisher').toUpperCase();
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
    const clicks=rows.reduce((a,x)=>a+Number(x.click_count||0),0);
    const valid=rows.reduce((a,x)=>a+Number(x.valid_click_count||0),0);
    $("totalLinks").textContent=rows.length;
    $("totalClicks").textContent=clicks;
    $("validClicks").textContent=valid;
    if($("validRate")) $("validRate").textContent=`${pct(valid,clicks)}%`;
    if($("invalidClicks")) $("invalidClicks").textContent=Math.max(0,clicks-valid);
    $("linksList").innerHTML=rows.length?rows.map(x=>{
      const url=shortUrl(x.code), opens=Number(x.click_count||0), good=Number(x.valid_click_count||0);
      return `<article class="link-row ${x.is_active?'':'disabled-link'}" data-code="${esc(x.code)}">
        <div class="link-main">
          <div class="code-line"><b>${esc(x.code)}</b><span class="status ${x.is_active?'on':'off'}">${x.is_active?'ĐANG BẬT':'ĐÃ TẮT'}</span></div>
          <small class="target-preview">${esc(x.target_url)}</small><small class="short-preview">${esc(url)}</small>
          <div class="link-meta"><span>📅 ${fmtDate(x.created_at)}</span><span>✓ ${pct(good,opens)}% hợp lệ</span></div>
        </div>
        <div class="link-actions"><span>${opens} mở • ${good} hợp lệ</span>
          <button class="ghost tiny" data-action="copy" data-url="${esc(url)}">Sao chép</button>
          <a class="primary tiny" href="${esc(url)}">Mở</a>
          <button class="ghost tiny" data-action="toggle" data-active="${x.is_active?'1':'0'}">${x.is_active?'Tắt':'Bật'}</button>
          <button class="danger tiny" data-action="delete">Xóa</button>
        </div></article>`;
    }).join(""):`<p class="muted">Bạn chưa có link nào.</p>`;
  }

  if ($("shortenForm")) {
    Promise.all([loadLinks(),loadMyDaily(),loadLinkAnalytics(),loadWallet(),loadPendingEarnings(),loadPublisherModel(),loadWithdrawals(),loadPayoutProfile()]);
    if($("linkAnalyticsSelect")) $("linkAnalyticsSelect").onchange=()=>loadLinkDaily($("linkAnalyticsSelect").value);
    $("logoutBtn").onclick=async()=>{await sb.auth.signOut();location.href="index.html"};
    if($("accountLogoutBtn")) $("accountLogoutBtn").onclick=async()=>{await sb.auth.signOut();location.href="index.html"};

    if($("accountProfileForm")) $("accountProfileForm").onsubmit=async e=>{
      e.preventDefault();
      const btn=$("accountProfileForm").querySelector("button[type='submit']");
      const name=$("accountDisplayName").value.trim();
      btn.disabled=true;
      $("accountProfileMsg").textContent="Đang lưu...";
      try{
        const {error}=await sb.rpc("lynkora_save_my_display_name",{p_display_name:name});
        if(error) throw error;
        $("accountProfileMsg").textContent="Đã cập nhật tên hiển thị.";
      }catch(ex){$("accountProfileMsg").textContent=errText(ex)}
      finally{btn.disabled=false}
    };

    if($("accountPasswordForm")) $("accountPasswordForm").onsubmit=async e=>{
      e.preventDefault();
      const btn=$("accountPasswordForm").querySelector("button[type='submit']");
      const pass=$("accountNewPassword").value;
      const confirmPass=$("accountConfirmPassword").value;
      if(pass.length<8){$("accountPasswordMsg").textContent="Mật khẩu cần ít nhất 8 ký tự.";return}
      if(pass!==confirmPass){$("accountPasswordMsg").textContent="Hai mật khẩu chưa khớp.";return}
      btn.disabled=true;
      $("accountPasswordMsg").textContent="Đang cập nhật...";
      try{
        const {error}=await sb.auth.updateUser({password:pass});
        if(error) throw error;
        $("accountPasswordMsg").textContent="Đổi mật khẩu thành công.";
        $("accountPasswordForm").reset();
      }catch(ex){$("accountPasswordMsg").textContent=errText(ex)}
      finally{btn.disabled=false}
    };

    if ($("payoutProfileForm")) $("payoutProfileForm").onsubmit=async e=>{
      e.preventDefault();
      const btn=$("payoutProfileForm").querySelector("button[type='submit']");
      btn.disabled=true;
      $("payoutProfileMsg").textContent="Đang lưu...";
      try{
        const {error}=await sb.rpc("lynkora_save_payout_profile",{
          p_method:$("payoutMethod").value,
          p_account_name:$("payoutName").value.trim(),
          p_account_ref:$("payoutAccount").value.trim(),
          p_provider:$("payoutProvider").value.trim()||null
        });
        if(error) throw error;
        $("payoutProfileMsg").textContent="Đã lưu thông tin nhận tiền.";
        $("payoutProfileStatus").textContent="Đã lưu";
      }catch(ex){
        $("payoutProfileMsg").textContent=errText(ex);
      }finally{
        btn.disabled=false;
      }
    };

    if ($("withdrawForm")) $("withdrawForm").onsubmit=async e=>{
      e.preventDefault();
      const btn=$("withdrawForm").querySelector("button[type='submit']");
      if ($("withdrawMsg")) $("withdrawMsg").textContent="Đang gửi...";
      btn.disabled=true;
      try{
        const amount=Number($("withdrawAmount").value);
        const note=$("withdrawNote").value.trim();
        const {error}=await sb.rpc("lynkora_create_withdrawal",{
          p_amount_vnd:amount,
          p_note:note||null
        });
        if(error) throw error;
        $("withdrawMsg").textContent="Đã gửi yêu cầu rút.";
        $("withdrawForm").reset();
        await Promise.all([loadWallet(),loadWithdrawals()]);
      }catch(ex){
        $("withdrawMsg").textContent=errText(ex);
      }finally{
        btn.disabled=false;
      }
    };

    $("refreshBtn").onclick=async()=>{await Promise.all([loadLinks(),loadMyDaily(),loadWallet(),loadPendingEarnings(),loadPublisherModel(),loadWithdrawals(),loadPayoutProfile()])};
    $("shortenForm").onsubmit=async e=>{
      e.preventDefault(); $("createMsg").textContent="";
      const url=$("targetUrl").value.trim(), btn=$("shortenForm").querySelector("button");
      btn.disabled=true;
      try{
        const {data,error}=await sb.rpc("lynkora_create_link",{p_target_url:url});
        if(error) throw error;
        $("createMsg").textContent=`Đã tạo: ${shortUrl(data)}`;
        $("targetUrl").value=""; await Promise.all([loadLinks(),loadMyDaily(),loadWallet(),loadPendingEarnings(),loadPublisherModel(),loadWithdrawals(),loadPayoutProfile()]);
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
        await Promise.all([loadLinks(),loadMyDaily(),loadWallet(),loadPendingEarnings(),loadPublisherModel(),loadWithdrawals(),loadPayoutProfile()]);
      }catch(ex){$("createMsg").textContent=errText(ex);btn.disabled=false}
    };
  }

  if ($("countdown")) {
    const code=new URLSearchParams(location.search).get("c")||"";
    let target=null, token=null;
    (async()=>{
      if(!sb){$("gateMsg").textContent="Website chưa được cấu hình backend.";return}
      let data;
      try{ data=await edgePost("lynkora-open",{code,client_key:clientKey()}); }
      catch(error){$("gateMsg").textContent=errText(error);return}
      target=data?.target_url; token=data?.visit_token;
      let n=5; $("countdown").textContent=n;
      const timer=setInterval(()=>{n--; $("countdown").textContent=n; if(n<=0){clearInterval(timer);$("continueBtn").disabled=false;$("continueBtn").textContent="Tiếp tục đến liên kết"}},1000);
    })();
    $("continueBtn").onclick=async()=>{
      if(!target||!token)return;
      $("continueBtn").disabled=true;
      try{
        const data=await edgePost("lynkora-complete",{visit_token:token});
        if(data?.ok!==true) throw new Error(data?.message || "Lượt truy cập chưa đủ điều kiện hoặc token đã được sử dụng.");
        location.href=target;
      }catch(ex){$("gateMsg").textContent=errText(ex);$("continueBtn").disabled=false}
    };
  }

  function adminUserCard(x){
    return `<article class="mobile-admin-card">
      <div class="row-between gap"><div><b>${esc(x.display_name||"Không tên")}</b><small>${esc(x.email)}</small></div><span class="status ${x.role==="admin"?"on":"off"}">${esc(x.role)}</span></div>
      <div class="mini-metrics"><span><b>${Number(x.links_count||0)}</b><small>Links</small></span><span><b>${Number(x.clicks_count||0)}</b><small>Mở</small></span><span><b>${Number(x.valid_clicks_count||0)}</b><small>Hợp lệ</small></span></div>
      <small>Tạo: ${fmtDate(x.created_at)}</small>
    </article>`;
  }

  function adminLinkCard(x){
    const opens=Number(x.click_count||0), good=Number(x.valid_click_count||0);
    return `<article class="mobile-admin-card" data-id="${esc(x.link_id)}">
      <div class="row-between gap"><div><b>${esc(x.code)}</b><small>${esc(x.owner_email)}</small></div><span class="status ${x.is_active?"on":"off"}">${x.is_active?"Bật":"Tắt"}</span></div>
      <small class="target-preview">${esc(x.target_url)}</small>
      <div class="link-meta"><span>${opens} mở</span><span>${good} hợp lệ</span><span>${pct(good,opens)}%</span></div>
      <div class="mobile-card-actions"><button class="ghost tiny" data-admin-action="toggle" data-active="${x.is_active?'1':'0'}">${x.is_active?'Tắt':'Bật'}</button><button class="danger tiny" data-admin-action="delete">Xóa</button></div>
    </article>`;
  }

  async function loadAdmin(){
    const u=await requireUser(); if(!u) return;
    $("adminEmail").textContent=u.email||"";
    const role=await myRole();
    if(role!=="admin"){alert("Tài khoản này không có quyền Admin.");location.href="dashboard.html?v=19";return}
    const [{data:stats,error:se},{data:users,error:ue},{data:links,error:le},{data:daily,error:de},{data:wallet,error:we},{data:balances,error:be},{data:fraud,error:fe},{data:withdrawals,error:wde},{data:wdcfg,error:wce},{data:revctl,error:rce}] = await Promise.all([
      sb.rpc("lynkora_admin_stats"),
      sb.rpc("lynkora_admin_users"),
      sb.rpc("lynkora_admin_links"),
      sb.rpc("lynkora_admin_daily_stats",{p_days:7}),
      sb.rpc("lynkora_admin_wallet_summary"),
      sb.rpc("lynkora_admin_user_wallets"),
      sb.rpc("lynkora_admin_fraud_logs",{p_limit:100}),
      sb.rpc("lynkora_admin_withdrawals",{p_limit:100}),
      sb.rpc("lynkora_admin_withdrawal_config"),
      sb.rpc("lynkora_admin_revenue_control")
    ]);
    if(se||ue||le||de||we||be||fe||wde||wce){$("adminMsg").textContent=errText(se||ue||le||de||we||be||fe||wde||wce);return}
    $("admUsers").textContent=stats?.users_count??0;
    $("admLinks").textContent=stats?.links_count??0;
    $("admClicks").textContent=stats?.clicks_count??0;
    $("admValid").textContent=stats?.valid_clicks_count??0;
    if($("admInvalid")) $("admInvalid").textContent=stats?.invalid_clicks_count??0;
    if($("cpmInput")) $("cpmInput").value=Math.round(Number(wallet?.current_cpm_vnd||0));
    if(!rce && revctl){
      if($("confirmedAdRevenueInput")) $("confirmedAdRevenueInput").value=Math.round(Number(revctl.confirmed_ad_revenue_vnd||0));
      if($("publisherShareInput")) $("publisherShareInput").value=Number(revctl.publisher_share_percent||0);
      if($("earningsEnabledInput")) $("earningsEnabledInput").checked=!!revctl.earnings_enabled;
      if($("revenueControlStatus")){
        $("revenueControlStatus").textContent=revctl.earnings_enabled?"Earnings đang bật":"Earnings đang tạm dừng";
        $("revenueControlStatus").classList.toggle("ok",!!revctl.earnings_enabled);
      }
      if($("publisherBudgetValue")) $("publisherBudgetValue").textContent=fmtVnd(revctl.publisher_budget_vnd);
      if($("recordedEarningsValue")) $("recordedEarningsValue").textContent=fmtVnd(revctl.recorded_earnings_vnd);
      if($("remainingBudgetValue")) $("remainingBudgetValue").textContent=fmtVnd(revctl.remaining_budget_vnd);
      if($("overBudgetValue")) $("overBudgetValue").textContent=fmtVnd(revctl.over_budget_vnd);
      if($("dynamicCpmValue")) $("dynamicCpmValue").textContent=fmtVnd(revctl.publisher_cpm_vnd);
      if($("dynamicValidVisits")) $("dynamicValidVisits").textContent=`${Number(revctl.valid_visits_count||0).toLocaleString("vi-VN")} valid visits`;
    }else if(rce && $("revenueControlMsg")){
      $("revenueControlMsg").textContent=errText(rce);
    }
    if($("adminWalletEarned")) $("adminWalletEarned").textContent=fmtVnd(wallet?.total_earned_vnd);
    if($("adminWalletPending")) $("adminWalletPending").textContent=fmtVnd(wallet?.total_pending_vnd);
    if($("adminWalletApproved")) $("adminWalletApproved").textContent=fmtVnd(wallet?.total_approved_vnd);
    if($("adminWalletBalance")) $("adminWalletBalance").textContent=fmtVnd(wallet?.total_available_vnd ?? wallet?.total_balance_vnd);
    if($("adminWalletVisits")) $("adminWalletVisits").textContent=Number(wallet?.earned_visits||0);

    const balanceRows=balances||[];
    if($("walletUsersCount")) $("walletUsersCount").textContent=`${balanceRows.length} tài khoản`;
    if($("walletUsersBody")) $("walletUsersBody").innerHTML=balanceRows.map(x=>`<tr>
      <td>${esc(x.email||"—")}</td>
      <td>${esc(x.display_name||"—")}</td>
      <td>${Number(x.earned_visits||0)}</td>
      <td>${fmtVnd(x.lifetime_earned_vnd)}</td>
      <td>${fmtVnd(x.pending_vnd)}</td>
      <td>${fmtVnd(x.approved_vnd)}</td>
      <td><b>${fmtVnd(x.available_vnd)}</b></td>
    </tr>`).join("")||'<tr><td colspan="7">Chưa có dữ liệu.</td></tr>';
    if($("walletUsersCards")) $("walletUsersCards").innerHTML=balanceRows.map(x=>`<article class="mobile-admin-card">
      <div class="row-between gap"><div><b>${esc(x.display_name||"Không tên")}</b><small>${esc(x.email||"—")}</small></div><b>${fmtVnd(x.available_vnd)}</b></div>
      <div class="mini-metrics wallet-card-metrics">
        <span><b>${fmtVnd(x.lifetime_earned_vnd)}</b><small>Tổng thu nhập</small></span>
        <span><b>${fmtVnd(x.pending_vnd)}</b><small>Pending</small></span>
        <span><b>${fmtVnd(x.approved_vnd)}</b><small>Approved</small></span>
      </div>
      <small>${Number(x.earned_visits||0)} lượt đã ghi doanh thu • Khả dụng ở góc phải</small>
    </article>`).join("")||'<p class="muted">Chưa có dữ liệu.</p>';

    renderDailyChart($("adminDailyChart"),daily,$("adminWeekSummary"));

    $("usersBody").innerHTML=(users||[]).map(x=>`<tr><td>${esc(x.email)}</td><td>${esc(x.display_name||"—")}</td><td><span class="status ${x.role==="admin"?"on":"off"}">${esc(x.role)}</span></td><td>${Number(x.links_count||0)}</td><td>${Number(x.clicks_count||0)}</td><td>${Number(x.valid_clicks_count||0)}</td><td>${fmtDate(x.created_at)}</td></tr>`).join("")||'<tr><td colspan="7">Chưa có dữ liệu.</td></tr>';
    $("usersCards").innerHTML=(users||[]).map(adminUserCard).join("")||'<p class="muted">Chưa có dữ liệu.</p>';

    const linkRows=(links||[]);
    $("adminLinksBody").innerHTML=linkRows.map(x=>`<tr data-id="${esc(x.link_id)}"><td><b>${esc(x.code)}</b></td><td>${esc(x.owner_email)}</td><td class="url-cell">${esc(x.target_url)}</td><td><span class="status ${x.is_active?"on":"off"}">${x.is_active?"Bật":"Tắt"}</span></td><td>${Number(x.click_count||0)}</td><td>${Number(x.valid_click_count||0)}</td><td><div class="table-actions"><button class="ghost tiny" data-admin-action="toggle" data-active="${x.is_active?'1':'0'}">${x.is_active?'Tắt':'Bật'}</button><button class="danger tiny" data-admin-action="delete">Xóa</button></div></td></tr>`).join("")||'<tr><td colspan="7">Chưa có link.</td></tr>';
    $("adminLinksCards").innerHTML=linkRows.map(adminLinkCard).join("")||'<p class="muted">Chưa có link.</p>';

    if($("minWithdrawInput")) $("minWithdrawInput").value=Math.round(Number(wdcfg?.minimum_vnd||1000));
    if($("adminMinWithdrawPill")) $("adminMinWithdrawPill").textContent=`Tối thiểu ${fmtVnd(wdcfg?.minimum_vnd)}`;

    const withdrawalRows=withdrawals||[];
    const pendingCount=withdrawalRows.filter(x=>x.status==="pending").length;
    if($("withdrawPendingPill")) $("withdrawPendingPill").textContent=`${pendingCount} chờ duyệt`;
    const withdrawalActions=x=>x.status==="pending"?`<div class="inline-actions"><button class="small primary wd-action" data-id="${x.id}" data-action="approved">Duyệt</button><button class="small danger wd-action" data-id="${x.id}" data-action="rejected">Từ chối</button></div>`:"—";
    const payoutText=x=>[payoutMethodLabel(x.payment_method),x.payment_provider,x.payment_account_name,x.payment_account_ref].filter(Boolean).join(" • ");
    if($("withdrawAdminBody")) $("withdrawAdminBody").innerHTML=withdrawalRows.map(x=>`<tr>
      <td>${fmtDate(x.created_at)}</td>
      <td>${esc(x.email||"—")}</td>
      <td><b>${fmtVnd(x.amount_vnd)}</b></td>
      <td>${esc(payoutMethodLabel(x.payment_method))}</td>
      <td class="client-cell">${esc(payoutText(x)||"—")}</td>
      <td><span class="status ${x.status==="approved"?"on":"off"}">${esc(withdrawalStatusLabel(x.status))}</span></td>
      <td>${withdrawalActions(x)}</td>
    </tr>`).join("")||'<tr><td colspan="7">Chưa có yêu cầu rút.</td></tr>';
    if($("withdrawAdminCards")) $("withdrawAdminCards").innerHTML=withdrawalRows.map(x=>`<article class="mobile-admin-card">
      <div class="row-between gap"><div><b>${esc(x.email||"—")}</b><small>${fmtDate(x.created_at)}</small></div><b>${fmtVnd(x.amount_vnd)}</b></div>
      <small>${esc(payoutText(x)||"Chưa có thông tin nhận tiền")}</small>
      <div class="row-between gap"><span class="status ${x.status==="approved"?"on":"off"}">${esc(withdrawalStatusLabel(x.status))}</span>${withdrawalActions(x)}</div>
      <small>${esc(x.note||"Không có ghi chú")}</small>
    </article>`).join("")||'<p class="muted">Chưa có yêu cầu rút.</p>';

    const fraudRows=(fraud||[]);
    const reasonCounts={rapid_repeat:0,too_fast:0,expired:0,other:0};
    fraudRows.forEach(x=>{
      if(reasonCounts[x.reject_reason]!==undefined) reasonCounts[x.reject_reason]++;
      else reasonCounts.other++;
    });
    if($("fraudRapid")) $("fraudRapid").textContent=reasonCounts.rapid_repeat;
    if($("fraudTooFast")) $("fraudTooFast").textContent=reasonCounts.too_fast;
    if($("fraudExpired")) $("fraudExpired").textContent=reasonCounts.expired;
    if($("fraudOther")) $("fraudOther").textContent=reasonCounts.other;
    if($("fraudRatePill")) {
      const total=Number(stats?.clicks_count||0), invalid=Number(stats?.invalid_clicks_count||0);
      $("fraudRatePill").textContent=`${pct(invalid,total)}% bị từ chối`;
    }

    if($("fraudBody")) $("fraudBody").innerHTML=fraudRows.map(x=>`<tr>
      <td>${fmtDate(x.opened_at)}</td>
      <td><b>${esc(x.code)}</b></td>
      <td>${esc(x.owner_email||"—")}</td>
      <td><span class="status off">${esc(fraudReasonLabel(x.reject_reason))}</span></td>
      <td class="client-cell">${esc(x.client_key||"—")}</td>
    </tr>`).join("")||'<tr><td colspan="5">Chưa có lượt bị từ chối.</td></tr>';

    if($("fraudCards")) $("fraudCards").innerHTML=fraudRows.map(x=>`<article class="mobile-admin-card">
      <div class="row-between gap"><div><b>${esc(x.code)}</b><small>${fmtDate(x.opened_at)}</small></div><span class="status off">${esc(fraudReasonLabel(x.reject_reason))}</span></div>
      <small>${esc(x.owner_email||"—")}</small>
      <small class="client-preview">Client: ${esc(x.client_key||"—")}</small>
    </article>`).join("")||'<p class="muted">Chưa có lượt bị từ chối.</p>';
  }

  async function handleAdminAction(e){
    const btn=e.target.closest("button[data-admin-action]");if(!btn)return;
    const holder=btn.closest("[data-id]"), id=holder?.dataset.id;if(!id)return;
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
  }

  
async function loadPublisherModelAdmin(){
  if(!$('publisherModelAdmin')) return;
  const {data,error}=await sb.rpc('lynkora_admin_publisher_model_summary');
  if(error){ if($('publisherModelStatus')) $('publisherModelStatus').textContent=errText(error); return; }
  if($('publisherModelStatus')) { $('publisherModelStatus').textContent='Revenue Cycles đang hoạt động'; $('publisherModelStatus').classList.add('ok'); }
  if($('modelSettledRevenue')) $('modelSettledRevenue').textContent=fmtVnd(data?.settled_revenue_vnd);
  if($('modelPublisherBudget')) $('modelPublisherBudget').textContent=fmtVnd(data?.publisher_budget_vnd);
  if($('modelSettledEarnings')) $('modelSettledEarnings').textContent=fmtVnd(data?.settled_earnings_vnd);
  if($('modelPlatformShare')) $('modelPlatformShare').textContent=fmtVnd(data?.platform_share_vnd);
  if($('modelPaidVisits')) $('modelPaidVisits').textContent=Number(data?.paid_visits||0).toLocaleString('vi-VN');
}

async function loadRevenueCycles(){
  if(!$("cyclesBody") && !$("cyclesCards")) return;
  const {data,error}=await sb.rpc("lynkora_admin_revenue_cycles",{p_limit:24});
  if(error){
    const msg=errText(error);
    if($("cyclesBody")) $("cyclesBody").innerHTML=`<tr><td colspan="7">${esc(msg)}</td></tr>`;
    if($("cyclesCards")) $("cyclesCards").innerHTML=`<p class="muted">${esc(msg)}</p>`;
    return;
  }
  const rows=data||[];
  if($("cycleCountPill")) $("cycleCountPill").textContent=`${rows.length} chu kỳ`;
  const statusText=s=>s==="settled"?"Đã chốt":"Bản nháp";
  const period=r=>`${new Date(r.period_start).toLocaleString("vi-VN")} → ${new Date(r.period_end).toLocaleString("vi-VN")}`;
  if($("cyclesBody")) $("cyclesBody").innerHTML=rows.length?rows.map(r=>`<tr>
    <td><b>${esc(r.label)}</b><br><small>${esc(period(r))}</small></td>
    <td>${fmtVnd(r.confirmed_revenue_vnd)}</td>
    <td>${fmtVnd(r.publisher_budget_vnd)}<br><small>${Number(r.publisher_share_percent||0)}%</small></td>
    <td>${Number(r.valid_visits_count||0).toLocaleString("vi-VN")}</td>
    <td>${fmtVnd(r.cpm_vnd)}</td>
    <td><span class="pill">${statusText(r.status)}</span></td>
    <td>${r.status==="draft"?`<button class="small primary cycle-action" data-action="settle" data-id="${r.id}">Chốt kỳ</button> <button class="small danger cycle-action" data-action="delete" data-id="${r.id}">Xóa</button>`:"—"}</td>
  </tr>`).join(""):`<tr><td colspan="7">Chưa có chu kỳ.</td></tr>`;
  if($("cyclesCards")) $("cyclesCards").innerHTML=rows.length?rows.map(r=>`<article class="mobile-card">
    <div class="row-between"><b>${esc(r.label)}</b><span class="pill">${statusText(r.status)}</span></div>
    <small>${esc(period(r))}</small>
    <p>Doanh thu: <b>${fmtVnd(r.confirmed_revenue_vnd)}</b><br>Publisher: <b>${fmtVnd(r.publisher_budget_vnd)}</b> · ${Number(r.publisher_share_percent||0)}%<br>Valid: <b>${Number(r.valid_visits_count||0).toLocaleString("vi-VN")}</b> · CPM: <b>${fmtVnd(r.cpm_vnd)}</b></p>
    ${r.status==="draft"?`<div class="card-actions"><button class="small primary cycle-action" data-action="settle" data-id="${r.id}">Chốt kỳ</button><button class="small danger cycle-action" data-action="delete" data-id="${r.id}">Xóa</button></div>`:""}
  </article>`).join(""):`<p class="muted">Chưa có chu kỳ.</p>`;
}

if($("usersBody")){
    loadAdmin();
    loadRevenueCycles();
    loadPublisherModelAdmin();
    $("adminLogoutBtn").onclick=async()=>{await sb.auth.signOut();location.href="index.html"};
    $("adminRefreshBtn").onclick=()=>Promise.all([loadAdmin(),loadRevenueCycles(),loadPublisherModelAdmin()]);
    
  if($("cycleForm")) $("cycleForm").onsubmit=async e=>{
    e.preventDefault();
    if($("cycleMsg")) $("cycleMsg").textContent="Đang tạo...";
    try{
      const start=new Date($("cycleStart").value);
      const end=new Date($("cycleEnd").value);
      if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())) throw new Error("Thời gian không hợp lệ");
      const {error}=await sb.rpc("lynkora_admin_create_revenue_cycle",{
        p_label:$("cycleLabel").value.trim(),
        p_period_start:start.toISOString(),
        p_period_end:end.toISOString(),
        p_confirmed_revenue_vnd:Number($("cycleRevenue").value||0),
        p_publisher_share_percent:Number($("cycleShare").value||70)
      });
      if(error) throw error;
      if($("cycleMsg")) $("cycleMsg").textContent="Đã tạo chu kỳ.";
      $("cycleForm").reset();
      $("cycleShare").value="70";
      $("cycleRevenue").value="0";
      await loadRevenueCycles();
    }catch(ex){ if($("cycleMsg")) $("cycleMsg").textContent=errText(ex); }
  };

  document.addEventListener("click",async e=>{
    const b=e.target.closest?.(".cycle-action");
    if(!b) return;
    const id=b.dataset.id, action=b.dataset.action;
    b.disabled=true;
    try{
      if(action==="settle"){
        if(!confirm("Chốt chu kỳ này? Earnings sẽ được ghi cho valid visits của kỳ và không thể chốt lại.")) return;
        const {data,error}=await sb.rpc("lynkora_admin_settle_revenue_cycle",{p_cycle_id:id});
        if(error) throw error;
        if($("cycleMsg")) $("cycleMsg").textContent=`Đã chốt: ${Number(data?.valid_visits_count||0).toLocaleString("vi-VN")} valid visits · ${fmtVnd(data?.settled_earnings_vnd)} earnings.`;
        await Promise.all([loadRevenueCycles(),loadAdmin(),loadPublisherModelAdmin()]);
      }else if(action==="delete"){
        if(!confirm("Xóa chu kỳ bản nháp này?")) return;
        const {error}=await sb.rpc("lynkora_admin_delete_revenue_cycle",{p_cycle_id:id});
        if(error) throw error;
        if($("cycleMsg")) $("cycleMsg").textContent="Đã xóa chu kỳ bản nháp.";
        await loadRevenueCycles();
      }
    }catch(ex){ if($("cycleMsg")) $("cycleMsg").textContent=errText(ex); }
    finally{ b.disabled=false; }
  });

if($("minWithdrawForm")) $("minWithdrawForm").onsubmit=async e=>{
      e.preventDefault();
      const btn=$("minWithdrawForm").querySelector("button[type='submit']");
      const value=Number($("minWithdrawInput").value);

      if($("minWithdrawMsg")) $("minWithdrawMsg").textContent="Đang lưu...";
      if(btn) btn.disabled=true;

      try{
        const {error}=await sb.rpc("lynkora_admin_set_min_withdrawal_vnd",{
          p_value:value
        });
        if(error) throw error;

        if($("minWithdrawMsg")) $("minWithdrawMsg").textContent="Đã cập nhật mức rút tối thiểu.";
        await loadAdmin();
      }catch(ex){
        if($("minWithdrawMsg")) $("minWithdrawMsg").textContent=errText(ex);
      }finally{
        if(btn) btn.disabled=false;
      }
    };


    if($("revenueControlForm")) $("revenueControlForm").onsubmit=async e=>{
      e.preventDefault();
      const btn=$("revenueControlForm").querySelector("button[type='submit']");
      const confirmed=Number($("confirmedAdRevenueInput").value||0);
      const share=Number($("publisherShareInput").value||0);
      const enabled=!!$("earningsEnabledInput").checked;

      if($("revenueControlMsg")) $("revenueControlMsg").textContent="Đang lưu...";
      if(btn) btn.disabled=true;
      try{
        const {error}=await sb.rpc("lynkora_admin_set_revenue_control",{
          p_confirmed_ad_revenue_vnd:confirmed,
          p_publisher_share_percent:share,
          p_earnings_enabled:enabled
        });
        if(error) throw error;
        if($("revenueControlMsg")) $("revenueControlMsg").textContent="Đã cập nhật Revenue Control.";
        await loadAdmin();
      }catch(ex){
        if($("revenueControlMsg")) $("revenueControlMsg").textContent=errText(ex);
      }finally{
        if(btn) btn.disabled=false;
      }
    };
    $("adminLinksBody").onclick=handleAdminAction;
    $("adminLinksCards").onclick=handleAdminAction;

    document.addEventListener("click",async e=>{
      const btn=e.target.closest(".wd-action");
      if(!btn) return;
      const action=btn.dataset.action;
      const label=action==="approved"?"duyệt":"từ chối";
      if(!confirm(`Xác nhận ${label} yêu cầu này?`)) return;

      btn.disabled=true;
      const note=prompt("Ghi chú Admin (có thể để trống):")||null;
      const {error}=await sb.rpc("lynkora_admin_decide_withdrawal",{
        p_request_id:btn.dataset.id,
        p_status:action,
        p_admin_note:note
      });
      if(error){
        alert(errText(error));
        btn.disabled=false;
        return;
      }
      await loadAdmin();
    });

  }
})();