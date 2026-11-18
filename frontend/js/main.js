(() => {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  // Date header and paper calendar
  const now = new Date();
  const dateOptions = { weekday: "long", month: "long", day: "numeric" };
  $("#today-date").textContent = now.toLocaleDateString("en-US", dateOptions);
  $("#page-day").textContent = String(now.getDate()).padStart(2, "0");
  $("#page-month").textContent = now.toLocaleDateString("en-US", { month: "long" }).toUpperCase();
  $("#page-weekday").textContent = now.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();

  // Task list
  const taskList = $("#task-list");
  const taskCount = $("#task-count");
  const taskProgress = $("#task-progress-fill");
  const taskForm = $("#quick-task-form");
  const taskInput = $("#new-task-input");

  function updateTasks() {
    const items = $$(".task-item", taskList);
    const done = items.filter(item => $("input", item).checked).length;
    taskCount.textContent = `${done} of ${items.length} completed`;
    taskProgress.style.width = `${items.length ? done / items.length * 100 : 0}%`;
    items.forEach(item => item.classList.toggle("completed", $("input", item).checked));
  }
  taskList.addEventListener("change", event => {
    if (event.target.matches('input[type="checkbox"]')) updateTasks();
  });
  $("#add-task-button").addEventListener("click", () => {
    taskForm.hidden = !taskForm.hidden;
    if (!taskForm.hidden) taskInput.focus();
  });
  taskForm.addEventListener("submit", event => {
    event.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;
    const li = document.createElement("li");
    li.className = "task-item";
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    const custom = document.createElement("span");
    custom.className = "custom-check";
    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = title;
    label.append(checkbox, custom, text);
    const tag = document.createElement("span");
    tag.className = "task-tag tag-lavender";
    tag.textContent = "New";
    li.append(label, tag);
    taskList.append(li);
    taskInput.value = "";
    taskForm.hidden = true;
    updateTasks();
  });
  updateTasks();

  // Pomodoro timer (runs in the current tab; persistence/backend sync can be added later)
  const display = $("#timer-display");
  const modeLabel = $("#timer-mode");
  const startButton = $("#timer-start");
  const progressCircle = $("#timer-progress");
  const circumference = 2 * Math.PI * 96;
  let duration = 25 * 60;
  let remaining = duration;
  let interval = null;
  let running = false;
  let mode = "Focus";

  function renderTimer() {
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    display.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    modeLabel.textContent = mode.toUpperCase() + (mode === "Focus" ? " SESSION" : "");
    progressCircle.style.strokeDasharray = circumference;
    progressCircle.style.strokeDashoffset = circumference * (1 - remaining / duration);
    startButton.textContent = running ? "Pause" : (remaining === duration ? "Start focus" : "Resume");
  }
  function stopTimer() {
    if (interval) window.clearInterval(interval);
    interval = null;
    running = false;
    renderTimer();
  }
  function tick() {
    if (remaining > 0) {
      remaining -= 1;
      renderTimer();
    } else {
      stopTimer();
      $("#timer-caption").textContent = mode === "Focus" ? "Focus session complete. Take a little break!" : "Break complete. Ready for another round?";
      showToast(mode === "Focus" ? "Focus session complete — well done! ♡" : "Break time is over. You've got this!");
      if (mode === "Focus") addPoints(5);
    }
  }
  startButton.addEventListener("click", () => {
    if (running) { stopTimer(); return; }
    if (remaining <= 0) remaining = duration;
    running = true;
    renderTimer();
    interval = window.setInterval(tick, 1000);
  });
  $("#timer-reset").addEventListener("click", () => {
    stopTimer();
    remaining = duration;
    $("#timer-caption").textContent = "One thing at a time. You've got this!";
    renderTimer();
  });
  $$(".timer-tab").forEach(tab => tab.addEventListener("click", () => {
    stopTimer();
    $$(".timer-tab").forEach(item => item.classList.toggle("active", item === tab));
    mode = tab.dataset.mode;
    duration = Number(tab.dataset.minutes) * 60;
    remaining = duration;
    $("#timer-caption").textContent = mode === "Focus" ? "One thing at a time. You've got this!" : "A little rest helps you grow.";
    renderTimer();
  }));
  renderTimer();

  // Pet interactions — visual feedback for this frontend stage
  const petMessages = {
    Feed: "Mochi enjoyed the snack. Happiness +5 ♡",
    Play: "Mochi had fun playing with you! ✧",
    Nap: "Shhh... Mochi is having a tiny nap. ☾",
    Visit: "Mochi is happy you're spending time together!"
  };
  $$("[data-pet-action]").forEach(button => button.addEventListener("click", () => {
    $("#pet-feedback").textContent = petMessages[button.dataset.petAction];
    showToast(petMessages[button.dataset.petAction]);
  }));

  // Search filters visible dashboard cards
  $("#dashboard-search").addEventListener("input", event => {
    const query = event.target.value.trim().toLocaleLowerCase();
    $$(".dashboard-grid > .dash-card").forEach(card => {
      card.hidden = Boolean(query) && !card.textContent.toLocaleLowerCase().includes(query);
    });
  });

  // Small local points counter for completed focus sessions
  let points = 5;
  function addPoints(value) {
    points += value;
    $("#points-total").textContent = `${points} pts`;
  }

  let toastTimeout;
  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }
})();
