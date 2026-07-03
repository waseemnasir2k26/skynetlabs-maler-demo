/* Amigos Maler demo — shared engine: Offerte-Rechner, Vision Studio, BA-sliders, FAQ, reveal.
   Demo by SkynetLabs. All prices = Swiss aggregator ranges (ofri/houzy/baunex), Richtpreise only. */
(function () {
  "use strict";

  /* ---------- helpers ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const chf = (n) =>
    "CHF " + Math.round(n).toLocaleString("de-CH").replace(/,/g, "'");
  const round50 = (n) => Math.round(n / 50) * 50;

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.12 },
  );
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- sticky header after hero ---------- */
  const hdr = $("header");
  if (hdr) {
    addEventListener(
      "scroll",
      () => {
        hdr.classList.toggle("scrolled", scrollY > 480);
      },
      { passive: true },
    );
  }

  /* ---------- FAQ accordion ---------- */
  $$(".faq-item").forEach((item) => {
    const btn = $(".faq-q", item);
    btn &&
      btn.addEventListener("click", () => {
        const open = item.classList.contains("open");
        $$(".faq-item.open").forEach((i) => i.classList.remove("open"));
        if (!open) item.classList.add("open");
      });
  });

  /* ---------- Vorher/Nachher sliders ---------- */
  $$(".ba").forEach((ba) => {
    const range = $(".ba-range", ba);
    const after = $(".ba-after", ba);
    const handle = $(".ba-handle", ba);
    if (!range || !after) return;
    const set = (v) => {
      after.style.clipPath = "inset(0 0 0 " + v + "%)";
      if (handle) handle.style.left = v + "%";
    };
    range.addEventListener("input", () => set(range.value));
    set(range.value || 50);
  });

  /* =======================================================
     OFFERTE-RECHNER — Richtpreise CHF (Region Olten, 2026)
     ======================================================= */
  const RATES = {
    wall: 20,
    wallPrep: 25,
    ceiling: 25,
    facade: 50,
    scaffold: 15,
    door: 150,
    minJob: 450,
  };

  const QZ = {
    step: 0,
    data: { type: "zimmer", area: 20, ceiling: true, prep: false, doors: 0 },
    steps: ["type", "size", "extras", "result"],
  };

  function qzCalc() {
    const d = QZ.data;
    let low = 0,
      high = 0,
      lines = [];
    if (d.type === "fassade") {
      const wallRate = RATES.facade,
        area = d.area;
      const paint = area * wallRate,
        scaff = area * RATES.scaffold;
      lines.push(["Fassadenanstrich " + area + " m²", paint]);
      lines.push(["Gerüst (Richtwert)", scaff]);
      low = (paint + scaff) * 0.85;
      high = (paint + scaff) * 1.2;
    } else {
      const wallArea = Math.round(d.area * 2.6);
      const rate = d.prep ? RATES.wallPrep : RATES.wall;
      const walls = wallArea * rate;
      lines.push([
        "Wände ~" +
          wallArea +
          " m² × " +
          chf(rate).replace("CHF ", "CHF ") +
          "/m²",
        walls,
      ]);
      let ceil = 0;
      if (d.ceiling) {
        ceil = d.area * RATES.ceiling;
        lines.push(["Decken " + d.area + " m²", ceil]);
      }
      let doors = 0;
      if (d.doors > 0) {
        doors = d.doors * RATES.door;
        lines.push([d.doors + " Türe(n) mit Rahmen", doors]);
      }
      const sum = Math.max(walls + ceil + doors, RATES.minJob);
      low = sum * 0.85;
      high = sum * 1.15;
    }
    return { low: round50(low), high: round50(high), lines };
  }

  function qzRender() {
    const root = $("#offerte");
    if (!root) return;
    $$(".qz-step", root).forEach((el, i) =>
      el.classList.toggle("active", i === QZ.step),
    );
    $$(".qz-dot", root).forEach((el, i) =>
      el.classList.toggle("on", i <= QZ.step),
    );
    const back = $(".qz-back", root);
    if (back) back.style.visibility = QZ.step === 0 ? "hidden" : "visible";
    const next = $(".qz-next", root);
    if (next)
      next.textContent =
        QZ.step === QZ.steps.length - 2 ? "Richtpreis berechnen →" : "Weiter →";
    if (next)
      next.style.display = QZ.step === QZ.steps.length - 1 ? "none" : "";

    // size step labels depend on type
    const sizeLabel = $(".qz-size-label", root);
    if (sizeLabel)
      sizeLabel.textContent =
        QZ.data.type === "fassade" ? "Fassadenfläche (m²)" : "Wohnfläche (m²)";
    const extras = $(".qz-extras-int", root);
    if (extras) extras.style.display = QZ.data.type === "fassade" ? "none" : "";
    const extrasFas = $(".qz-extras-fas", root);
    if (extrasFas)
      extrasFas.style.display = QZ.data.type === "fassade" ? "" : "none";

    if (QZ.steps[QZ.step] === "result") qzResult(root);
  }

  function qzResult(root) {
    const { low, high, lines } = qzCalc();
    const out = $(".qz-lines", root);
    if (out)
      out.innerHTML = lines
        .map(
          (l) =>
            '<div class="qz-line"><span>' +
            l[0] +
            "</span><span>" +
            chf(l[1]) +
            "</span></div>",
        )
        .join("");
    // animated count-up
    const lowEl = $(".qz-low", root),
      highEl = $(".qz-high", root);
    const t0 = performance.now(),
      dur = 900;
    (function tick(t) {
      const p = Math.min((t - t0) / dur, 1),
        e = 1 - Math.pow(1 - p, 3);
      if (lowEl) lowEl.textContent = chf(low * e);
      if (highEl) highEl.textContent = chf(high * e);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
    // prefill WhatsApp link
    const wa = $(".qz-wa", root);
    if (wa) {
      const d = QZ.data;
      const msg =
        "Grüezi Herr Arias — ich habe den Online-Rechner benutzt. Projekt: " +
        (d.type === "fassade"
          ? "Fassade " + d.area + " m²"
          : d.type +
            ", " +
            d.area +
            " m² Wohnfläche" +
            (d.ceiling ? ", inkl. Decken" : "") +
            (d.doors ? ", " + d.doors + " Türen" : "")) +
        ". Richtpreis " +
        chf(low) +
        "–" +
        chf(high) +
        ". Bitte um eine verbindliche Offerte.";
      wa.href = "https://wa.me/41792965876?text=" + encodeURIComponent(msg);
    }
  }

  function qzInit() {
    const root = $("#offerte");
    if (!root) return;
    $$(".qz-type", root).forEach((btn) =>
      btn.addEventListener("click", () => {
        $$(".qz-type", root).forEach((b) => b.classList.remove("sel"));
        btn.classList.add("sel");
        QZ.data.type = btn.dataset.type;
        QZ.data.area =
          btn.dataset.type === "fassade"
            ? 150
            : btn.dataset.type === "wohnung"
              ? 90
              : 20;
        const slider = $(".qz-area", root);
        if (slider) {
          slider.value = QZ.data.area;
        }
        qzArea();
      }),
    );
    const slider = $(".qz-area", root);
    function qzArea() {
      if (!slider) return;
      QZ.data.area = +slider.value;
      const v = $(".qz-area-val", root);
      if (v) v.textContent = slider.value + " m²";
    }
    slider && slider.addEventListener("input", qzArea);
    qzArea();

    $$(".qz-tog", root).forEach((t) =>
      t.addEventListener("click", () => {
        t.classList.toggle("sel");
        const k = t.dataset.key;
        if (k === "ceiling" || k === "prep")
          QZ.data[k] = t.classList.contains("sel");
      }),
    );
    const doors = $(".qz-doors", root);
    doors &&
      doors.addEventListener("input", () => {
        QZ.data.doors = +doors.value;
        const v = $(".qz-doors-val", root);
        if (v) v.textContent = doors.value;
      });

    const next = $(".qz-next", root),
      back = $(".qz-back", root);
    next &&
      next.addEventListener("click", () => {
        if (QZ.step < QZ.steps.length - 1) {
          QZ.step++;
          qzRender();
        }
      });
    back &&
      back.addEventListener("click", () => {
        if (QZ.step > 0) {
          QZ.step--;
          qzRender();
        }
      });
    const restart = $(".qz-restart", root);
    restart &&
      restart.addEventListener("click", () => {
        QZ.step = 0;
        qzRender();
      });
    qzRender();
  }
  qzInit();

  /* =======================================================
     VISION STUDIO — SVG room recolor + photo brush mode
     ======================================================= */
  const shade = (hex, f) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * f),
      g = Math.round(((n >> 8) & 255) * f),
      b = Math.round((n & 255) * f);
    return "rgb(" + r + "," + g + "," + b + ")";
  };

  function vsInit() {
    const root = $("#vision");
    if (!root) return;
    const wallMain = $("#vs-wall-main", root),
      wallSide = $("#vs-wall-side", root);
    const nameEl = $(".vs-color-name", root);
    let current = null;

    $$(".vs-swatch", root).forEach((sw) =>
      sw.addEventListener("click", () => {
        $$(".vs-swatch", root).forEach((s) => s.classList.remove("sel"));
        sw.classList.add("sel");
        current = sw.dataset.color;
        if (wallMain) wallMain.style.fill = current;
        if (wallSide) wallSide.style.fill = shade(current, 0.82);
        if (nameEl) nameEl.textContent = sw.dataset.name;
        brush.color = current;
      }),
    );

    // Vorher hold-button (SVG mode)
    const holdBtn = $(".vs-before", root);
    if (holdBtn && wallMain) {
      const orig = {
        m: wallMain.style.fill,
        s: wallSide ? wallSide.style.fill : "",
      };
      const show = (on) => {
        if (on) {
          wallMain.dataset.tmp = wallMain.style.fill;
          if (wallSide) wallSide.dataset.tmp = wallSide.style.fill;
          wallMain.style.fill = "#EDEAE3";
          if (wallSide) wallSide.style.fill = "#DcD8CF";
        } else {
          if (wallMain.dataset.tmp) wallMain.style.fill = wallMain.dataset.tmp;
          if (wallSide && wallSide.dataset.tmp)
            wallSide.style.fill = wallSide.dataset.tmp;
        }
      };
      ["pointerdown", "touchstart"].forEach((ev) =>
        holdBtn.addEventListener(ev, (e) => {
          e.preventDefault();
          show(true);
        }),
      );
      ["pointerup", "pointerleave", "touchend"].forEach((ev) =>
        holdBtn.addEventListener(ev, () => show(false)),
      );
    }

    /* --- photo brush mode --- */
    const brush = { color: "#A8B49A", size: 40, painting: false, img: null };
    const upload = $(".vs-upload", root);
    const canvasWrap = $(".vs-canvas-wrap", root);
    const svgWrap = $(".vs-svg-wrap", root);
    const photo = $("#vs-photo", root); // canvas: photo + tint composite
    const mask = document.createElement("canvas"); // offscreen stroke mask
    if (!photo) return;
    const pctx = photo.getContext("2d");
    const mctx = mask.getContext("2d");

    function redraw() {
      if (!brush.img) return;
      pctx.clearRect(0, 0, photo.width, photo.height);
      pctx.drawImage(brush.img, 0, 0, photo.width, photo.height);
      // tint = mask colored
      const tint = document.createElement("canvas");
      tint.width = photo.width;
      tint.height = photo.height;
      const tctx = tint.getContext("2d");
      tctx.drawImage(mask, 0, 0);
      tctx.globalCompositeOperation = "source-in";
      tctx.fillStyle = brush.color;
      tctx.fillRect(0, 0, tint.width, tint.height);
      pctx.globalCompositeOperation = "multiply";
      pctx.drawImage(tint, 0, 0);
      pctx.globalCompositeOperation = "source-over";
    }

    upload &&
      upload.addEventListener("change", (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const img = new Image();
        img.onload = () => {
          brush.img = img;
          const maxW = 1200,
            sc = Math.min(1, maxW / img.width);
          photo.width = mask.width = Math.round(img.width * sc);
          photo.height = mask.height = Math.round(img.height * sc);
          mctx.clearRect(0, 0, mask.width, mask.height);
          redraw();
          if (canvasWrap) canvasWrap.style.display = "";
          if (svgWrap) svgWrap.style.display = "none";
          const hint = $(".vs-hint", root);
          if (hint) hint.style.display = "";
        };
        img.src = URL.createObjectURL(f);
      });

    function pos(e) {
      const r = photo.getBoundingClientRect();
      const x =
        (((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width) *
        photo.width;
      const y =
        (((e.touches ? e.touches[0].clientY : e.clientY) - r.top) / r.height) *
        photo.height;
      return { x, y };
    }
    function stroke(e) {
      const { x, y } = pos(e);
      mctx.fillStyle = "#fff";
      mctx.beginPath();
      mctx.arc(
        x,
        y,
        brush.size * (photo.width / photo.getBoundingClientRect().width),
        0,
        7,
      );
      mctx.fill();
      redraw();
    }
    photo.addEventListener("pointerdown", (e) => {
      brush.painting = true;
      stroke(e);
    });
    photo.addEventListener("pointermove", (e) => {
      if (brush.painting) stroke(e);
    });
    addEventListener("pointerup", () => (brush.painting = false));

    const sizeSlider = $(".vs-brush-size", root);
    sizeSlider &&
      sizeSlider.addEventListener(
        "input",
        () => (brush.size = +sizeSlider.value),
      );
    const reset = $(".vs-reset", root);
    reset &&
      reset.addEventListener("click", () => {
        mctx.clearRect(0, 0, mask.width, mask.height);
        redraw();
      });
    const backSvg = $(".vs-back-svg", root);
    backSvg &&
      backSvg.addEventListener("click", () => {
        if (canvasWrap) canvasWrap.style.display = "none";
        if (svgWrap) svgWrap.style.display = "";
      });
  }
  vsInit();

  /* ---------- smooth anchor scroll ---------- */
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const t = $(a.getAttribute("href"));
      if (t) {
        e.preventDefault();
        t.scrollIntoView({ behavior: "smooth" });
      }
    }),
  );
})();
