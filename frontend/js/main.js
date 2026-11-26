import { mountAppShell } from "./components/app-shell.js";
import { initializeDashboard } from "./pages/dashboard.js";
import { ApiError, apiRequest, clearAuthToken, getAuthToken } from "./api.js";

async function startDashboard() {
  if (!getAuthToken()) {
    window.location.replace("login.html");
    return;
  }

  let currentUser;
  try {
    currentUser = await apiRequest("/api/auth/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearAuthToken();
      window.location.replace("login.html");
      return;
    }
    throw error;
  }

  const root = document.querySelector("#app-root");
  const contentTemplate = document.querySelector("#dashboard-template");

  if (!root || !contentTemplate) {
    throw new Error("The dashboard entry is missing its application root or content template.");
  }

  await mountAppShell({
    root,
    contentTemplate,
    activePage: "dashboard",
    currentUser
  });
  await initializeDashboard(root, currentUser);
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