import { initializeHeader } from "./header.js";
import { initializeSidebar } from "./sidebar.js";
import { applyAppPreferences } from "../core/preferences.js";

export async function mountAppShell({ root, contentTemplate, activePage, currentUser }) {
  if (!(contentTemplate instanceof HTMLTemplateElement)) {
    throw new TypeError("A page content template is required to mount the MELIO shell.");
  }

  const shellUrl = new URL("../../components/app-shell.html", import.meta.url);
  const response = await fetch(shellUrl);
  if (!response.ok) {
    throw new Error(`Unable to load the MELIO application shell (${response.status}).`);
  }

  root.innerHTML = await response.text();
  const contentTarget = root.querySelector("[data-shell-content]");
  if (!contentTarget) {
    throw new Error("The MELIO application shell has no main content target.");
  }

  contentTarget.append(contentTemplate.content.cloneNode(true));
  initializeSidebar(root, activePage);
  initializeHeader(root);
  applyAppPreferences(root, currentUser);
  root.setAttribute("aria-busy", "false");
}
