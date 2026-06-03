(function () {
  var year = document.getElementById("yr");
  if (year) year.textContent = new Date().getFullYear();

  var button = document.getElementById("menuButton");
  var nav = document.getElementById("mobileNav");
  if (button && nav) {
    button.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });

    document.addEventListener("click", function (event) {
      if (!button.contains(event.target) && !nav.contains(event.target)) {
        nav.classList.remove("open");
        button.setAttribute("aria-expanded", "false");
      }
    });
  }

  window.switchLegalTab = function (id, buttonEl) {
    document.querySelectorAll(".tab-panel").forEach(function (panel) {
      panel.classList.remove("active");
    });
    document.querySelectorAll(".tab-button").forEach(function (tab) {
      tab.classList.remove("active");
      tab.setAttribute("aria-selected", "false");
    });

    var panel = document.getElementById(id);
    if (panel) panel.classList.add("active");
    if (buttonEl) {
      buttonEl.classList.add("active");
      buttonEl.setAttribute("aria-selected", "true");
    }
  };

  if (location.hash === "#privacy" || document.body.getAttribute("data-open-tab") === "privacy") {
    var privacyButton = document.querySelector("[data-tab='privacy']");
    if (privacyButton) window.switchLegalTab("privacy", privacyButton);
  }

  function switchPlatformTab(platform) {
    var target = platform === "ios" ? "ios" : "android";
    document.querySelectorAll("[data-platform-panel]").forEach(function (panel) {
      panel.classList.toggle("active", panel.getAttribute("data-platform-panel") === target);
    });
    document.querySelectorAll("[data-platform-tab]").forEach(function (tab) {
      var active = tab.getAttribute("data-platform-tab") === target;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  document.querySelectorAll("[data-platform-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var platform = tab.getAttribute("data-platform-tab");
      switchPlatformTab(platform);
      if (platform && history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.set("platform", platform);
        history.replaceState(null, "", url.toString());
      }
    });
  });

  if (document.querySelector("[data-platform-panel]")) {
    var params = new URLSearchParams(window.location.search);
    var platform = params.get("platform");
    if (!platform && document.referrer) {
      if (/(?:ios\.html|\/ios\/?)(?:$|[?#])/.test(document.referrer)) platform = "ios";
      if (/(?:android\.html|\/android\/?)(?:$|[?#])/.test(document.referrer)) platform = "android";
    }
    switchPlatformTab(platform);
  }

  document.querySelectorAll("[data-gallery]").forEach(function (gallery) {
    var viewport = gallery.querySelector("[data-gallery-viewport]");
    var slides = Array.prototype.slice.call(gallery.querySelectorAll(".gallery-slide"));
    var dotsWrap = gallery.querySelector("[data-gallery-dots]");
    if (!viewport || slides.length < 2) return;

    var current = 0;
    var resumeAt = 0;
    var pointerStartX = null;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      setActive(current);
    }

    function setActive(index) {
      slides.forEach(function (slide, i) {
        var offset = (i - index + slides.length) % slides.length;
        var stack = "hidden";
        if (offset === 0) stack = "active";
        else if (offset === 1) stack = "next";
        else if (offset === 2) stack = "next-2";
        else if (offset === slides.length - 1) stack = "prev";
        else if (offset === slides.length - 2) stack = "prev-2";

        slide.dataset.stack = stack;
        slide.classList.toggle("active", i === index);
        slide.setAttribute("aria-hidden", i === index ? "false" : "true");
      });
      if (dotsWrap) {
        dotsWrap.querySelectorAll(".gallery-dot").forEach(function (dot, i) {
          dot.classList.toggle("active", i === index);
        });
      }
    }

    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var dot = document.createElement("button");
        dot.className = "gallery-dot";
        dot.type = "button";
        dot.setAttribute("aria-label", "Show screenshot " + (i + 1));
        dot.addEventListener("click", function () {
          resumeAt = Date.now() + 5000;
          showSlide(i);
        });
        dotsWrap.appendChild(dot);
      });
    }

    slides.forEach(function (slide, i) {
      slide.addEventListener("click", function () {
        if (i === current) return;
        resumeAt = Date.now() + 5000;
        showSlide(i);
      });
    });

    viewport.addEventListener("pointerdown", function (event) {
      pointerStartX = event.clientX;
      resumeAt = Date.now() + 5000;
    });

    viewport.addEventListener("pointerup", function (event) {
      if (pointerStartX === null) return;
      var delta = event.clientX - pointerStartX;
      pointerStartX = null;
      if (Math.abs(delta) < 36) return;
      showSlide(delta < 0 ? current + 1 : current - 1);
    });

    viewport.addEventListener("pointercancel", function () {
      pointerStartX = null;
    });

    viewport.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        resumeAt = Date.now() + 5000;
        showSlide(current + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        resumeAt = Date.now() + 5000;
        showSlide(current - 1);
      }
    });

    showSlide(0);

    if (!reduceMotion) {
      window.setInterval(function () {
        if (Date.now() < resumeAt) return;
        showSlide(current + 1);
      }, 2800);
    }
  });
})();
