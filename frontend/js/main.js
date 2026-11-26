import { mountAppShell } from "./components/app-shell.js";
import { initializeDashboard } from "./pages/dashboard.js";
import { ApiError, apiRequest, clearAuthToken, getAuthToken } from "./api.js";

function showStartupError(root, error) {
  const message = error instanceof ApiError && error.status === 0
    ? "The MELIO server could not be reached. Check your connection and try again."
    : "Reload the page or try again.";
  root.innerHTML = `
    <main class="app-error" role="alert">
      <div>
        <h1>MELIO could not load</h1>
        <p>${message}</p>
        <div class="app-error__actions">
          <button class="btn btn-primary" type="button" data-startup-retry>Try again</button>
        </div>
      </div>
    </main>`;
  root.setAttribute("aria-busy", "false");
  root.querySelector("[data-startup-retry]").addEventListener("click", async (event) => {
    const retryButton = event.currentTarget;
    retryButton.disabled = true;
    retryButton.textContent = "Retrying…";
    root.setAttribute("aria-busy", "true");
    try {
      await startDashboard();
    } catch (retryError) {
      console.error("MELIO could not restart the dashboard.", retryError);
      showStartupError(root, retryError);
    }
  });
}

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

  if (root) showStartupError(root, error);
});
