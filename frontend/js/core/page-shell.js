import { mountAppShell } from "../components/app-shell.js";

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

  mountAppShell({ root, contentTemplate, activePage })
    .then(() => initialize(root))
    .catch((error) => showStartupError(root, name, error));
}
