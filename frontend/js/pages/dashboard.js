import { icon } from "../components/icons.js";

export function initializeDashboard(root) {
  root.querySelectorAll("[data-dashboard-icon]").forEach((element) => {
    element.innerHTML = icon(element.dataset.dashboardIcon);
  });

  const mobileCloseLinks = root.querySelectorAll(".sidebar__link");
  mobileCloseLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 680px)").matches) {
        root.dispatchEvent(new CustomEvent("melio:close-navigation"));
      }
    });
  });
}
