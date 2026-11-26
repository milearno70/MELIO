import { icon } from "./icons.js";

export function initializeHeader(root) {
  const header = root.querySelector("[data-app-header]");
  const frame = root.querySelector("[data-app-frame]");

  if (!header || !frame) {
    throw new Error("The MELIO application shell is missing its header.");
  }

  const date = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date());

  header.innerHTML = `
    <button
      class="icon-button header__menu-toggle"
      type="button"
      data-mobile-menu-toggle
      aria-controls="app-sidebar"
      aria-expanded="false"
      aria-label="Open navigation">
      ${icon("menu")}
    </button>
    <div class="header__brand-copy">
      <span class="header__date">${date}</span>
      <span class="header__tagline">Little Steps, Big Dreams.</span>
    </div>
    <label class="header__search">
      <span class="visually-hidden">Search your study universe</span>
      ${icon("search", "header__search-icon")}
      <input class="form-input" type="search" placeholder="Search your study universe">
    </label>
    <span class="icon-button" aria-label="Notifications">
      ${icon("bell")}
    </span>
    <span class="header__points">
      ${icon("star")}
      <span>5 pts</span>
    </span>`;

  const menuToggle = header.querySelector("[data-mobile-menu-toggle]");
  const sidebar = root.querySelector("#app-sidebar");
  const backdrop = root.querySelector("[data-sidebar-backdrop]");
  const mobileViewport = window.matchMedia("(max-width: 680px)");

  const setMobileMenuOpen = (open) => {
    frame.dataset.mobileOpen = String(open);
    backdrop.hidden = !open;
    sidebar.inert = mobileViewport.matches && !open;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = frame.dataset.mobileOpen === "true";
    setMobileMenuOpen(!isOpen);
  });

  root.addEventListener("melio:close-navigation", () => {
    setMobileMenuOpen(false);
  });

  mobileViewport.addEventListener("change", () => {
    setMobileMenuOpen(false);
  });

  if (mobileViewport.matches) {
    sidebar.inert = true;
  }
}
