import { icon } from "./icons.js";
import { readBooleanPreference, writeBooleanPreference } from "../core/storage.js";
import { clearAuthToken } from "../api.js";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "index.html", icon: "dashboard" },
  { id: "pomodoro", label: "Pomodoro", href: "pomodoro.html", icon: "pomodoro" },
  { id: "library", label: "My Library", href: "library.html", icon: "library" },
  { id: "notes", label: "Notes", href: "notes.html", icon: "notes" },
  { id: "tracking", label: "Study Tracking", href: "tracking.html", icon: "tracking" },
  { id: "pet", label: "Pet & Rewards", href: "pet.html", icon: "pet" },
  { id: "tasks", label: "Tasks", href: "tasks.html", icon: "tasks" }
];

export function initializeSidebar(root, activePage) {
  const frame = root.querySelector("[data-app-frame]");
  const sidebar = root.querySelector("#app-sidebar");
  const navigation = root.querySelector("[data-sidebar-items]");
  const collapseButton = root.querySelector("[data-sidebar-toggle]");
  const backdrop = root.querySelector("[data-sidebar-backdrop]");
  const settingsIcon = root.querySelector('[data-icon="settings"]');
  const settingsLink = root.querySelector(".sidebar__settings");
  const logoutButton = root.querySelector("[data-logout]");
  const logoutIcon = root.querySelector('[data-icon="logout"]');

  if (!frame || !sidebar || !navigation || !collapseButton || !backdrop ||
      !settingsIcon || !settingsLink || !logoutButton || !logoutIcon) {
    throw new Error("The MELIO application shell is missing sidebar elements.");
  }

  if (activePage === "settings") settingsLink.setAttribute("aria-current", "page");
  else settingsLink.removeAttribute("aria-current");

  settingsIcon.innerHTML = icon("settings", "sidebar__icon");
  logoutIcon.innerHTML = icon("logout", "sidebar__icon");
  navigation.innerHTML = NAV_ITEMS.map((item) => {
    const isActive = item.id === activePage;
    return `
      <li>
        <a
          class="sidebar__link sidebar__link--${item.id}"
          href="${item.href}"
          ${isActive ? 'aria-current="page"' : ""}
          title="${item.label}">
          ${icon(item.icon, "sidebar__icon")}
          <span class="sidebar__label">${item.label}</span>
        </a>
      </li>`;
  }).join("");

  const setCollapsed = (collapsed, persist = false) => {
    frame.dataset.collapsed = String(collapsed);
    collapseButton.setAttribute("aria-expanded", String(!collapsed));
    collapseButton.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
    collapseButton.title = collapsed ? "Expand sidebar" : "Collapse sidebar";
    collapseButton.innerHTML = icon(collapsed ? "chevronRight" : "chevronLeft", "sidebar__collapse-icon");

    if (persist) {
      writeBooleanPreference("sidebar-collapsed", collapsed);
    }
  };

  setCollapsed(readBooleanPreference("sidebar-collapsed"));
  collapseButton.addEventListener("click", () => {
    setCollapsed(frame.dataset.collapsed !== "true", true);
  });

  backdrop.addEventListener("click", () => {
    root.dispatchEvent(new CustomEvent("melio:close-navigation"));
  });
  logoutButton.addEventListener("click", () => {
    if (!clearAuthToken()) {
      console.error("MELIO could not clear every saved authentication token before logging out.");
    }
    window.location.replace("login.html");
  });
  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && frame.dataset.mobileOpen === "true") {
      root.dispatchEvent(new CustomEvent("melio:close-navigation"));
      root.querySelector("[data-mobile-menu-toggle]").focus();
    }
  });
}
