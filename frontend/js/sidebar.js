(() => {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("sidebar-toggle");
  if (!sidebar || !toggle) return;

  const storageKey = "melio-sidebar-collapsed";
  const applyState = (collapsed) => {
    sidebar.classList.toggle("collapsed", collapsed);
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
  };

  let saved = false;
  try { saved = localStorage.getItem(storageKey) === "true"; } catch (_) {}
  applyState(saved);

  toggle.addEventListener("click", () => {
    const collapsed = !sidebar.classList.contains("collapsed");
    applyState(collapsed);
    try { localStorage.setItem(storageKey, String(collapsed)); } catch (_) {}
  });
})();
