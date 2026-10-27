/* =========================================================
   Deeply Giving — interactions & motion
   GSAP + ScrollTrigger for motion, Lenis for smooth scroll,
   pdf.js for the in-page brochure viewer.
   ========================================================= */
(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  $$(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Text splitting ---------- */

  // Wrap every word in a span, keeping inline elements (em, strong) intact.
  function splitWords(root) {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(" "));
            else {
              const span = document.createElement("span");
              span.className = "word";
              span.textContent = part;
              frag.appendChild(span);
            }
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(root);
    return $$(".word", root);
  }

  // Titles use <br> for their line breaks, so each segment becomes a masked line.
  function splitLines(el) {
    const lines = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = lines
      .map((l) => `<span class="split-line"><span>${l.trim()}</span></span>`)
      .join("");
    return $$(".split-line > span", el);
  }

  /* ---------- Smooth scroll ---------- */
  let lenis = null;

  function scrollToTarget(target) {
    const offset = -($(".header")?.offsetHeight || 0) + 1;
    if (lenis) lenis.scrollTo(target, { offset, duration: 1.4 });
    else {
      const el = typeof target === "string" ? $(target) : target;
      const y = el ? el.getBoundingClientRect().top + window.scrollY + offset : 0;
      window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2 && id !== "#") return;
      const target = id === "#top" || id === "#" ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(target);
    });
  });

  /* ---------- Mobile menu ---------- */
  const menuBtn = $(".menu-toggle");
  const mobileMenu = $(".mobile-menu");

  function closeMenu() {
    if (!document.body.classList.contains("menu-open")) return;
    document.body.classList.remove("menu-open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open menu");
    mobileMenu.setAttribute("aria-hidden", "true");
    lenis?.start();
  }

  menuBtn.addEventListener("click", () => {
    const open = !document.body.classList.contains("menu-open");
    if (!open) return closeMenu();
    document.body.classList.add("menu-open");
    menuBtn.setAttribute("aria-expanded", "true");
    menuBtn.setAttribute("aria-label", "Close menu");
    mobileMenu.setAttribute("aria-hidden", "false");
    lenis?.stop();
  });

  /* ---------- Header state ---------- */
  const header = $(".header");
  let lastY = 0;
  function onScroll(y) {
    header.classList.toggle("is-scrolled", y > 40);
    const hide = y > lastY && y > 400 && !document.body.classList.contains("menu-open");
    header.classList.toggle("is-hidden", hide);
    lastY = y;
  }

  /* ---------- Custom cursor ---------- */
  function initCursor() {
    if (!finePointer || reduceMotion || !hasGsap) return;
    const cursor = $(".cursor");
    const label = $(".cursor__label");
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.45, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.45, ease: "power3" });

    window.addEventListener("pointermove", (e) => {
      cursor.classList.add("is-visible");
      xTo(e.clientX);
      yTo(e.clientY);
    });
    document.addEventListener("pointerleave", () => cursor.classList.remove("is-visible"));

    document.addEventListener("pointerover", (e) => {
      const labelled = e.target.closest("[data-cursor]");
      const interactive = e.target.closest("a, button");
      if (labelled) {
        label.textContent = labelled.dataset.cursor;
        cursor.classList.add("has-label");
        cursor.classList.remove("is-hover");
      } else if (interactive) {
        cursor.classList.add("is-hover");
        cursor.classList.remove("has-label");
      } else {
        cursor.classList.remove("is-hover", "has-label");
      }
    });
  }

  /* ---------- Magnetic elements ---------- */
  function initMagnetic() {
    if (!finePointer || reduceMotion || !hasGsap) return;
    $$(".magnetic").forEach((el) => {
      const strength = el.classList.contains("contact__email") ? 0.12 : 0.3;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - r.left - r.width / 2) * strength,
          y: (e.clientY - r.top - r.height / 2) * strength,
          duration: 0.6,
          ease: "power3.out",
        });
      });
      el.addEventListener("pointerleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  /* ---------- 3D tilt (founder cards, brochure covers) ---------- */
  function initTilt() {
    if (!finePointer || reduceMotion || !hasGsap) return;
    $$(".founder, .doc__cover").forEach((el) => {
      const max = el.classList.contains("doc__cover") ? 7 : 5;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--mx", `${px * 100}%`);
        el.style.setProperty("--my", `${py * 100}%`);
        gsap.to(el, {
          rotateY: (px - 0.5) * max * 2,
          rotateX: -(py - 0.5) * max * 2,
          transformPerspective: 1000,
          duration: 0.6,
          ease: "power2.out",
        });
      });
      el.addEventListener("pointerleave", () => {
        gsap.to(el, { rotateX: 0, rotateY: 0, duration: 1, ease: "elastic.out(1, 0.5)" });
      });
    });
  }

  /* ---------- Preloader + hero intro ---------- */
  function finishLoading() {
    document.body.classList.remove("is-loading");
    $(".preloader")?.remove();
  }

  function playIntro() {
    const pre = $(".preloader");
    const counter = { v: 0 };
    const countEl = $(".js-count");

    gsap.set(".hero__title .line__inner", { yPercent: 110 });
    gsap.set(".hero__eyebrow, .hero__lead, .hero__actions > *", { autoAlpha: 0, y: 24 });
    gsap.set(".hero__media-inner", { clipPath: "inset(100% 0% 0% 0% round 32px)" });
    gsap.set(".hero__media-inner img", { scale: 1.45 });
    gsap.set(".hero__badge", { scale: 0, rotate: -90 });
    gsap.set(".hero__bg-mark", { autoAlpha: 0, rotate: -40, scale: 0.85 });
    gsap.set(".header", { yPercent: -100 });

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

    tl.to(".preloader__mark path", { strokeDashoffset: 0, duration: 1.1, stagger: 0.12, ease: "power2.inOut" })
      .to(counter, {
        v: 100, duration: 1.7, ease: "power2.inOut",
        onUpdate: () => (countEl.textContent = Math.round(counter.v)),
      }, 0)
      .to(".preloader__word span", { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.04 }, 0.5)
      .to(".preloader__inner", { y: -30, autoAlpha: 0, duration: 0.6, ease: "power2.in" }, "+=0.15")
      .to(".preloader__count", { autoAlpha: 0, duration: 0.4 }, "<")
      .to(pre, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1, ease: "expo.inOut" }, "-=0.15")
      .add(() => document.body.classList.remove("is-loading"), "-=0.6")
      .addLabel("hero", "-=0.55")
      .to(".hero__title .line__inner", { yPercent: 0, duration: 1.4, stagger: 0.1 }, "hero")
      .to(".hero__media-inner", { clipPath: "inset(0% 0% 0% 0% round 32px)", duration: 1.6, ease: "expo.inOut" }, "hero-=0.2")
      .to(".hero__media-inner img", { scale: 1, duration: 2, ease: "expo.out" }, "hero")
      .to(".hero__bg-mark", { autoAlpha: 1, rotate: 0, scale: 1, duration: 2.2 }, "hero")
      .to(".hero__eyebrow", { autoAlpha: 1, y: 0, duration: 1 }, "hero+=0.3")
      .to(".hero__lead, .hero__actions > *", { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 }, "hero+=0.5")
      .to(".hero__badge", { scale: 1, rotate: 0, duration: 1.4, ease: "back.out(1.6)" }, "hero+=0.6")
      .to(".header", { yPercent: 0, duration: 1.2, clearProps: "transform" }, "hero+=0.4")
      .add(() => pre.remove());
  }

  /* ---------- Scroll-driven motion ---------- */
  function initScrollMotion() {
    // Hero parallax on the way out
    gsap.to(".hero__media-inner img", {
      yPercent: 12, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".hero__title", {
      yPercent: -18, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".hero__bg-mark svg", {
      rotate: 90, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });

    // Marquee: endless loop that speeds up and flips with scroll velocity
    const track = $(".marquee__track");
    const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
    ScrollTrigger.create({
      trigger: ".marquee",
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        const v = self.getVelocity() / 300;
        const dir = self.direction;
        gsap.to(loop, { timeScale: dir * Math.max(1, Math.min(Math.abs(v), 5)), duration: 0.2, overwrite: true });
        gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.2, ease: "power2.out" });
      },
    });

    // Generic fade-up
    gsap.utils.toArray(".reveal-up").forEach((el) => {
      gsap.from(el, {
        y: 40, autoAlpha: 0, duration: 1.2, ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });

    // Masked line titles
    $$(".split-lines").forEach((el) => {
      const lines = splitLines(el);
      gsap.from(lines, {
        yPercent: 110, rotate: 2, duration: 1.3, stagger: 0.1, ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
    });

    // Words that light up as you read
    $$(".js-scrub-words").forEach((el) => {
      const words = splitWords(el);
      gsap.to(words, {
        opacity: 1, stagger: 0.1, ease: "none",
        scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.6 },
      });
    });

    // Stacked cards: each card recedes as the next slides over it
    const cards = gsap.utils.toArray(".card");
    const sticky = window.matchMedia("(min-width: 561px)").matches;
    if (sticky) {
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        gsap.to(card, {
          scale: 0.92 + i * 0.025,
          filter: "brightness(0.82)",
          ease: "none",
          scrollTrigger: { trigger: next, start: "top bottom", end: "top 20%", scrub: true },
        });
      });
    }
    cards.forEach((card) => {
      gsap.from(card.querySelectorAll(".card__body > *"), {
        y: 50, autoAlpha: 0, duration: 1.2, stagger: 0.12, ease: "expo.out",
        scrollTrigger: { trigger: card, start: "top 70%", once: true },
      });
    });

    // Line art draws itself
    $$(".art-neuro path, .art-pen path:not(.faint)").forEach((p) => {
      const len = p.getTotalLength();
      gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, {
        strokeDashoffset: 0, duration: 2, ease: "power2.inOut",
        scrollTrigger: { trigger: p.closest(".card"), start: "top 65%", once: true },
      });
    });
    gsap.from(".art-neuro circle", {
      scale: 0, transformOrigin: "50% 50%", duration: 0.8, stagger: 0.08, ease: "back.out(2)",
      scrollTrigger: { trigger: ".card--1", start: "top 65%", once: true },
    });
    gsap.from(".card__art--photo img", {
      scale: 1.35, ease: "none",
      scrollTrigger: { trigger: ".card--3", start: "top bottom", end: "top 20%", scrub: true },
    });

    // Manifesto: pinned, the image opens up while the words arrive
    const mTl = gsap.timeline({
      scrollTrigger: { trigger: ".manifesto", start: "top top", end: "+=160%", scrub: 0.8, pin: ".manifesto__pin" },
    });
    mTl.fromTo(".manifesto__media", { clipPath: "inset(22% 30% 22% 30% round 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.inOut", duration: 1 })
      .fromTo(".manifesto__media img", { scale: 1.3 }, { scale: 1, ease: "power2.inOut", duration: 1 }, 0)
      .from(".m-line", { yPercent: 60, autoAlpha: 0, stagger: 0.12, duration: 0.5, ease: "power3.out" }, 0.45)
      .from(".manifesto__sub", { y: 30, autoAlpha: 0, duration: 0.4 }, 0.9)
      .to({}, { duration: 0.3 });

    // Photo parallax
    $$(".parallax-wrap").forEach((wrap) => {
      gsap.fromTo(wrap.querySelector(".parallax"), { yPercent: -8 }, {
        yPercent: 8, ease: "none",
        scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
    gsap.fromTo(".journals__photo", { clipPath: "inset(100% 0% 0% 0%)" }, {
      clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, stagger: 0.2, ease: "expo.inOut",
      scrollTrigger: { trigger: ".journals__media", start: "top 75%", once: true },
    });

    // Founders
    gsap.from(".founder", {
      y: 80, autoAlpha: 0, duration: 1.4, stagger: 0.15, ease: "expo.out",
      scrollTrigger: { trigger: ".founders__cards", start: "top 80%", once: true },
    });
    gsap.from(".t-word", {
      yPercent: 100, autoAlpha: 0, rotate: 4, stagger: 0.06, ease: "power3.out",
      scrollTrigger: { trigger: ".founders__together", start: "top 85%", end: "bottom 55%", scrub: 0.6 },
    });
    gsap.fromTo(".founders__silhouette", { yPercent: 20 }, {
      yPercent: 0, ease: "none",
      scrollTrigger: { trigger: ".founders__scene", start: "top bottom", end: "bottom bottom", scrub: true },
    });

    // Brochures
    gsap.from(".doc", {
      y: 80, autoAlpha: 0, duration: 1.4, stagger: 0.15, ease: "expo.out",
      scrollTrigger: { trigger: ".docs", start: "top 80%", once: true },
    });

    // Contact & footer
    gsap.from(".contact__email", {
      y: 50, autoAlpha: 0, duration: 1.3, ease: "expo.out",
      scrollTrigger: { trigger: ".contact__email", start: "top 90%", once: true },
    });
    gsap.from(".footer__big span", {
      yPercent: 100, duration: 1.6, stagger: 0.12, ease: "expo.out",
      scrollTrigger: { trigger: ".footer__big", start: "top 95%", once: true },
    });

    // Header switches to its dark variant while it sits over a dark section
    [[".manifesto", ".manifesto"], [".founders", ".founders__cards"], [".contact", ".contact"]].forEach(([from, to]) => {
      ScrollTrigger.create({
        trigger: from, endTrigger: to, start: "top 40px", end: "bottom 40px",
        onToggle: (self) => header.classList.toggle("on-dark", self.isActive),
      });
    });

    // Active nav link
    $$(".nav__list a").forEach((link) => {
      const section = $(link.getAttribute("href"));
      if (!section) return;
      ScrollTrigger.create({
        trigger: section, start: "top 50%", end: "bottom 50%",
        onToggle: (self) => link.classList.toggle("is-active", self.isActive),
      });
    });
  }

  /* ---------- Brochure viewer (pdf.js) ---------- */
  const pdfjs = window.pdfjsLib;
  if (pdfjs) {
    pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
  const pdfCache = new Map();
  const loadPdf = (url) => {
    if (!pdfCache.has(url)) pdfCache.set(url, pdfjs.getDocument(url).promise);
    return pdfCache.get(url);
  };

  async function renderPage(pdf, num, canvas, targetWidth) {
    const page = await pdf.getPage(num);
    const base = page.getViewport({ scale: 1 });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const viewport = page.getViewport({ scale: (targetWidth / base.width) * dpr });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
  }

  // Covers render lazily as they approach the viewport
  function initDocCovers() {
    if (!pdfjs) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(async (entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        const canvas = $(".doc__canvas", entry.target);
        try {
          const pdf = await loadPdf(entry.target.dataset.pdf);
          await renderPage(pdf, 1, canvas, entry.target.clientWidth);
          canvas.classList.add("is-ready");
        } catch (err) {
          console.warn("Brochure preview unavailable:", err);
        }
      });
    }, { rootMargin: "400px" });
    $$(".doc").forEach((doc) => io.observe(doc));
  }

  const viewer = $(".viewer");
  const vCanvas = $(".viewer__canvas", viewer);
  const vFrame = $(".viewer__frame", viewer);
  const vState = { pdf: null, page: 1, url: null, lastFocus: null };

  async function showPage(n) {
    if (!vState.pdf) return;
    vState.page = Math.max(1, Math.min(n, vState.pdf.numPages));
    $(".js-page", viewer).textContent = vState.page;
    $(".js-prev", viewer).disabled = vState.page <= 1;
    $(".js-next", viewer).disabled = vState.page >= vState.pdf.numPages;
    viewer.classList.add("is-busy");
    vCanvas.classList.add("is-busy");
    const stage = $(".viewer__stage", viewer);
    await renderPage(vState.pdf, vState.page, vCanvas, Math.max(stage.clientWidth - 40, 320));
    viewer.classList.remove("is-busy");
    vCanvas.classList.remove("is-busy");
  }

  async function openViewer(doc) {
    vState.url = doc.dataset.pdf;
    vState.lastFocus = document.activeElement;
    $(".viewer__title", viewer).textContent = doc.dataset.title;
    $(".js-download", viewer).href = vState.url;
    viewer.classList.add("is-open");
    viewer.setAttribute("aria-hidden", "false");
    lenis?.stop();
    document.body.style.overflow = "hidden";
    $(".viewer__close", viewer).focus();

    try {
      if (!pdfjs) throw new Error("pdf.js not loaded");
      vFrame.hidden = true;
      vCanvas.hidden = false;
      vState.pdf = await loadPdf(vState.url);
      $(".js-pages", viewer).textContent = vState.pdf.numPages;
      await showPage(1);
    } catch (err) {
      // Fall back to the browser's own PDF viewer
      viewer.classList.remove("is-busy");
      vCanvas.hidden = true;
      vFrame.hidden = false;
      vFrame.src = vState.url;
    }
  }

  function closeViewer() {
    viewer.classList.remove("is-open");
    viewer.setAttribute("aria-hidden", "true");
    vState.pdf = null;
    vFrame.removeAttribute("src");
    document.body.style.overflow = "";
    lenis?.start();
    vState.lastFocus?.focus();
  }

  $$(".doc").forEach((doc) => {
    $(".doc__cover", doc).addEventListener("click", () => openViewer(doc));
    $(".js-open-doc", doc).addEventListener("click", () => openViewer(doc));
  });
  $$(".js-close-viewer", viewer).forEach((b) => b.addEventListener("click", closeViewer));
  $(".js-prev", viewer).addEventListener("click", () => showPage(vState.page - 1));
  $(".js-next", viewer).addEventListener("click", () => showPage(vState.page + 1));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (viewer.classList.contains("is-open")) closeViewer();
      else closeMenu();
    }
    if (!viewer.classList.contains("is-open")) return;
    if (e.key === "ArrowRight") showPage(vState.page + 1);
    if (e.key === "ArrowLeft") showPage(vState.page - 1);
  });

  /* ---------- Boot ---------- */
  initDocCovers();

  if (!hasGsap || reduceMotion) {
    // Everything is visible by default in CSS; just drop the preloader.
    finishLoading();
    window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  if (typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", (e) => {
      ScrollTrigger.update();
      onScroll(e.scroll);
    });
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });
  }

  initCursor();
  initMagnetic();
  initTilt();
  initScrollMotion();

  // Start the intro once fonts are in (so lines are measured correctly), but never wait too long.
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))]).then(() => {
    ScrollTrigger.refresh();
    playIntro();
  });
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
