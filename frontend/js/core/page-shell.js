import { mountAppShell } from "../components/app-shell.js";
import { ApiError, apiRequest, clearAuthToken, getAuthToken } from "../api.js";

function showStartupError(root, pageName, error, retry) {
  console.error(`MELIO could not start the ${pageName} page.`, error);
  const retryPage = retry || (() => window.location.reload());

  if (root) {
    const message = error instanceof ApiError && error.status === 0
      ? "The MELIO server could not be reached. Check your connection and try again."
      : "Reload the page or try again.";
    root.innerHTML = `
      <main class="app-error" role="alert">
        <div>
          <h1>MELIO could not load this page</h1>
          <p>${message}</p>
          <div class="app-error__actions">
            <button class="btn btn-primary" type="button" data-startup-retry>Try again</button>
            <a class="btn btn-primary" href="index.html">Return to dashboard</a>
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
        await retryPage();
      } catch (retryError) {
        showStartupError(root, pageName, retryError, retryPage);
      }
    });
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

  startPage().catch((error) => showStartupError(root, name, error, startPage));
}
