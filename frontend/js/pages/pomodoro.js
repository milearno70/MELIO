import { readStoredData, writeStoredData } from "../core/storage.js";
import { startAppPage } from "../core/page-shell.js";

const SETTINGS_KEY = "pomodoro-settings";
const SESSIONS_KEY = "study-sessions";
const DEFAULT_SETTINGS = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakEvery: 4,
  subject: "Programming"
};
const MODE_LABELS = {
  focus: "Focus session",
  shortBreak: "Short break",
  longBreak: "Long break"
};
const MODE_BUTTONS = ["focus", "shortBreak", "longBreak"];
const SAMPLE_SESSION = {
  id: "sample-pomodoro-session",
  subject: "Programming",
  minutes: 1,
  completedAt: new Date().toISOString(),
  sample: true
};

function normalizeSettings(value) {
  const settings = { ...DEFAULT_SETTINGS, ...(value && typeof value === "object" ? value : {}) };
  for (const key of ["focus", "shortBreak", "longBreak", "longBreakEvery"]) {
    const maximum = key === "focus" ? 180 : key === "longBreakEvery" ? 10 : 90;
    const minimum = key === "longBreakEvery" ? 2 : 1;
    const parsed = Number(settings[key]);
    settings[key] = Number.isFinite(parsed)
      ? Math.min(maximum, Math.max(minimum, Math.round(parsed)))
      : DEFAULT_SETTINGS[key];
  }
  if (typeof settings.subject !== "string") settings.subject = DEFAULT_SETTINGS.subject;
  return settings;
}

function normalizeSessions(value) {
  if (!Array.isArray(value)) return [SAMPLE_SESSION];
  return value.filter((session) =>
    session && typeof session.subject === "string" && Number.isFinite(Number(session.minutes))
  );
}

function initializePomodoro(root) {
  const page = root.querySelector(".pomodoro-page");
  const timeDisplay = page.querySelector("[data-timer-display]");
  const modeLabel = page.querySelector("[data-mode-label]");
  const dial = page.querySelector("[data-timer-dial]");
  const status = page.querySelector("[data-timer-status]");
  const startButton = page.querySelector("[data-start]");
  const pauseButton = page.querySelector("[data-pause]");
  const settingsForm = page.querySelector("[data-settings-form]");
  const settingsFeedback = page.querySelector("[data-settings-feedback]");
  const sessionsList = page.querySelector("[data-session-list]");
  const emptySessions = page.querySelector("[data-empty-sessions]");
  const subjectSelect = page.querySelector("[data-subject]");
  const cycleCount = page.querySelector("[data-cycle-count]");

  const settings = normalizeSettings(readStoredData(SETTINGS_KEY, DEFAULT_SETTINGS));
  const sessions = normalizeSessions(readStoredData(SESSIONS_KEY, null));
  const completedFocusSessions = () => sessions.filter((session) => !session.sample).length;
  let mode = "focus";
  let remainingSeconds = settings.focus * 60;
  let startedAt = null;
  let intervalId = null;
  let isRunning = false;

  function durationFor(currentMode) {
    return settings[currentMode] * 60;
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function persistSettings() {
    writeStoredData(SETTINGS_KEY, settings);
  }

  function renderSettings() {
    for (const key of ["focus", "shortBreak", "longBreak", "longBreakEvery"]) {
      settingsForm.elements.namedItem(key).value = String(settings[key]);
    }
    subjectSelect.value = settings.subject;
    cycleCount.textContent = `${completedFocusSessions() % settings.longBreakEvery} / ${settings.longBreakEvery}`;
  }

  function renderSessions() {
    const recentSessions = sessions
      .filter((session) => !session.sample)
      .slice(-5)
      .reverse();
    const visibleSessions = recentSessions.length ? recentSessions : sessions.filter((session) => session.sample);
    sessionsList.replaceChildren();
    emptySessions.hidden = visibleSessions.length > 0;

    for (const session of visibleSessions) {
      const item = document.createElement("li");
      const dot = document.createElement("span");
      const subject = document.createElement("span");
      const details = document.createElement("span");
      dot.className = "session-list__dot";
      dot.setAttribute("aria-hidden", "true");
      subject.textContent = session.subject;
      details.className = "session-list__duration";
      details.textContent = `${session.minutes} min · ${new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit"
      }).format(new Date(session.completedAt))}`;
      item.append(dot, subject, details);
      sessionsList.append(item);
    }
  }

  function render() {
    const total = durationFor(mode);
    const progress = total === 0 ? 0 : (1 - remainingSeconds / total) * 360;
    timeDisplay.value = formatTime(remainingSeconds);
    timeDisplay.textContent = formatTime(remainingSeconds);
    modeLabel.textContent = MODE_LABELS[mode];
    dial.style.setProperty("--timer-progress", `${Math.max(0, Math.min(360, progress))}deg`);
    dial.setAttribute("aria-label", `${formatTime(remainingSeconds)} remaining, ${MODE_LABELS[mode]}`);
    startButton.querySelector("[data-start-label]").textContent = isRunning
      ? "Focus is on"
      : remainingSeconds < total ? "Resume" : "Start focus";
    startButton.disabled = isRunning;
    pauseButton.disabled = !isRunning;
    subjectSelect.disabled = isRunning;
    settingsForm.querySelectorAll("input, button[type='submit']").forEach((control) => {
      control.disabled = isRunning;
    });
    for (const button of page.querySelectorAll("[data-mode]")) {
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
    }
    cycleCount.textContent = `${completedFocusSessions() % settings.longBreakEvery} / ${settings.longBreakEvery}`;
  }

  function stopInterval() {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }

  function changeMode(nextMode, message) {
    stopInterval();
    isRunning = false;
    mode = nextMode;
    remainingSeconds = durationFor(mode);
    startedAt = null;
    if (message) status.textContent = message;
    render();
  }

  function completeTimer() {
    stopInterval();
    isRunning = false;
    remainingSeconds = 0;
    if (mode === "focus") {
      sessions.push({
        id: `session-${Date.now()}`,
        subject: settings.subject,
        minutes: settings.focus,
        completedAt: new Date().toISOString(),
        sample: false
      });
      writeStoredData(SESSIONS_KEY, sessions);
      renderSessions();
      const nextMode = completedFocusSessions() % settings.longBreakEvery === 0
        ? "longBreak"
        : "shortBreak";
      status.textContent = nextMode === "longBreak"
        ? "Lovely work. You’ve earned a long break."
        : "Focus session complete. Take a little short break.";
      mode = nextMode;
    } else {
      status.textContent = "Break complete. Ready for another focus session?";
      mode = "focus";
    }
    remainingSeconds = durationFor(mode);
    startedAt = null;
    render();
  }

  function tick() {
    if (!isRunning || startedAt === null) return;
    remainingSeconds = Math.max(0, Math.ceil((startedAt + durationFor(mode) * 1000 - Date.now()) / 1000));
    if (remainingSeconds <= 0) {
      completeTimer();
      return;
    }
    render();
  }

  function startTimer() {
    if (isRunning) return;
    if (remainingSeconds <= 0) remainingSeconds = durationFor(mode);
    startedAt = Date.now() - (durationFor(mode) - remainingSeconds) * 1000;
    isRunning = true;
    status.textContent = `${MODE_LABELS[mode]} in progress. One small step at a time.`;
    stopInterval();
    intervalId = window.setInterval(tick, 250);
    render();
  }

  function pauseTimer() {
    if (!isRunning || startedAt === null) return;
    remainingSeconds = Math.max(0, Math.ceil((startedAt + durationFor(mode) * 1000 - Date.now()) / 1000));
    isRunning = false;
    startedAt = null;
    stopInterval();
    status.textContent = "Paused. Your place is saved.";
    render();
  }

  function resetTimer() {
    stopInterval();
    isRunning = false;
    startedAt = null;
    remainingSeconds = durationFor(mode);
    status.textContent = "Timer reset. Ready when you are.";
    render();
  }

  settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!settingsForm.reportValidity()) return;

    for (const key of ["focus", "shortBreak", "longBreak", "longBreakEvery"]) {
      settings[key] = Number(settingsForm.elements.namedItem(key).value);
    }
    if (!isRunning) remainingSeconds = durationFor(mode);
    persistSettings();
    renderSettings();
    render();
    settingsFeedback.textContent = "Your timer rhythm is saved.";
  });

  subjectSelect.addEventListener("change", () => {
    settings.subject = subjectSelect.value;
    persistSettings();
    status.textContent = `${settings.subject} is ready for your next session.`;
  });

  page.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      if (isRunning) {
        status.textContent = "Pause the timer before changing modes.";
        return;
      }
      changeMode(button.dataset.mode, `${MODE_LABELS[button.dataset.mode]} selected.`);
    });
  });

  startButton.addEventListener("click", startTimer);
  pauseButton.addEventListener("click", pauseTimer);
  page.querySelector("[data-reset]").addEventListener("click", resetTimer);

  renderSettings();
  renderSessions();
  render();
}

startAppPage({
  templateId: "pomodoro-template",
  activePage: "pomodoro",
  pageName: "Pomodoro",
  initialize: initializePomodoro
});
