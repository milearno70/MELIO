import { mountAppShell } from "./components/app-shell.js";
import { initializeDashboard } from "./pages/dashboard.js";

async function startDashboard() {
  const root = document.querySelector("#app-root");
  const contentTemplate = document.querySelector("#dashboard-template");

  if (!root || !contentTemplate) {
    throw new Error("The dashboard entry is missing its application root or content template.");
  }

  await mountAppShell({
    root,
    contentTemplate,
    activePage: "dashboard"
  });
  initializeDashboard(root);
}

startDashboard().catch((error) => {
  console.error("MELIO could not start the dashboard.", error);
  const root = document.querySelector("#app-root");

  if (root) {
    root.innerHTML = `
      <main class="app-error" role="alert">
        <div>
          <h1>MELIO could not load</h1>
          <p>Run the frontend from a local web server, then reload this page.</p>
        </div>
      </main>`;
  }
});