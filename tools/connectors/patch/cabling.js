  /* ---------------- Cabling ----------------
     A gallery of every connector on the owner's three charts, each a 3D
     model drawn to its real dimensions (tools/connectors/) and shown from
     two fixed views; and a drill run to the program's rules:
       six options, one right and five near misses;
       a wrong pick turns red and stays red (a red ground, an inset rule,
       and the words "Ruled out") until solved or cleared;
       misses 1-2: nothing; 3: where to look; 4: the principle; 5 and
       every miss after, for ever: the field narrowed to two, with a
       reason on every option struck. Nothing ever names the answer, and
       nothing locks a student out. */
  /* CABLING-CATALOG:BEGIN */
  /* CABLING-CATALOG:END */
  /* CABLING-IMAGES:BEGIN */
  var CABLING_IMG = {};
  /* CABLING-IMAGES:END */

  var CAB_BY_ID = {};
  CABLING_CATALOG.forEach(function (c) { CAB_BY_ID[c.id] = c; });

  function cabViews(c) {
    return c.kind === "port" ? [["end", "Face-on"], ["angle", "Angled"]] : [["end", "End view"], ["top", "Top view"]];
  }
  function cabHasImages(c) {
    return cabViews(c).every(function (v) { return !!CABLING_IMG[c.id + "--" + v[0]]; });
  }
  function cabEl(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function cabFigures(id, alt) {
    var c = CAB_BY_ID[id], wrap = cabEl("div", "cab-views");
    cabViews(c).forEach(function (v) {
      var fig = cabEl("figure"), img = document.createElement("img");
      img.src = CABLING_IMG[id + "--" + v[0]];
      img.alt = alt + ", " + v[1].toLowerCase();
      img.width = 480; img.height = 360; img.decoding = "async";
      fig.appendChild(img);
      fig.appendChild(cabEl("figcaption", null, v[1]));
      wrap.appendChild(fig);
    });
    return wrap;
  }

  /* ---- the gallery ---- */
  var cabTag = "obj", cabFam = "all";
  var cabFamilySelect = document.getElementById("cabFamily");
  CABLING_FAMILIES.forEach(function (f) {
    var o = cabEl("option", null, f[1]); o.value = f[0]; cabFamilySelect.appendChild(o);
  });
  function cabCard(c) {
    var card = cabEl("article", "cab-card"), head = cabEl("div", "cab-card__head");
    head.appendChild(cabEl("h4", null, c.name));
    head.appendChild(cabEl("span", "cab-tag" + (c.obj ? " cab-tag--obj" : ""), c.obj ? "On your objectives" : "Good to recognize"));
    card.appendChild(head);
    card.appendChild(cabFigures(c.id, c.name));
    var dl = cabEl("dl", "cab-facts");
    [["Plug or port", c.kind === "port" ? "Port (socket)" : "Plug"], ["Used for", c.use], ["Tell it by", c.trait]].forEach(function (row) {
      dl.appendChild(cabEl("dt", null, row[0]));
      dl.appendChild(cabEl("dd", null, row[1]));
    });
    card.appendChild(dl);
    return card;
  }
  function renderCablingGallery() {
    var grid = document.getElementById("cabGallery");
    grid.innerHTML = "";
    var list = CABLING_CATALOG.filter(function (c) {
      return cabHasImages(c) && (cabTag === "all" || (cabTag === "obj") === c.obj) && (cabFam === "all" || c.fam === cabFam);
    });
    list.forEach(function (c) { grid.appendChild(cabCard(c)); });
    if (!list.length) grid.appendChild(cabEl("p", "cab-empty", "None in this family under this filter. Choose All to see them."));
    document.getElementById("cabCount").textContent = list.length + (list.length === 1 ? " connector" : " connectors");
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-cab-tag]"), function (btn, i, all) {
    btn.addEventListener("click", function () {
      cabTag = btn.getAttribute("data-cab-tag");
      Array.prototype.forEach.call(all, function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      renderCablingGallery();
    });
  });
  cabFamilySelect.addEventListener("change", function () { cabFam = cabFamilySelect.value; renderCablingGallery(); });

  /* ---- the drill ---- */
  var cabPool = "obj", cabDeck = [], cabAsked = 0, cabSolved = 0, cabHandle = null, cablingInstructorMode = false;
  function cabItems() {
    var items = CABLING_CATALOG.filter(function (c) { return cabHasImages(c) && (cabPool === "all" || c.obj); })
      .map(function (c) { return { c: c }; });
    CABLING_SCENARIOS.forEach(function (s) {
      if ((cabPool === "all" || s.obj) && (!s.img || cabHasImages(CAB_BY_ID[s.img]))) items.push({ s: s });
    });
    return items;
  }
  function cabQuestionFor(item) {
    if (item.c) {
      var c = item.c, fh = CABLING_FAMILY_HINTS[c.fam];
      return { answer: c.id, near: c.near, pic: c.id, alt: "The " + (c.kind === "port" ? "port" : "connector") + " to identify",
        ask: c.kind === "port" ? "Which port is this?" : "Which connector is this?",
        h1: c.h1 || fh[0], h2: c.h2 || fh[1], strike: {},
        why: function () { return ["Used for: " + c.use, "Tell it by: " + c.trait]; } };
    }
    var s = item.s, a = CAB_BY_ID[s.answer];
    return { answer: s.answer, near: s.near, pic: s.img, alt: "The port in the question", ask: s.ask,
      h1: s.h1, h2: s.h2, strike: s.strike || {},
      why: function () { return [s.why, "Tell it by: " + a.trait]; } };
  }
  function cabQuestion(item) {
    var q = cabQuestionFor(item), out = {}, wrongs = 0, done = false, revealed = false;
    var card = cabEl("div", "cab-drill");
    var meta = cabEl("div", "cab-drill__meta");
    var metaQ = cabEl("span", null, "Question " + cabAsked), metaS = cabEl("span");
    meta.appendChild(metaQ); meta.appendChild(metaS);
    function showSolved() { metaS.textContent = "Solved so far: " + cabSolved; }
    showSolved();
    card.appendChild(meta);
    if (q.pic) card.appendChild(cabFigures(q.pic, q.alt));
    card.appendChild(cabEl("p", "cab-drill__ask", q.ask));

    var opts = cabEl("div", "cab-opts"), buttons = {};
    shuffleArray([q.answer].concat(q.near)).forEach(function (id) {
      var b = cabEl("button", "cab-opt");
      b.type = "button";
      b.setAttribute("data-cab-opt", id);
      b.appendChild(cabEl("span", "cab-opt__name", CAB_BY_ID[id].name));
      b.appendChild(cabEl("span", "cab-opt__state"));
      b.appendChild(cabEl("span", "cab-opt__why"));
      b.addEventListener("click", function () { pick(id); });
      buttons[id] = b;
      opts.appendChild(b);
    });
    card.appendChild(opts);

    var msg = cabEl("div", "cab-msg");
    msg.setAttribute("aria-live", "polite");
    card.appendChild(msg);
    var hints = cabEl("div", "cab-hints");
    function hintBox(label, text) {
      var box = cabEl("div", "cab-hint");
      box.appendChild(cabEl("strong", null, label));
      box.appendChild(document.createTextNode(text));
      box.hidden = true;
      hints.appendChild(box);
      return box;
    }
    var h1 = hintBox("Hint 1 — where to look", q.h1);
    var h2 = hintBox("Hint 2 — what decides it", q.h2);
    var h3 = hintBox("Hint 3 — down to two", "Every option struck above says why it can't be this one. Two are left: compare them with the picture and the hints.");
    card.appendChild(hints);
    var explain = cabEl("div", "cab-explain");
    explain.hidden = true;
    card.appendChild(explain);

    var row = cabEl("div", "cab-row");
    var clearBtn = cabEl("button", "cab-btn cab-btn--ghost", "Clear my red marks");
    clearBtn.type = "button";
    var nextBtn = cabEl("button", "cab-btn cab-btn--ghost", "Next connector");
    nextBtn.type = "button";
    row.appendChild(clearBtn); row.appendChild(nextBtn);
    card.appendChild(row);

    function setState(id, cls, state, why) {
      var b = buttons[id];
      b.classList.remove("is-out", "is-right", "is-shown");
      if (cls) b.classList.add(cls);
      b.querySelector(".cab-opt__state").textContent = state || "";
      b.querySelector(".cab-opt__why").textContent = why || "";
    }
    function strikeReason(id) {
      return q.strike[id] || ("It would show " + CAB_BY_ID[id].tell + ".");
    }
    /* rung 3: keep the answer and the closest near miss still standing; strike the rest, each with its reason */
    function narrow() {
      var keep = null;
      q.near.forEach(function (n) { if (!keep && !out[n]) keep = n; });
      q.near.forEach(function (n) {
        if (n === keep) return;
        out[n] = true;
        setState(n, "is-out", "Ruled out", strikeReason(n));
      });
    }
    function help() {
      var left = 3 - wrongs;
      msg.textContent = wrongs < 3
        ? "Ruled out. " + left + (left === 1 ? " more miss" : " more misses") + " before the first hint."
        : "Ruled out. Use the " + (wrongs >= 4 ? "hints" : "hint") + " below.";
      h1.hidden = wrongs < 3;
      h2.hidden = wrongs < 4;
      h3.hidden = wrongs < 5;
      if (wrongs >= 5) narrow();
    }
    function finish(shown) {
      done = true;
      setState(q.answer, shown ? "is-shown" : "is-right", shown ? "Shown by instructor" : "Correct");
      Object.keys(buttons).forEach(function (id) { buttons[id].disabled = true; });
      clearBtn.hidden = true;
      explain.innerHTML = "";
      explain.appendChild(cabEl("strong", null, (shown ? "Shown by instructor: " : "Right: ") + CAB_BY_ID[q.answer].name + "."));
      q.why().forEach(function (line) { explain.appendChild(cabEl("p", null, line)); });
      explain.hidden = false;
      msg.textContent = shown ? "" : "Got it.";
      nextBtn.className = "cab-btn";
    }
    function pick(id) {
      if (done) return;
      if (id === q.answer) {
        cabSolved++;
        showSolved();
        finish(false);
        return;
      }
      if (out[id]) return;
      out[id] = true;
      wrongs++;
      setState(id, "is-out", "Ruled out", wrongs >= 5 ? strikeReason(id) : "");
      help();
    }
    /* clearing wipes the red marks but not the help already earned:
       from rung 3 on, the field is narrowed again straight away */
    clearBtn.addEventListener("click", function () {
      if (done) return;
      out = {};
      q.near.forEach(function (n) { setState(n, null); });
      msg.textContent = wrongs ? "Red marks cleared. Your hints stay." : "";
      if (wrongs >= 5) narrow();
    });
    nextBtn.addEventListener("click", cabNext);

    var handle = {
      el: card,
      reveal: function () {
        if (done) return;
        revealed = true;
        finish(true);
      },
      hideIfRevealed: function () {
        if (!revealed) return;
        var fresh = cabQuestion(item);
        card.replaceWith(fresh.el);
        cabHandle = fresh;
      }
    };
    return handle;
  }
  function cabNext() {
    if (!cabDeck.length) cabDeck = shuffleArray(cabItems());
    var item = cabDeck.shift();
    cabAsked++;
    var container = document.getElementById("cablingContainer");
    container.innerHTML = "";
    cabHandle = cabQuestion(item);
    container.appendChild(cabHandle.el);
    if (cablingInstructorMode) cabHandle.reveal();
  }
  document.getElementById("cabPool").addEventListener("change", function () {
    cabPool = this.value;
    cabDeck = [];
    cabNext();
  });
  wireInstructorToggle(
    document.getElementById("cablingInstructorToggle"),
    document.getElementById("cablingInstructorMsg"),
    function () { return cabHandle ? [cabHandle] : []; },
    function (v) { cablingInstructorMode = v; }
  );
  renderCablingGallery();
  cabNext();
