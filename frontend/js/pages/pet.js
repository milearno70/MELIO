import { DEFAULT_PET_LOOK, mountPetAvatar, PET_HAIR_COLORS } from "../components/pet-avatar.js";
import { readStoredData, writeStoredData } from "../core/storage.js";
import { startAppPage } from "../core/page-shell.js";

const STATE_KEY = "pet-rewards-state";
const SESSIONS_KEY = "study-sessions";
const REWARDS = [
  {
    id: "focus-friend",
    title: "Focus Friend",
    description: "Finish three focus sessions together.",
    icon: "✦",
    target: 3,
    progress: (state, focusSessions) => focusSessions.length
  },
  {
    id: "gentle-care",
    title: "Gentle Care",
    description: "Share three cozy treats with Mochi.",
    icon: "♡",
    target: 3,
    progress: (state) => state.feedCount
  },
  {
    id: "happy-heart",
    title: "Happy Heart",
    description: "Help Mochi feel 90% happy.",
    icon: "♥",
    target: 90,
    progress: (state) => state.happiness
  }
];
const DEFAULT_STATE = {
  look: DEFAULT_PET_LOOK,
  happiness: 72,
  energy: 68,
  xp: 45,
  level: 3,
  treats: 4,
  feedCount: 0,
  claimedRewards: [],
  message: "Mochi is happy you’re here. What shall you do together?"
};

function boundedNumber(value, fallback, maximum) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(0, Math.round(parsed))) : fallback;
}

function normalizeState(value) {
  const input = value && typeof value === "object" ? value : {};
  return {
    look: { ...DEFAULT_PET_LOOK, ...(input.look && typeof input.look === "object" ? input.look : {}) },
    happiness: boundedNumber(input.happiness, DEFAULT_STATE.happiness, 100),
    energy: boundedNumber(input.energy, DEFAULT_STATE.energy, 100),
    xp: boundedNumber(input.xp, DEFAULT_STATE.xp, 99),
    level: Math.max(1, boundedNumber(input.level, DEFAULT_STATE.level, 999)),
    treats: boundedNumber(input.treats, DEFAULT_STATE.treats, 99),
    feedCount: boundedNumber(input.feedCount, 0, 9999),
    claimedRewards: Array.isArray(input.claimedRewards)
      ? [...new Set(input.claimedRewards.filter((id) => REWARDS.some((reward) => reward.id === id)))]
      : [],
    message: typeof input.message === "string" ? input.message.slice(0, 180) : DEFAULT_STATE.message
  };
}

function normalizeFocusSessions(value) {
  return Array.isArray(value)
    ? value.filter((session) => session && !session.sample && Number(session.minutes) > 0)
    : [];
}

function initializePet(root) {
  const page = root.querySelector(".pet-page");
  const state = normalizeState(readStoredData(STATE_KEY, null));
  const focusSessions = normalizeFocusSessions(readStoredData(SESSIONS_KEY, null));
  const avatar = mountPetAvatar(page.querySelector("[data-pet-avatar]"), state.look);

  function saveState() {
    const saved = writeStoredData(STATE_KEY, state);
    const status = page.querySelector("[data-pet-save-status]");
    status.textContent = saved ? "Mochi’s care is saved in this browser." : "Could not save Mochi’s care.";
    status.dataset.state = saved ? "saved" : "error";
  }

  function gainXp(amount) {
    const total = state.xp + amount;
    state.level += Math.floor(total / 100);
    state.xp = total % 100;
    return state.level;
  }

  function updateMeter(selector, value) {
    const meter = page.querySelector(selector);
    meter.setAttribute("aria-valuenow", String(value));
    meter.querySelector("span").style.setProperty("--pet-progress", `${value}%`);
  }

  function renderState() {
    page.querySelector("[data-happiness-value]").textContent = `${state.happiness}%`;
    page.querySelector("[data-energy-value]").textContent = `${state.energy}%`;
    page.querySelector("[data-level]").textContent = String(state.level);
    page.querySelector("[data-xp-value]").textContent = String(state.xp);
    page.querySelector("[data-treat-count]").textContent = String(state.treats);
    page.querySelector("[data-pet-message]").textContent = state.message;
    updateMeter("[data-happiness-bar]", state.happiness);
    updateMeter("[data-energy-bar]", state.energy);
    updateMeter("[data-xp-bar]", state.xp);
    page.querySelector("[data-care-action='feed']").disabled = state.treats === 0;
    page.querySelector("[data-care-action='play']").disabled = state.energy < 10;
    page.querySelector("[data-reward-count]").textContent =
      `${state.claimedRewards.length} ${state.claimedRewards.length === 1 ? "sticker" : "stickers"} collected`;
  }

  function renderChoices(container, choices, selected, onSelect, colorChoices = false) {
    const buttons = choices.map((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `pet-choice${colorChoices ? " pet-choice--swatch" : ""}`;
      const value = typeof choice === "object" ? choice.name : choice;
      const label = colorChoices ? value : `${typeof choice === "number" ? "Option" : "Style"} ${value}`;
      button.setAttribute("aria-label", label);
      button.setAttribute("aria-pressed", String(value === selected));
      if (colorChoices) {
        button.style.backgroundColor = choice.hex;
        button.title = value;
      } else {
        button.textContent = String(value);
      }
      button.addEventListener("click", () => onSelect(value));
      return button;
    });
    container.replaceChildren(...buttons);
  }

  function renderCustomizer() {
    const look = avatar.getLook();
    renderChoices(page.querySelector("[data-skin-options]"), [1, 2, 3, 4], look.skin, (skin) => updateLook({ skin }));
    renderChoices(page.querySelector("[data-outfit-options]"), [1, 2, 3, 4, 5], look.clothes, (clothes) => updateLook({ clothes }));
    renderChoices(page.querySelector("[data-face-options]"), [1, 2, 3, 4], look.face, (face) => updateLook({ face }));
    renderChoices(page.querySelector("[data-hair-style-options]"), [1, 2, 3, 4, 5], look.hairStyle, (hairStyle) => updateLook({ hairStyle }));
    renderChoices(page.querySelector("[data-hair-color-options]"), PET_HAIR_COLORS, look.hairColor, (hairColor) => updateLook({ hairColor }), true);
    page.querySelector("[data-hair-color-group]").hidden = !look.hairStyle;
  }

  function updateLook(changes) {
    state.look = avatar.update(changes);
    saveState();
    renderCustomizer();
  }

  function renderRewards() {
    const grid = page.querySelector("[data-reward-grid]");
    const cards = REWARDS.map((reward) => {
      const progress = reward.progress(state, focusSessions);
      const claimed = state.claimedRewards.includes(reward.id);
      const ready = progress >= reward.target;
      const card = document.createElement("article");
      card.className = "reward-card";

      const top = document.createElement("div");
      top.className = "reward-card__top";
      const sticker = document.createElement("span");
      sticker.className = "reward-card__sticker";
      sticker.setAttribute("aria-hidden", "true");
      sticker.textContent = reward.icon;
      const titleWrap = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = reward.title;
      const description = document.createElement("p");
      description.textContent = reward.description;
      titleWrap.append(title, description);
      top.append(sticker, titleWrap);

      const progressLabel = document.createElement("div");
      progressLabel.className = "reward-card__progress-label";
      const progressCopy = document.createElement("span");
      progressCopy.textContent = claimed ? "Collected" : ready ? "Ready to collect" : "Your progress";
      const progressValue = document.createElement("span");
      progressValue.textContent = `${Math.min(progress, reward.target)} / ${reward.target}`;
      progressLabel.append(progressCopy, progressValue);
      const track = document.createElement("div");
      track.className = "progress-track";
      track.setAttribute("role", "progressbar");
      track.setAttribute("aria-label", `${reward.title} progress`);
      track.setAttribute("aria-valuemin", "0");
      track.setAttribute("aria-valuemax", String(reward.target));
      track.setAttribute("aria-valuenow", String(Math.min(progress, reward.target)));
      const fill = document.createElement("span");
      fill.style.setProperty("--progress", `${Math.min(100, progress / reward.target * 100)}%`);
      fill.style.setProperty("--progress-color", "var(--color-primary)");
      track.append(fill);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "reward-card__button";
      button.disabled = !ready || claimed;
      button.dataset.claimed = String(claimed);
      button.textContent = claimed ? "Sticker collected" : ready ? "Collect reward" : "In progress";
      button.setAttribute("aria-label", `${button.textContent}: ${reward.title}`);
      button.addEventListener("click", () => {
        if (!ready || claimed) return;
        state.claimedRewards.push(reward.id);
        state.treats = Math.min(99, state.treats + 1);
        const previousLevel = state.level;
        const newLevel = gainXp(15);
        state.message = newLevel > previousLevel ? "Mochi levelled up! Your friendship is growing." : `${reward.title} is tucked into the sticker book!`;
        saveState();
        renderState();
        renderRewards();
      });

      card.append(top, progressLabel, track, button);
      return card;
    });
    grid.replaceChildren(...cards);
  }

  function interact(action) {
    if (action === "feed") {
      if (state.treats < 1) {
        state.message = "Mochi is out of treats. Collect a sticker reward for another one.";
        renderState();
        return;
      }
      state.treats -= 1;
      state.feedCount += 1;
      state.happiness = Math.min(100, state.happiness + 12);
      state.energy = Math.min(100, state.energy + 4);
      const previousLevel = state.level;
      gainXp(8);
      state.message = state.level > previousLevel ? "Mochi grew a level after that lovely treat!" : "Mochi happily accepted a little treat. ♡";
    } else if (action === "play") {
      if (state.energy < 10) {
        state.message = "Mochi needs a little rest before playing.";
        renderState();
        return;
      }
      state.happiness = Math.min(100, state.happiness + 15);
      state.energy = Math.max(0, state.energy - 12);
      const previousLevel = state.level;
      gainXp(12);
      state.message = state.level > previousLevel ? "A lovely playtime leveled Mochi up!" : "Mochi had so much fun playing with you! ✦";
    } else if (action === "rest") {
      state.energy = Math.min(100, state.energy + 25);
      state.happiness = Math.min(100, state.happiness + 2);
      const previousLevel = state.level;
      gainXp(4);
      state.message = state.level > previousLevel ? "Mochi woke up a little more grown-up!" : "A quiet rest helped Mochi feel refreshed. ☾";
    }

    saveState();
    renderState();
    renderRewards();
  }

  page.querySelectorAll("[data-care-action]").forEach((button) => {
    button.addEventListener("click", () => interact(button.dataset.careAction));
  });

  renderState();
  renderCustomizer();
  renderRewards();
}

startAppPage({
  templateId: "pet-template",
  activePage: "pet",
  pageName: "Pet & Rewards",
  initialize: initializePet
});
