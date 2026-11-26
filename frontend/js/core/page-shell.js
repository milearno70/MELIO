import { mountAppShell } from "../components/app-shell.js";
import { ApiError, apiRequest, clearAuthToken, getAuthToken } from "../api.js";

function showStartupError(root, pageName, error) {
  console.error(`MELIO could not start the ${pageName} page.`, error);

  if (root) {
    root.innerHTML = `
      <main class="app-error" role="alert">
        <div>
          <h1>MELIO could not load this page</h1>
          <p>Reload the page or return to the dashboard.</p>
          <a class="btn btn-primary" href="index.html">Return to dashboard</a>
        </div>
      </main>`;
  }
}

export function startAppPage({ templateId, activePage, pageName, initialize }) {
  const root = document.querySelector("#app-root");
  const contentTemplate = document.querySelector(`#${templateId}`);
  const name = pageName || activePage;

  if (!root || !(contentTemplate instanceof HTMLTemplateElement)) {
    showStartupError(root, name, new Error("The page root or content template is missing."));
    return;
  }

  async function startPage() {
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

    await mountAppShell({ root, contentTemplate, activePage, currentUser });
    initialize(root, currentUser);
  }

  startPage().catch((error) => showStartupError(root, name, error));
}
