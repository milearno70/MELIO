import {
  DEFAULT_APPEARANCE,
  applyAppPreferences,
  readAppearancePreferences,
  readNotificationPreferences,
  readUserProfile,
  saveAppearancePreferences,
  saveNotificationPreferences,
  saveUserProfile
} from "../core/preferences.js";
import { startAppPage } from "../core/page-shell.js";

function initializeSettings(root) {
  const page = root.querySelector(".settings-page");
  const profileForm = page.querySelector("[data-profile-form]");
  const appearanceForm = page.querySelector("[data-appearance-form]");
  const notificationsForm = page.querySelector("[data-notifications-form]");
  const nameInput = profileForm.elements.namedItem("name");
  const profile = readUserProfile();
  const appearance = readAppearancePreferences();
  const notifications = readNotificationPreferences();

  nameInput.value = profile.name;
  profileForm.elements.namedItem("email").value = profile.email;
  appearanceForm.querySelector(`[name="theme"][value="${appearance.theme}"]`).checked = true;
  appearanceForm.elements.namedItem("textSize").value = appearance.textSize;
  appearanceForm.elements.namedItem("reduceMotion").checked = appearance.reduceMotion;
  for (const [key, value] of Object.entries(notifications)) {
    notificationsForm.elements.namedItem(key).checked = value;
  }

  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(profileForm);
    const name = String(formData.get("name") || "").trim();
    nameInput.setCustomValidity(name ? "" : "Enter a display name.");
    if (!profileForm.reportValidity()) return;
    const saved = saveUserProfile({
      name,
      email: formData.get("email")
    });
    const feedback = page.querySelector("[data-profile-feedback]");
    feedback.textContent = saved ? "Your profile is saved in this browser." : "Could not save your profile.";
    feedback.dataset.state = saved ? "saved" : "error";
    if (saved) applyAppPreferences(root);
  });

  appearanceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(appearanceForm);
    const saved = saveAppearancePreferences({
      theme: formData.get("theme"),
      textSize: formData.get("textSize"),
      reduceMotion: formData.has("reduceMotion")
    });
    const feedback = page.querySelector("[data-appearance-feedback]");
    feedback.textContent = saved ? "Your notebook style is saved." : "Could not save your appearance settings.";
    feedback.dataset.state = saved ? "saved" : "error";
    if (saved) applyAppPreferences(root);
  });

  page.querySelector("[data-reset-appearance]").addEventListener("click", () => {
    appearanceForm.querySelector(`[name="theme"][value="${DEFAULT_APPEARANCE.theme}"]`).checked = true;
    appearanceForm.elements.namedItem("textSize").value = DEFAULT_APPEARANCE.textSize;
    appearanceForm.elements.namedItem("reduceMotion").checked = DEFAULT_APPEARANCE.reduceMotion;
    const saved = saveAppearancePreferences(DEFAULT_APPEARANCE);
    const feedback = page.querySelector("[data-appearance-feedback]");
    feedback.textContent = saved ? "Warm paper is back." : "Could not reset appearance settings.";
    feedback.dataset.state = saved ? "saved" : "error";
    if (saved) applyAppPreferences(root);
  });

  notificationsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(notificationsForm);
    const saved = saveNotificationPreferences({
      taskReminders: formData.has("taskReminders"),
      studyNudges: formData.has("studyNudges"),
      rewardUpdates: formData.has("rewardUpdates")
    });
    const feedback = page.querySelector("[data-notifications-feedback]");
    feedback.textContent = saved
      ? "Reminder preferences are saved. Delivery is not connected yet."
      : "Could not save reminder preferences.";
    feedback.dataset.state = saved ? "saved" : "error";
  });
}

startAppPage({
  templateId: "settings-template",
  activePage: "settings",
  pageName: "Settings",
  initialize: initializeSettings
});
