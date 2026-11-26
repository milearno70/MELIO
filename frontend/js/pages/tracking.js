import { readStoredData, writeStoredData } from "../core/storage.js";
import { startAppPage } from "../core/page-shell.js";

const SESSIONS_KEY = "study-sessions";
const SETTINGS_KEY = "study-tracking-settings";
const SUBJECTS = ["Programming", "Mathematics", "English", "Database Systems", "Computer Networks", "Other"];
const SUBJECT_COLORS = ["#bfe9d2", "#c5e5f4", "#f7c5d8", "#ded3f4", "#ffddc6", "#fff0b5"];
const DEFAULT_GOAL = 120;
const SAMPLE_SESSION = {
  id: "sample-pomodoro-session",
  subject: "Programming",
  minutes: 1,
  completedAt: new Date().toISOString(),
  sample: true
};

function normalizeSessions(value) {
  if (!Array.isArray(value)) return [SAMPLE_SESSION];
  return value
    .filter((session) => session && Number.isFinite(Number(session.minutes)) && Number(session.minutes) > 0)
    .map((session, index) => {
      const completedAt = new Date(session.completedAt);
      return {
        id: typeof session.id === "string" ? session.id : `session-${index}`,
        subject: SUBJECTS.includes(session.subject) ? session.subject : "Other",
        minutes: Math.min(720, Math.max(1, Math.round(Number(session.minutes)))),
        completedAt: Number.isNaN(completedAt.getTime()) ? new Date().toISOString() : completedAt.toISOString(),
        sample: Boolean(session.sample)
      };
    });
}

function normalizeGoal(value) {
  if (!value || typeof value !== "object") return DEFAULT_GOAL;
  const parsed = Number(value && value.dailyGoal);
  return Number.isFinite(parsed) ? Math.min(720, Math.max(5, Math.round(parsed / 5) * 5)) : DEFAULT_GOAL;
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder} min`;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function initializeTracking(root) {
  const page = root.querySelector(".tracking-page");
  const chart = page.querySelector("[data-activity-chart]");
  const subjectList = page.querySelector("[data-subject-list]");
  const sessionList = page.querySelector("[data-session-list]");
  const subjectFilter = page.querySelector("[data-subject-filter]");
  const goalForm = page.querySelector("[data-goal-form]");
  const goalInput = goalForm.elements.namedItem("dailyGoal");
  const goalFeedback = page.querySelector("[data-goal-feedback]");
  const sessions = normalizeSessions(readStoredData(SESSIONS_KEY, null));
  let dailyGoal = normalizeGoal(readStoredData(SETTINGS_KEY, null));
  let period = 7;

  function getRangeSessions() {
    const now = new Date();
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const rangeStart = todayUtc - (period - 1) * 24 * 60 * 60 * 1000;
    return sessions.filter((session) => {
      const sessionTime = new Date(session.completedAt).getTime();
      const matchesRange = sessionTime >= rangeStart && sessionTime < todayUtc + 24 * 60 * 60 * 1000;
      const matchesSubject = subjectFilter.value === "all" || session.subject === subjectFilter.value;
      return matchesRange && matchesSubject;
    });
  }

  function makeDayBuckets(rangeSessions) {
    const now = new Date();
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const buckets = Array.from({ length: period }, (_, index) => {
      const date = new Date(todayUtc - (period - index - 1) * 24 * 60 * 60 * 1000);
      return {
        key: date.toISOString().slice(0, 10),
        date,
        minutes: 0
      };
    });
    const byDate = new Map(buckets.map((bucket) => [bucket.key, bucket]));
    rangeSessions.forEach((session) => {
      const bucket = byDate.get(session.completedAt.slice(0, 10));
      if (bucket) bucket.minutes += session.minutes;
    });
    return buckets;
  }

  function renderChart(rangeSessions) {
    const buckets = makeDayBuckets(rangeSessions);
    const maxMinutes = Math.max(1, ...buckets.map((bucket) => bucket.minutes));
    const items = buckets.map((bucket) => {
      const item = document.createElement("li");
      item.className = "activity-day";
      const value = document.createElement("span");
      value.className = "activity-day__value";
      value.textContent = bucket.minutes ? formatDuration(bucket.minutes) : "–";
      const bar = document.createElement("span");
      bar.className = "activity-day__bar";
      bar.dataset.active = String(bucket.minutes > 0);
      bar.setAttribute("role", "img");
      const barFill = document.createElement("span");
      barFill.style.height = bucket.minutes ? `${Math.max(5, bucket.minutes / maxMinutes * 100)}%` : "0";
      bar.append(barFill);
      const label = document.createElement("time");
      label.className = "activity-day__label";
      label.dateTime = bucket.key;
      label.textContent = period === 7
        ? new Intl.DateTimeFormat(undefined, { weekday: "short", timeZone: "UTC" }).format(bucket.date)
        : new Intl.DateTimeFormat(undefined, { month: "numeric", day: "numeric", timeZone: "UTC" }).format(bucket.date);
      item.setAttribute("aria-label", `${bucket.key}: ${formatDuration(bucket.minutes)} studied`);
      bar.setAttribute("aria-label", `${formatDuration(bucket.minutes)} studied`);
      item.append(value, bar, label);
      return item;
    });
    chart.replaceChildren(...items);
    page.querySelector("[data-chart-empty]").hidden = rangeSessions.length > 0;
  }

  function renderSubjects(rangeSessions) {
    const totals = new Map(SUBJECTS.map((subject) => [subject, 0]));
    rangeSessions.forEach((session) => {
      totals.set(session.subject, (totals.get(session.subject) || 0) + session.minutes);
    });
    const entries = [...totals.entries()]
      .filter(([, minutes]) => minutes > 0)
      .sort((a, b) => b[1] - a[1]);
    const maxMinutes = Math.max(1, ...entries.map(([, minutes]) => minutes));
    const items = entries.map(([subject, minutes]) => {
      const item = document.createElement("li");
      item.className = "subject-item";
      const name = document.createElement("span");
      name.className = "subject-item__name";
      name.textContent = subject;
      const time = document.createElement("span");
      time.className = "subject-item__time";
      time.textContent = formatDuration(minutes);
      const track = document.createElement("div");
      track.className = "subject-item__track";
      track.setAttribute("role", "progressbar");
      track.setAttribute("aria-label", `${subject} study time`);
      track.setAttribute("aria-valuemin", "0");
      track.setAttribute("aria-valuemax", String(maxMinutes));
      track.setAttribute("aria-valuenow", String(minutes));
      const fill = document.createElement("span");
      fill.style.setProperty("--subject-progress", `${minutes / maxMinutes * 100}%`);
      fill.style.setProperty("--subject-color", SUBJECT_COLORS[SUBJECTS.indexOf(subject)] || SUBJECT_COLORS[5]);
      track.append(fill);
      item.append(name, time, track);
      return item;
    });
    subjectList.replaceChildren(...items);
    page.querySelector("[data-subject-empty]").hidden = entries.length > 0;
  }

  function renderSessions(rangeSessions) {
    const sortedSessions = [...rangeSessions].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    const items = sortedSessions.map((session) => {
      const item = document.createElement("li");
      item.className = "tracking-session";
      const subject = document.createElement("span");
      subject.className = "tracking-session__subject";
      subject.textContent = session.subject;
      const date = document.createElement("time");
      date.className = "tracking-session__date";
      date.dateTime = session.completedAt;
      date.textContent = new Intl.DateTimeFormat(undefined, {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }).format(new Date(session.completedAt));
      const duration = document.createElement("span");
      duration.className = "tracking-session__duration";
      duration.textContent = formatDuration(session.minutes);
      item.append(subject, date, duration);
      return item;
    });
    sessionList.replaceChildren(...items);
    page.querySelector("[data-session-empty]").hidden = sortedSessions.length > 0;
  }

  function render() {
    const rangeSessions = getRangeSessions();
    const totalMinutes = rangeSessions.reduce((total, session) => total + session.minutes, 0);
    const activeDays = new Set(rangeSessions.map((session) => session.completedAt.slice(0, 10))).size;
    page.querySelector("[data-total-time]").textContent = formatDuration(totalMinutes);
    page.querySelector("[data-session-total]").textContent = String(rangeSessions.length);
    page.querySelector("[data-active-days]").textContent = String(activeDays);
    goalInput.value = String(dailyGoal);
    renderChart(rangeSessions);
    renderSubjects(rangeSessions);
    renderSessions(rangeSessions);
  }

  page.querySelectorAll("[data-period]").forEach((button) => {
    button.addEventListener("click", () => {
      period = Number(button.dataset.period);
      page.querySelectorAll("[data-period]").forEach((periodButton) => {
        periodButton.setAttribute("aria-pressed", String(periodButton === button));
      });
      render();
    });
  });

  subjectFilter.addEventListener("change", render);
  goalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!goalForm.reportValidity()) return;
    dailyGoal = Math.min(720, Math.max(5, Math.round(Number(goalInput.value) / 5) * 5));
    const saved = writeStoredData(SETTINGS_KEY, { dailyGoal });
    goalInput.value = String(dailyGoal);
    goalFeedback.textContent = saved ? "Daily study goal saved." : "Could not save your goal.";
  });

  render();
}

startAppPage({
  templateId: "tracking-template",
  activePage: "tracking",
  pageName: "Study Tracking",
  initialize: initializeTracking
});
