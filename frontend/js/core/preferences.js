import { readStoredData, writeStoredData } from "./storage.js";

const PROFILE_KEY = "user-profile";
const APPEARANCE_KEY = "app-appearance";
const NOTIFICATIONS_KEY = "notification-preferences";
const DEFAULT_PROFILE = { name: "Mely", email: "" };
export const DEFAULT_APPEARANCE = { theme: "paper", textSize: "standard", reduceMotion: false };
export const DEFAULT_NOTIFICATIONS = { taskReminders: true, studyNudges: true, rewardUpdates: true };

const THEMES = ["paper", "rose", "mint"];
const TEXT_SIZES = ["standard", "large"];

export function readUserProfile() {
  const stored = readStoredData(PROFILE_KEY, null);
  if (!stored || typeof stored !== "object") return { ...DEFAULT_PROFILE };
  return {
    name: typeof stored.name === "string" && stored.name.trim() ? stored.name.trim().slice(0, 40) : DEFAULT_PROFILE.name,
    email: typeof stored.email === "string" ? stored.email.trim().slice(0, 120) : DEFAULT_PROFILE.email
  };
}

export function saveUserProfile(profile) {
  return writeStoredData(PROFILE_KEY, {
    name: String(profile.name || DEFAULT_PROFILE.name).trim().slice(0, 40) || DEFAULT_PROFILE.name,
    email: String(profile.email || "").trim().slice(0, 120)
  });
}

export function readAppearancePreferences() {
  const stored = readStoredData(APPEARANCE_KEY, null);
  if (!stored || typeof stored !== "object") return { ...DEFAULT_APPEARANCE };
  return {
    theme: THEMES.includes(stored.theme) ? stored.theme : DEFAULT_APPEARANCE.theme,
    textSize: TEXT_SIZES.includes(stored.textSize) ? stored.textSize : DEFAULT_APPEARANCE.textSize,
    reduceMotion: Boolean(stored.reduceMotion)
  };
}

export function saveAppearancePreferences(preferences) {
  return writeStoredData(APPEARANCE_KEY, {
    theme: THEMES.includes(preferences.theme) ? preferences.theme : DEFAULT_APPEARANCE.theme,
    textSize: TEXT_SIZES.includes(preferences.textSize) ? preferences.textSize : DEFAULT_APPEARANCE.textSize,
    reduceMotion: Boolean(preferences.reduceMotion)
  });
}

export function readNotificationPreferences() {
  const stored = readStoredData(NOTIFICATIONS_KEY, null);
  if (!stored || typeof stored !== "object") return { ...DEFAULT_NOTIFICATIONS };
  return {
    taskReminders: stored.taskReminders === undefined ? DEFAULT_NOTIFICATIONS.taskReminders : Boolean(stored.taskReminders),
    studyNudges: stored.studyNudges === undefined ? DEFAULT_NOTIFICATIONS.studyNudges : Boolean(stored.studyNudges),
    rewardUpdates: stored.rewardUpdates === undefined ? DEFAULT_NOTIFICATIONS.rewardUpdates : Boolean(stored.rewardUpdates)
  };
}

export function saveNotificationPreferences(preferences) {
  return writeStoredData(NOTIFICATIONS_KEY, {
    taskReminders: Boolean(preferences.taskReminders),
    studyNudges: Boolean(preferences.studyNudges),
    rewardUpdates: Boolean(preferences.rewardUpdates)
  });
}

export function applyAppPreferences(root, currentUser) {
  const appearance = readAppearancePreferences();
  const profile = readUserProfile();
  const documentRoot = root.ownerDocument.documentElement;
  documentRoot.dataset.colorTheme = appearance.theme;
  documentRoot.dataset.textSize = appearance.textSize;
  documentRoot.dataset.reduceMotion = String(appearance.reduceMotion);

  const profileGroup = root.querySelector(".sidebar__profile");
  if (!profileGroup) return;
  const name = profileGroup.querySelector("[data-profile-name]");
  const avatar = profileGroup.querySelector(".sidebar__avatar");
  const displayName = typeof currentUser?.name === "string" && currentUser.name.trim()
    ? currentUser.name.trim()
    : profile.name;
  profileGroup.setAttribute("aria-label", `Profile: ${displayName}, Level 3 learner`);
  name.textContent = displayName;
  avatar.textContent = Array.from(displayName)[0].toLocaleUpperCase();
}
