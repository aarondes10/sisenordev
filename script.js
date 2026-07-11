(function () {
  "use strict";

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Mobile nav toggle
  --------------------------------------------------------- */
  var navToggle = document.getElementById("nav-toggle");
  var mainNav = document.getElementById("main-nav");

  navToggle.addEventListener("click", function () {
    var isOpen = mainNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  mainNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      mainNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------------------------------------------------------
     Sunburst — drawn once, reused as the hero backdrop
  --------------------------------------------------------- */
  (function drawSunburst() {
    var g = document.getElementById("sunburst-rays");
    if (!g) return;
    var rays = 20;
    var cx = 200, cy = 200, rInner = 70, rOuter = 195;
    var svgNS = "http://www.w3.org/2000/svg";
    for (var i = 0; i < rays; i++) {
      var a0 = (i / rays) * Math.PI * 2;
      var a1 = a0 + (Math.PI / rays) * 0.62;
      var a2 = a0 + (Math.PI / rays) * 1.24;
      var x1 = cx + Math.cos(a0) * rInner, y1 = cy + Math.sin(a0) * rInner;
      var x2 = cx + Math.cos(a1) * rOuter, y2 = cy + Math.sin(a1) * rOuter;
      var x3 = cx + Math.cos(a2) * rInner, y3 = cy + Math.sin(a2) * rInner;
      var path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", "M" + x1 + " " + y1 + " L" + x2 + " " + y2 + " L" + x3 + " " + y3 + " Z");
      path.setAttribute("fill", "#FDBB2D");
      g.appendChild(path);
    }
  })();

  /* ---------------------------------------------------------
     Live open / closed status
     Hours: Mon–Sat 11:00–14:00 & 17:00–20:00, closed Sunday
     Displayed in restaurant's local timezone (Louisiana = America/Chicago)
  --------------------------------------------------------- */
  function getChicagoParts() {
    var fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      hour12: false,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
    var parts = fmt.formatToParts(new Date());
    var map = {};
    parts.forEach(function (p) { map[p.type] = p.value; });
    return {
      weekday: map.weekday,
      minutes: parseInt(map.hour, 10) * 60 + parseInt(map.minute, 10)
    };
  }

  function updateStatus() {
    var now = getChicagoParts();
    var isSunday = now.weekday === "Sun";
    var lunch = now.minutes >= 11 * 60 && now.minutes < 14 * 60;
    var dinner = now.minutes >= 17 * 60 && now.minutes < 20 * 60;
    var isOpen = !isSunday && (lunch || dinner);

    var dot = document.getElementById("status-dot");
    var text = document.getElementById("status-text");
    var live = document.getElementById("hours-live");

    var msg;
    if (isSunday) {
      msg = "Closed today — see you Monday at 11 AM";
    } else if (isOpen) {
      msg = lunch ? "Open now — lunch until 2 PM" : "Open now — dinner until 8 PM";
    } else if (!isSunday && now.minutes < 11 * 60) {
      msg = "Closed now — opens at 11 AM";
    } else if (!isSunday && now.minutes >= 14 * 60 && now.minutes < 17 * 60) {
      msg = "Closed for the afternoon — back at 5 PM";
    } else {
      msg = "Closed now — opens tomorrow at 11 AM";
    }

    if (dot) dot.classList.toggle("closed", !isOpen);
    if (text) text.textContent = msg;
    if (live) live.textContent = isOpen ? "● Open right now" : "Currently closed";
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ---------------------------------------------------------
     Menu category filter
  --------------------------------------------------------- */
  var tabs = document.querySelectorAll(".menu-tab");
  var cards = document.querySelectorAll(".dish-card");

  function applyFilter(filter) {
    cards.forEach(function (card) {
      var match = filter === "all" || card.getAttribute("data-category") === filter;
      card.hidden = !match;
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");
      applyFilter(tab.getAttribute("data-filter"));
    });
  });

  // apply whichever tab is marked active in the HTML on load
  var initialTab = document.querySelector(".menu-tab.active");
  if (initialTab) applyFilter(initialTab.getAttribute("data-filter"));

  /* ---------------------------------------------------------
     Lightbox — shared by gallery photos and menu scans
  --------------------------------------------------------- */
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
  var menuScans = Array.prototype.slice.call(document.querySelectorAll(".menu-scan"));

  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  var lightboxCaption = document.getElementById("lightbox-caption");
  var closeBtn = document.getElementById("lightbox-close");
  var prevBtn = document.getElementById("lightbox-prev");
  var nextBtn = document.getElementById("lightbox-next");

  var activeSet = [];
  var activeIndex = 0;

  function openLightbox(set, index) {
    activeSet = set;
    activeIndex = index;
    renderLightbox();
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function renderLightbox() {
    var el = activeSet[activeIndex];
    var img = el.querySelector("img");
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = img.alt;
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
  }

  function step(delta) {
    activeIndex = (activeIndex + delta + activeSet.length) % activeSet.length;
    renderLightbox();
  }

  galleryItems.forEach(function (item, i) {
    item.addEventListener("click", function () { openLightbox(galleryItems, i); });
  });
  menuScans.forEach(function (item, i) {
    item.addEventListener("click", function () { openLightbox(menuScans, i); });
  });

  closeBtn.addEventListener("click", closeLightbox);
  prevBtn.addEventListener("click", function () { step(-1); });
  nextBtn.addEventListener("click", function () { step(1); });

  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", function (e) {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  /* ---------------------------------------------------------
     Scroll reveal
  --------------------------------------------------------- */
  var revealTargets = document.querySelectorAll(
    ".dish-card, .gallery-item, .hours-card, .location-block, .about-placeholder"
  );
  revealTargets.forEach(function (el) { el.classList.add("reveal"); });

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealTargets.forEach(function (el) { observer.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("in"); });
  }
})();
