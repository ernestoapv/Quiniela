/* Quiniela "Hay que revolverle" — frontend estático (bracket completo).
   Habla con el backend de Apps Script (Google Sheets) por POST. */

(function () {
  "use strict";

  var CFG = window.QUINIELA_CONFIG || {};
  var ID_TOKEN = null;
  var PROFILE = null;
  var STATE = null;
  var VIEW = "quiniela";
  var QSTAGE = null; // etapa seleccionada en "Mi quiniela"
  var SELECTIONS = {}; // { order: choice }

  var appEl = document.getElementById("app");
  var signinEl = document.getElementById("signin");
  var ORD = ["A", "B", "AP", "BP"];

  // ── Puntaje (debe coincidir con apps-script/Code.gs) ──────────
  function winnerOf(c) { return c === "A" || c === "AP" ? "A" : c === "B" || c === "BP" ? "B" : null; }
  function isPenales(c) { return c === "AP" || c === "BP"; }
  function scoreFor(p, r) {
    if (!r || !p) return 0;
    var s = 0, w = winnerOf(p);
    if (w && w === winnerOf(r)) s += 1;
    if (isPenales(p) && p === r) s += 0.5;
    return s;
  }
  function formatPoints(n) { return n % 1 === 0 ? String(n) : n.toFixed(1); }
  function kicker(c) { return isPenales(c) ? "En penales" : "Gana"; }
  function choiceTeam(c, m) { return winnerOf(c) === "A" ? m.teamA : m.teamB; }
  function resultLabel(r, m) {
    if (r === "A") return m.teamA;
    if (r === "B") return m.teamB;
    if (r === "AP") return m.teamA + " (penales)";
    if (r === "BP") return m.teamB + " (penales)";
    return "—";
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function initial(name) { return (String(name).trim().charAt(0) || "?").toUpperCase(); }
  function ready(m) { return !!(m.teamA && m.teamB); }

  // ── API ───────────────────────────────────────────────────────
  async function api(action, params) {
    var body = Object.assign({ action: action, idToken: ID_TOKEN }, params || {});
    var res = await fetch(CFG.GAS_URL, { method: "POST", body: JSON.stringify(body) });
    var data = await res.json();
    if (data && data.needLogin) {
      ID_TOKEN = null;
      showSignin("Tu sesión expiró. Vuelve a entrar con Google.");
      throw new Error("needLogin");
    }
    return data;
  }

  // ── Google Sign-In ────────────────────────────────────────────
  function decodeJwt(token) {
    try {
      var p = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      var json = decodeURIComponent(atob(p).split("").map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(""));
      return JSON.parse(json);
    } catch (e) { return {}; }
  }
  function onCredential(response) {
    ID_TOKEN = response.credential;
    var p = decodeJwt(ID_TOKEN);
    PROFILE = { email: p.email, name: p.name || p.email, picture: p.picture || "" };
    load();
  }
  function initGis() {
    if (!window.google || !google.accounts || !google.accounts.id) return setTimeout(initGis, 200);
    if (!CFG.GOOGLE_CLIENT_ID || CFG.GOOGLE_CLIENT_ID.indexOf("PEGA_AQUI") === 0) {
      document.getElementById("signin-msg").textContent = "Falta configurar GOOGLE_CLIENT_ID en config.js";
      return;
    }
    google.accounts.id.initialize({ client_id: CFG.GOOGLE_CLIENT_ID, callback: onCredential, auto_select: true });
    google.accounts.id.renderButton(document.getElementById("gbtn"), { theme: "outline", size: "large", text: "signin_with", shape: "pill", locale: "es" });
    google.accounts.id.prompt();
  }
  function signOut() {
    if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
    ID_TOKEN = null; PROFILE = null; STATE = null;
    showSignin("");
  }
  function showSignin(msg) {
    appEl.classList.add("app-hidden"); appEl.innerHTML = "";
    signinEl.style.display = "flex";
    var m = document.getElementById("signin-msg");
    if (m) m.textContent = msg || "";
  }

  // ── Carga de estado ───────────────────────────────────────────
  async function load() {
    try {
      var data = await api("state");
      if (!data.ok) { showSignin("No se pudo cargar (" + (data.error || "error") + ")."); return; }
      STATE = data;
      SELECTIONS = Object.assign({}, data.myPredictions || {});
      if (!QSTAGE || !stageByKey(QSTAGE)) QSTAGE = defaultStageKey();
      signinEl.style.display = "none";
      appEl.classList.remove("app-hidden");
      render();
    } catch (e) { /* needLogin manejado */ }
  }

  function stageByKey(k) { return (STATE.stages || []).filter(function (s) { return s.key === k; })[0]; }
  function defaultStageKey() {
    var open = (STATE.stages || []).filter(function (s) { return s.isOpen; })[0];
    return (open || STATE.stages[0]).key;
  }
  function allMatches() {
    var out = [];
    (STATE.stages || []).forEach(function (s) { s.matches.forEach(function (m) { out.push(m); }); });
    return out;
  }

  // ── Render ─────────────────────────────────────────────────────
  function render() { appEl.innerHTML = topbar() + view(); }

  function topbar() {
    var av = PROFILE && PROFILE.picture
      ? '<img class="avatar" src="' + escapeHtml(PROFILE.picture) + '" alt="" referrerpolicy="no-referrer">'
      : '<span class="avatar">' + initial(PROFILE ? PROFILE.name : "?") + "</span>";
    var tabs = tab("quiniela", "Mi quiniela") + tab("posiciones", "Posiciones") + (STATE.isAdmin ? tab("admin", "Admin") : "");
    return '<header class="topbar"><div class="topbar-inner">' +
      '<span class="brand">' + logoSvg() + '<span class="brand-name">Hay que revolverle</span></span>' +
      '<nav class="nav">' + tabs + "</nav>" +
      '<span class="userbox">' + av + '<button class="link-btn" data-act="signout">Salir</button></span>' +
      "</div></header>";
  }
  function tab(v, label) { return '<button class="tab ' + (VIEW === v ? "active" : "") + '" data-view="' + v + '">' + label + "</button>"; }
  function logoSvg() {
    return '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#0b6b3a"/>' +
      '<circle cx="16" cy="16" r="9" fill="#fff"/><path d="M16 9.2l3.1 2.25-1.18 3.65h-3.84L12.9 11.45 16 9.2z" fill="#075028"/></svg>';
  }

  function view() {
    if (VIEW === "posiciones") return viewPosiciones();
    if (VIEW === "admin" && STATE.isAdmin) return viewAdmin();
    return viewQuiniela();
  }

  // ── Mi quiniela ────────────────────────────────────────────────
  function viewQuiniela() {
    var matches = allMatches();
    var points = 0, resolved = 0, filled = 0;
    matches.forEach(function (m) {
      if (SELECTIONS[m.order]) filled++;
      if (m.result) { resolved++; points += scoreFor(SELECTIONS[m.order], m.result); }
    });

    var head = '<div class="page-head"><p class="overline">Bracket del torneo</p>' +
      "<h2>" + escapeHtml(STATE.tournamentName) + "</h2>" +
      '<div class="meta-row"><span>' + filled + " pronósticos</span>" +
      (resolved > 0 ? '<span class="accent">' + formatPoints(points) + (points === 1 ? " punto" : " puntos") + "</span>" : "") +
      "</div></div>";

    var chips = '<div class="chips">' + STATE.stages.map(function (s) {
      var dot = s.isOpen ? "open" : "closed";
      return '<button class="chip ' + (s.key === QSTAGE ? "active" : "") + '" data-stage-tab="' + s.key + '">' +
        '<span class="dot ' + dot + '"></span>' + escapeHtml(s.label) + "</button>";
    }).join("") + "</div>";

    var stage = stageByKey(QSTAGE);
    var cards = stage.matches.map(function (m) { return matchCard(m, stage); }).join("");

    var canEdit = stage.isOpen && stage.matches.some(ready);
    var footer = canEdit
      ? '<div class="savebar"><span class="msg" id="save-msg">Marca tus resultados y guarda.</span><button class="btn btn-primary" data-act="save">Guardar</button></div>'
      : stage.isOpen
        ? '<p class="notice info">Esta etapa abrirá cuando se definan los equipos de la ronda anterior.</p>'
        : '<p class="notice">Esta etapa está cerrada. No puedes modificar tus pronósticos.</p>';

    return '<main class="container">' + head + chips + cards + footer + "</main>";
  }

  function matchCard(m, stage) {
    var editable = stage.isOpen && ready(m);

    if (!ready(m)) {
      return '<div class="card tbd"><div class="match-head"><span class="num">' + m.order + "</span>" +
        '<span class="muted">Por definir</span></div>' +
        '<div class="grid2">' + ORD.map(function (c) {
          return '<div class="opt locked dim"><span class="kicker">' + kicker(c) + '</span><span class="team">—</span></div>';
        }).join("") + "</div></div>";
    }

    var pick = SELECTIONS[m.order];
    var winnerCorrect = m.result ? winnerOf(pick) === winnerOf(m.result) : false;
    var pts = m.result ? scoreFor(pick, m.result) : 0;
    var badge = m.result
      ? '<span class="right"><span class="tag">Resultado: ' + escapeHtml(resultLabel(m.result, m)) + "</span>" +
        '<span class="pts-tag ' + (pts > 0 ? "win" : "zero") + '">+' + formatPoints(pts) + "</span></span>"
      : "";

    var opts = ORD.map(function (c) {
      var cls = optClass(c, m, pick, editable, winnerCorrect);
      var attrs = editable ? ' data-order="' + m.order + '" data-choice="' + c + '"' : "";
      return '<div class="' + cls + '"' + attrs + '><span class="kicker">' + kicker(c) + "</span>" +
        '<span class="team">' + escapeHtml(choiceTeam(c, m)) + "</span></div>";
    }).join("");

    return '<div class="card"><div class="match-head"><span class="num">' + m.order + "</span>" +
      "<span>" + escapeHtml(m.teamA) + '</span><span class="vs">vs</span><span>' + escapeHtml(m.teamB) + "</span>" +
      badge + '</div><div class="grid2">' + opts + "</div></div>";
  }

  function optClass(c, m, pick, editable, winnerCorrect) {
    var base = "opt";
    var selected = pick === c;
    if (editable) return base + (selected ? " selected" : "");
    base += " locked";
    if (selected && m.result && winnerCorrect) return base + " correct";
    if (selected && m.result && !winnerCorrect) return base + " wrong";
    if (selected) return base + " selected";
    if (m.result === c) return base + " is-result";
    return base + " dim";
  }

  // ── Posiciones ─────────────────────────────────────────────────
  function viewPosiciones() {
    var lb = STATE.leaderboard || [];
    var matches = allMatches();
    var total = matches.length;
    var resolved = matches.filter(function (m) { return m.result; }).length;

    var head = '<div class="page-head"><p class="overline">Tabla de posiciones</p><h2>Clasificación general</h2>' +
      '<p class="muted" style="margin:8px 0 0;font-size:14px">' + resolved + " de " + total + " partidos definidos.</p>" +
      '<p class="legend"><b>Puntos:</b> 1 por acertar al ganador · <span class="accent">+0.5</span> si aciertas que ganó en penales</p></div>';

    if (!lb.length) return '<main class="container">' + head + '<div class="empty">Aún no hay participantes con pronósticos.</div></main>';

    var rows = lb.map(function (r, i) {
      var me = PROFILE && String(r.email).toLowerCase() === String(PROFILE.email).toLowerCase();
      var rank = i + 1, rankCls = rank <= 3 ? "rank medal m" + rank : "rank";
      return '<div class="standing ' + (me ? "me" : "") + '"><span class="' + rankCls + '">' + rank + "</span>" +
        '<span class="avatar">' + initial(r.name) + '</span><div class="who"><div class="name">' + escapeHtml(r.name) +
        (me ? '<span class="me-badge">Tú</span>' : "") + '</div><div class="sub">' + r.filled + " pronósticos</div></div>" +
        '<div class="pts"><div class="n">' + formatPoints(r.points) + '</div><div class="u">pts</div></div></div>';
    }).join("");

    return '<main class="container">' + head + rows + "</main>";
  }

  // ── Admin ──────────────────────────────────────────────────────
  function viewAdmin() {
    var head = '<div class="page-head"><h2>Administración</h2>' +
      '<p class="muted" style="margin:6px 0 0;font-size:14px">Abre o cierra cada etapa y registra los resultados. Los ganadores avanzan solos a la siguiente llave.</p></div>';

    var sections = STATE.stages.map(function (st) {
      var toggle = '<button class="btn ' + (st.isOpen ? "btn-amber" : "btn-green") + ' btn-sm" data-act="stage-toggle" data-stage="' + st.key + '" data-open="' + (!st.isOpen) + '">' +
        (st.isOpen ? "Cerrar" : "Abrir") + "</button>";
      var header = '<div class="stage-head"><div><span class="stage-title">' + escapeHtml(st.label) + "</span> " +
        '<span class="status ' + (st.isOpen ? "open" : "closed") + '">' + (st.isOpen ? "Abierta" : "Cerrada") + "</span></div>" + toggle + "</div>";

      var cards = st.matches.map(function (m) {
        if (!ready(m)) {
          return '<div class="card tbd"><div class="match-head"><span class="num">' + m.order + '</span><span class="muted">Por definir (esperando ronda anterior)</span></div></div>';
        }
        function rb(val, label) {
          return '<button class="res-btn ' + (m.result === val ? "active" : "") + '" data-act="result" data-order="' + m.order + '" data-result="' + val + '">' + escapeHtml(label) + "</button>";
        }
        return '<div class="card"><div class="match-head"><span class="num">' + m.order + "</span>" +
          "<span>" + escapeHtml(m.teamA) + '</span><span class="vs">vs</span><span>' + escapeHtml(m.teamB) + "</span></div>" +
          '<div class="res-grid">' + rb("A", "Gana " + m.teamA) + rb("B", "Gana " + m.teamB) +
          rb("AP", m.teamA + " en penales") + rb("BP", m.teamB + " en penales") + "</div>" +
          '<div class="res-clear"><button class="res-btn full ' + (!m.result ? "active" : "") + '" data-act="result" data-order="' + m.order + '" data-result="">Limpiar resultado</button></div></div>';
      }).join("");

      return '<section class="stage-sec">' + header + cards + "</section>";
    }).join("");

    return '<main class="container">' + head + sections + "</main>";
  }

  // ── Eventos ────────────────────────────────────────────────────
  document.addEventListener("click", async function (ev) {
    var t = ev.target.closest("[data-view],[data-act],[data-choice],[data-stage-tab]");
    if (!t) return;

    if (t.hasAttribute("data-view")) { VIEW = t.getAttribute("data-view"); render(); return; }
    if (t.hasAttribute("data-stage-tab")) { QSTAGE = t.getAttribute("data-stage-tab"); render(); return; }

    if (t.hasAttribute("data-choice")) {
      var order = t.getAttribute("data-order");
      SELECTIONS[order] = t.getAttribute("data-choice");
      Array.prototype.forEach.call(t.parentNode.children, function (ch) { ch.classList.toggle("selected", ch === t); });
      var msg = document.getElementById("save-msg");
      if (msg) msg.textContent = "Cambios sin guardar.";
      return;
    }

    var act = t.getAttribute("data-act");
    if (act === "signout") return signOut();

    if (act === "save") {
      t.disabled = true;
      var sm = document.getElementById("save-msg");
      if (sm) sm.textContent = "Guardando…";
      try {
        var r = await api("save", { predictions: SELECTIONS });
        if (r.ok) { if (sm) sm.textContent = "✅ Pronósticos guardados"; toast("Guardado"); }
        else if (sm) sm.textContent = "⚠️ " + (r.error || "Error");
      } catch (e) {}
      t.disabled = false;
      return;
    }

    if (act === "stage-toggle") {
      t.disabled = true;
      var r1 = await api("setStageOpen", { stage: t.getAttribute("data-stage"), open: t.getAttribute("data-open") === "true" });
      if (r1.ok) await load();
      return;
    }

    if (act === "result") {
      var r2 = await api("setResult", { order: t.getAttribute("data-order"), result: t.getAttribute("data-result") });
      if (r2.ok) { await load(); toast("Resultado guardado · ganadores avanzados"); }
      return;
    }
  });

  function toast(text) {
    var el = document.createElement("div");
    el.className = "toast"; el.textContent = text;
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("show"); });
    setTimeout(function () { el.classList.remove("show"); setTimeout(function () { el.remove(); }, 250); }, 1800);
  }

  // ── Arranque ───────────────────────────────────────────────────
  if (!CFG.GAS_URL || CFG.GAS_URL.indexOf("PEGA_AQUI") === 0) {
    document.getElementById("signin-msg").textContent = "Falta configurar GAS_URL en config.js";
  }
  initGis();
})();
