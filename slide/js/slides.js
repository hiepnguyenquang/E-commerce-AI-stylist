(() => {
  "use strict";

  const root = document.documentElement;
  const deck = document.getElementById("slide-deck");
  const slides = Array.from(document.querySelectorAll(".slide:not(.conclusion-slide)"));
  const overview = document.getElementById("overview");
  const overviewGrid = document.getElementById("overview-grid");
  const controls = document.querySelector(".controls");
  const currentLabel = document.getElementById("current-slide");
  const totalLabel = document.getElementById("total-slides");
  const progressBar = document.getElementById("progress-bar");
  const fullscreenButton = document.getElementById("fullscreen-button");
  const overviewButton = document.getElementById("overview-button");
  const toast = document.getElementById("toast");

  let currentIndex = getIndexFromHash();
  let touchStartX = null;
  let touchStartY = null;
  let touchStartedOnControl = false;
  let toastTimer = null;

  function clampIndex(index) {
    return Math.min(Math.max(index, 0), slides.length - 1);
  }

  function getIndexFromHash(fallback = 0) {
    const match = window.location.hash.match(/^#slide-(\d+)$/);
    return match ? clampIndex(Number(match[1]) - 1) : fallback;
  }

  function formatNumber(value) {
    return String(value).padStart(2, "0");
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function renderSlide(index, updateHash = true) {
    currentIndex = clampIndex(index);

    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === currentIndex;
      slide.classList.toggle("active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    currentLabel.textContent = formatNumber(currentIndex + 1);
    progressBar.style.width = `${((currentIndex + 1) / slides.length) * 100}%`;
    document.title = `${slides[currentIndex].dataset.title} | AI Fashion E-commerce`;

    overviewGrid.querySelectorAll(".overview-item").forEach((item, itemIndex) => {
      item.classList.toggle("current", itemIndex === currentIndex);
    });

    if (updateHash) {
      const targetHash = `#slide-${currentIndex + 1}`;
      try {
        if (window.location.hash !== targetHash) {
          history.pushState(null, "", targetHash);
        }
      } catch {
        window.location.hash = targetHash;
      }
    }

    if (window.matchMedia("(max-width: 900px)").matches) {
      window.scrollTo(0, 0);
    }
  }

  function goToSlide(index) {
    renderSlide(index);
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function previousSlide() {
    goToSlide(currentIndex - 1);
  }

  function buildOverview() {
    const fragment = document.createDocumentFragment();

    slides.forEach((slide, index) => {
      const button = document.createElement("button");
      button.className = "overview-item";
      button.type = "button";
      button.innerHTML = `<span>${formatNumber(index + 1)}</span><strong>${slide.dataset.title}</strong>`;
      button.addEventListener("click", () => {
        closeOverview();
        goToSlide(index);
      });
      fragment.appendChild(button);
    });

    overviewGrid.replaceChildren(fragment);
  }

  function openOverview() {
    overview.classList.add("open");
    overview.setAttribute("aria-hidden", "false");
    overviewButton.setAttribute("aria-expanded", "true");
    deck.inert = true;
    controls.inert = true;
    overviewGrid.querySelectorAll(".overview-item")[currentIndex]?.focus();
  }

  function closeOverview(restoreFocus = true) {
    overview.classList.remove("open");
    overview.setAttribute("aria-hidden", "true");
    overviewButton.setAttribute("aria-expanded", "false");
    deck.inert = false;
    controls.inert = false;
    if (restoreFocus) overviewButton.focus();
  }

  function toggleOverview() {
    if (overview.classList.contains("open")) {
      closeOverview();
    } else {
      openOverview();
    }
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      showToast("Trình duyệt không cho phép bật toàn màn hình");
      console.error("Fullscreen request failed:", error);
    }
  }

  function syncFullscreenButton() {
    const isFullscreen = Boolean(document.fullscreenElement);
    fullscreenButton.textContent = isFullscreen ? "Thoát trình chiếu" : "Trình chiếu";
    fullscreenButton.setAttribute("aria-pressed", String(isFullscreen));
  }

  function handleKeydown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const key = event.key.toLowerCase();
    const overviewOpen = overview.classList.contains("open");
    const isInteractiveTarget = event.target.closest?.("button, a, input, textarea, select");

    if (isInteractiveTarget && (key === " " || key === "enter")) return;
    if (event.repeat && (key === "p" || key === "o")) return;

    if (key === "escape" && overviewOpen) {
      event.preventDefault();
      closeOverview();
      return;
    }

    if (key === "tab" && overviewOpen) {
      const focusable = Array.from(overview.querySelectorAll("button:not([disabled])"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }

    if (overviewOpen && key !== "o") return;

    const actions = {
      arrowright: nextSlide,
      arrowdown: nextSlide,
      pagedown: nextSlide,
      " ": nextSlide,
      arrowleft: previousSlide,
      arrowup: previousSlide,
      pageup: previousSlide,
      home: () => goToSlide(0),
      end: () => goToSlide(slides.length - 1),
      p: toggleFullscreen,
      o: toggleOverview,
    };

    if (actions[key]) {
      event.preventDefault();
      actions[key]();
    }
  }

  function handleTouchStart(event) {
    touchStartX = event.changedTouches[0]?.clientX ?? null;
    touchStartY = event.changedTouches[0]?.clientY ?? null;
    touchStartedOnControl = Boolean(event.target.closest?.(".controls, .overview, button, a"));
  }

  function handleTouchEnd(event) {
    if (touchStartX === null || touchStartY === null) return;
    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
    const touchEndY = event.changedTouches[0]?.clientY ?? touchStartY;
    const horizontalDistance = touchEndX - touchStartX;
    const verticalDistance = touchEndY - touchStartY;
    touchStartX = null;
    touchStartY = null;

    if (
      touchStartedOnControl ||
      overview.classList.contains("open") ||
      Math.abs(horizontalDistance) < 60 ||
      Math.abs(horizontalDistance) <= Math.abs(verticalDistance)
    ) {
      touchStartedOnControl = false;
      return;
    }

    touchStartedOnControl = false;
    if (horizontalDistance < 0) nextSlide();
    else previousSlide();
  }

  function initializeTheme() {
    applyTheme("light");
  }

  document.getElementById("prev-slide").addEventListener("click", previousSlide);
  document.getElementById("next-slide").addEventListener("click", nextSlide);
  overviewButton.addEventListener("click", toggleOverview);
  document.getElementById("close-overview").addEventListener("click", () => closeOverview());
  document.getElementById("fullscreen-button").addEventListener("click", toggleFullscreen);

  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("fullscreenchange", syncFullscreenButton);
  document.addEventListener("touchstart", handleTouchStart, { passive: true });
  document.addEventListener("touchend", handleTouchEnd, { passive: true });
  function renderFromLocation() {
    const index = getIndexFromHash(null);
    if (index !== null) renderSlide(index, false);
  }

  window.addEventListener("hashchange", renderFromLocation);
  window.addEventListener("popstate", renderFromLocation);

  totalLabel.textContent = formatNumber(slides.length);
  initializeTheme();
  buildOverview();
  renderSlide(currentIndex, false);
  syncFullscreenButton();
})();
