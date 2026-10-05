/* =========================================================
   #606c38 × #fefae0 — нативный JavaScript, без библиотек
   ========================================================= */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  /* ---------------------------------------------------------
     0. год в подвале
     --------------------------------------------------------- */

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     1. тост
     --------------------------------------------------------- */

  var toast = document.getElementById("toast");
  var toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-shown");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-shown");
    }, 1600);
  }

  /* ---------------------------------------------------------
     2. копирование HEX
     --------------------------------------------------------- */

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          showToast("Скопировано: " + text);
        },
        function () {
          fallbackCopy(text);
        }
      );
      return;
    }
    fallbackCopy(text);
  }

  // file:// и старые браузеры могут блокировать Clipboard API
  function fallbackCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    document.body.appendChild(area);
    area.select();

    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(area);
    showToast(ok ? "Скопировано: " + text : "Скопируй вручную: " + text);
  }

  function flash(el) {
    if (!el) return;
    el.style.transition = "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)";
    el.style.transform = "scale(1.04)";
    window.setTimeout(function () {
      el.style.transform = "";
      window.setTimeout(function () {
        el.style.transition = "";
      }, 300);
    }, 160);
  }

  Array.prototype.forEach.call(
    document.querySelectorAll("[data-copy], [data-hex]"),
    function (el) {
      var value = el.getAttribute("data-copy") || el.getAttribute("data-hex");
      var target = el.querySelector(".color-card__chip") || el;

      var handler = function () {
        copyText(value);
        flash(target);
      };

      el.addEventListener("click", handler);
      el.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handler();
        }
      });
    }
  );

  /* ---------------------------------------------------------
     3. переключение цветов местами (с анимацией)
     --------------------------------------------------------- */

  var swapBtn = document.getElementById("swapTheme");

  if (swapBtn) {
    swapBtn.addEventListener("click", function () {
      var inverted = document.body.classList.toggle("is-inverted");
      swapBtn.setAttribute("aria-pressed", inverted ? "true" : "false");

      if (reduceMotion) return;

      swapBtn.classList.remove("is-spin");
      // reflow, чтобы анимация перезапустилась
      void swapBtn.offsetWidth;
      swapBtn.classList.add("is-spin");
      window.setTimeout(function () {
        swapBtn.classList.remove("is-spin");
      }, 600);
    });
  }

  /* ---------------------------------------------------------
     4. прогресс чтения + состояние шапки + активный раздел
     --------------------------------------------------------- */

  var bar = document.getElementById("progressBar");
  var header = document.getElementById("header");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a"));
  var sections = Array.prototype.slice.call(
    document.querySelectorAll("main section[id]")
  );
  var ticking = false;

  function onScroll() {
    var doc = document.documentElement;
    var scrollTop = window.pageYOffset || doc.scrollTop;
    var max = doc.scrollHeight - window.innerHeight;

    if (bar) {
      var ratio = max > 0 ? scrollTop / max : 0;
      bar.style.width = Math.min(100, Math.max(0, ratio * 100)) + "%";
    }

    if (header) {
      header.classList.toggle("is-stuck", scrollTop > 12);
    }

    var current = "";
    var offset = scrollTop + (header ? header.offsetHeight + 48 : 90);

    for (var i = 0; i < sections.length; i++) {
      if (sections[i].offsetTop <= offset) {
        current = sections[i].id;
      }
    }

    navLinks.forEach(function (link) {
      var active = link.getAttribute("href") === "#" + current;
      if (active !== link.classList.contains("is-current")) {
        link.classList.toggle("is-current", active);
      }
    });

    ticking = false;
  }

  function requestScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }

  window.addEventListener("scroll", requestScroll, { passive: true });
  window.addEventListener("resize", requestScroll);
  window.addEventListener("load", requestScroll);
  onScroll();

  /* ---------------------------------------------------------
     5. «наклон» для чередующихся карточек (эффект ручной раскладки)
     --------------------------------------------------------- */

  Array.prototype.forEach.call(document.querySelectorAll(".cards .card"), function (card, i) {
    if (i % 2 === 1) card.classList.add("rotate-alt");
  });

  /* ---------------------------------------------------------
     6. scroll-reveal: всплытие + scale + rotate
     --------------------------------------------------------- */

  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if (!hasIO || reduceMotion) {
    reveals.forEach(function (el) {
      el.classList.add("is-in");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    reveals.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---------------------------------------------------------
     7. SVG-сцены стартуют только в поле зрения
     --------------------------------------------------------- */

  var scenes = Array.prototype.slice.call(document.querySelectorAll("[data-scene]"));

  function setSceneState(el, live) {
    if (live) el.classList.add("is-live");
    else el.classList.remove("is-live");
  }

  if (!hasIO || reduceMotion) {
    scenes.forEach(function (el) {
      setSceneState(el, true);
    });
  } else {
    var sceneObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          setSceneState(entry.target, entry.isIntersecting);
          // держим наблюдение: сцена должна засыпать при уходе
          if (!entry.isIntersecting) {
            observer.unobserve(entry.target);
            window.requestAnimationFrame(function () {
              observer.observe(entry.target);
            });
          }
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -5% 0px" }
    );

    scenes.forEach(function (el) {
      sceneObserver.observe(el);
    });
  }

  /* ---------------------------------------------------------
     8. табы применения
     --------------------------------------------------------- */

  Array.prototype.forEach.call(document.querySelectorAll("[data-tabs]"), function (widget) {
    var buttons = Array.prototype.slice.call(widget.querySelectorAll(".tab"));
    var panels = Array.prototype.slice.call(widget.querySelectorAll(".tabs__panel"));

    function activate(index) {
      buttons.forEach(function (btn, i) {
        var on = i === index;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
        btn.tabIndex = on ? 0 : -1;
      });

      panels.forEach(function (panel, i) {
        var on = i === index;
        panel.hidden = !on;
        panel.classList.toggle("is-active", on);
      });

      // сцена внутри открытой панели должна стартовать сразу
      var panel = panels[index];
      if (panel && !reduceMotion) {
        panel.querySelectorAll("[data-scene]").forEach(function (scene) {
          var rect = scene.getBoundingClientRect();
          var visible = rect.top < window.innerHeight && rect.bottom > 0;
          setSceneState(scene, visible);
        });
      }
    }

    buttons.forEach(function (btn, index) {
      btn.addEventListener("click", function () {
        activate(index);
      });

      btn.addEventListener("keydown", function (event) {
        var next = null;

        if (event.key === "ArrowRight") next = (index + 1) % buttons.length;
        else if (event.key === "ArrowLeft") next = (index - 1 + buttons.length) % buttons.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = buttons.length - 1;

        if (next === null) return;

        event.preventDefault();
        activate(next);
        buttons[next].focus();
      });
    });

    activate(0);
  });

  /* ---------------------------------------------------------
     9. строки таблицы
     --------------------------------------------------------- */

  var rows = Array.prototype.slice.call(
    document.querySelectorAll("#compareTable tbody tr")
  );

  rows.forEach(function (row) {
    row.addEventListener("click", function (event) {
      if (event.target.closest("[data-copy]")) return;

      var already = row.classList.contains("is-selected");
      rows.forEach(function (other) {
        other.classList.remove("is-selected");
      });
      if (!already) row.classList.add("is-selected");
    });
  });
})();
