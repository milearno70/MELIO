import { readStoredData, writeStoredData } from "../core/storage.js";
import { startAppPage } from "../core/page-shell.js";

const STORAGE_KEY = "planner-tasks";
const CATEGORIES = ["Programming", "Mathematics", "English", "Database Systems", "Computer Networks", "Personal", "Other"];
const PRIORITIES = ["low", "medium", "high"];

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

const DEFAULT_TASKS = [
  {
    id: "review-sql-joins",
    title: "Review SQL joins",
    description: "Make a quick recap sheet before the quiz.",
    category: "Database Systems",
    priority: "high",
    dueDate: dateOffset(0),
    completed: false
  },
  {
    id: "pomodoro-practice",
    title: "Complete two focus sessions",
    description: "Take a short break between each one.",
    category: "Programming",
    priority: "medium",
    dueDate: dateOffset(0),
    completed: false
  },
  {
    id: "read-chapter-four",
    title: "Read chapter 4",
    description: "Write down three questions for class.",
    category: "English",
    priority: "medium",
    dueDate: dateOffset(2),
    completed: false
  },
  {
    id: "organize-notes",
    title: "Organize last week’s notes",
    description: "",
    category: "Personal",
    priority: "low",
    dueDate: "",
    completed: true
  }
];

function normalizeTasks(value) {
  if (!Array.isArray(value)) return DEFAULT_TASKS.map((task) => ({ ...task }));
  return value
    .filter((task) => task && typeof task.title === "string")
    .map((task) => ({
      id: typeof task.id === "string" ? task.id : `task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: task.title.slice(0, 120),
      description: typeof task.description === "string" ? task.description.slice(0, 500) : "",
      category: CATEGORIES.includes(task.category) ? task.category : "Other",
      priority: PRIORITIES.includes(task.priority) ? task.priority : "medium",
      dueDate: typeof task.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate) ? task.dueDate : "",
      completed: Boolean(task.completed),
      createdAt: Number.isFinite(Number(task.createdAt)) ? Number(task.createdAt) : Date.now()
    }));
}

function createAction(label, className, text) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.setAttribute("aria-label", label);
  button.textContent = text;
  return button;
}

function initializeTasks(root) {
  const page = root.querySelector(".tasks-page");
  const groupsContainer = page.querySelector("[data-task-groups]");
  const emptyState = page.querySelector("[data-tasks-empty]");
  const search = page.querySelector("[data-task-search]");
  const categoryFilter = page.querySelector("[data-category-filter]");
  const statusFilter = page.querySelector("[data-status-filter]");
  const priorityFilter = page.querySelector("[data-priority-filter]");
  const dialog = page.querySelector("[data-task-dialog]");
  const form = page.querySelector("[data-task-form]");
  let tasks = normalizeTasks(readStoredData(STORAGE_KEY, null));
  let editingId = null;

  function persist() {
    return writeStoredData(STORAGE_KEY, tasks);
  }

  function getVisibleTasks() {
    const query = search.value.trim().toLocaleLowerCase();
    const today = localDateKey();
    return tasks.filter((task) => {
      const searchableText = [task.title, task.description, task.category, task.priority].join(" ").toLocaleLowerCase();
      const matchesSearch = !query || searchableText.includes(query);
      const matchesCategory = categoryFilter.value === "all" || task.category === categoryFilter.value;
      const matchesPriority = priorityFilter.value === "all" || task.priority === priorityFilter.value;
      let matchesStatus = true;
      if (statusFilter.value === "todo") matchesStatus = !task.completed;
      if (statusFilter.value === "completed") matchesStatus = task.completed;
      if (statusFilter.value === "today") matchesStatus = !task.completed && task.dueDate === today;
      if (statusFilter.value === "upcoming") matchesStatus = !task.completed && task.dueDate > today;
      return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
    });
  }

  function taskGroup(task) {
    if (task.completed) return "Completed";
    const today = localDateKey();
    if (task.dueDate && task.dueDate < today) return "Past due";
    if (task.dueDate === today) return "Due today";
    if (task.dueDate > today) return "Coming up";
    return "No deadline";
  }

  function formatDueDate(task) {
    if (!task.dueDate) return "No due date";
    if (task.dueDate === localDateKey()) return "Today";
    const [year, month, day] = task.dueDate.split("-").map(Number);
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" })
      .format(new Date(year, month - 1, day));
  }

  function renderTask(task) {
    const item = document.createElement("li");
    item.className = "task-item";
    item.dataset.completed = String(task.completed);

    const checkbox = document.createElement("input");
    checkbox.className = "task-item__check";
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Mark ${task.title} ${task.completed ? "incomplete" : "complete"}`);
    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      persist();
      render();
    });

    const main = document.createElement("div");
    main.className = "task-item__main";
    const title = document.createElement("h3");
    title.className = "task-item__title";
    title.textContent = task.title;
    main.append(title);
    if (task.description) {
      const description = document.createElement("p");
      description.className = "task-item__description";
      description.textContent = task.description;
      main.append(description);
    }

    const meta = document.createElement("div");
    meta.className = "task-item__meta";
    const category = document.createElement("span");
    category.className = "task-item__category";
    category.textContent = task.category;
    const priority = document.createElement("span");
    priority.className = "task-item__priority";
    priority.dataset.priority = task.priority;
    priority.textContent = `${task.priority[0].toUpperCase()}${task.priority.slice(1)} priority`;
    const due = document.createElement("time");
    due.className = "task-item__due";
    due.textContent = formatDueDate(task);
    if (task.dueDate) due.dateTime = task.dueDate;
    const overdue = !task.completed && task.dueDate && task.dueDate < localDateKey();
    due.dataset.overdue = String(Boolean(overdue));
    meta.append(category, priority, due);
    main.append(meta);

    const actions = document.createElement("div");
    actions.className = "task-item__actions";
    const edit = createAction(`Edit ${task.title}`, "task-item__action", "✎");
    edit.addEventListener("click", () => openEditor(task));
    const remove = createAction(`Delete ${task.title}`, "task-item__action task-item__action--delete", "×");
    remove.addEventListener("click", () => deleteTask(task.id));
    actions.append(edit, remove);
    item.append(checkbox, main, actions);
    return item;
  }

  function render() {
    const visibleTasks = getVisibleTasks();
    const groups = new Map([
      ["Past due", []],
      ["Due today", []],
      ["Coming up", []],
      ["No deadline", []],
      ["Completed", []]
    ]);
    visibleTasks.forEach((task) => groups.get(taskGroup(task)).push(task));

    const sections = [];
    for (const [label, groupTasks] of groups) {
      if (groupTasks.length === 0) continue;
      groupTasks.sort((a, b) => {
        if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority] || a.createdAt - b.createdAt;
      });
      const section = document.createElement("section");
      section.className = "task-group";
      section.setAttribute("aria-label", `${label} tasks`);
      const heading = document.createElement("h2");
      heading.className = "task-group__heading";
      heading.textContent = label;
      const count = document.createElement("span");
      count.className = "task-group__count";
      count.textContent = String(groupTasks.length);
      heading.append(count);
      const list = document.createElement("ul");
      list.className = "task-list";
      list.append(...groupTasks.map(renderTask));
      section.append(heading, list);
      sections.push(section);
    }
    groupsContainer.replaceChildren(...sections);
    emptyState.hidden = visibleTasks.length > 0;

    const today = localDateKey();
    page.querySelector("[data-open-count]").textContent = String(tasks.filter((task) => !task.completed).length);
    page.querySelector("[data-complete-count]").textContent = String(tasks.filter((task) => task.completed).length);
    page.querySelector("[data-overdue-count]").textContent = String(
      tasks.filter((task) => !task.completed && task.dueDate && task.dueDate < today).length
    );
    renderCategoryChips();
  }

  function renderCategoryChips() {
    const activeCategory = categoryFilter.value;
    const chips = CATEGORIES.slice(0, 5).map((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "task-category-chip";
      button.dataset.category = category;
      button.textContent = category;
      button.setAttribute("aria-pressed", String(activeCategory === category));
      button.addEventListener("click", () => {
        categoryFilter.value = activeCategory === category ? "all" : category;
        render();
      });
      return button;
    });
    page.querySelector("[data-category-chips]").replaceChildren(...chips);
  }

  function openEditor(task = null) {
    editingId = task ? task.id : null;
    page.querySelector("[data-task-dialog-title]").textContent = task ? "Edit task" : "New task";
    form.elements.namedItem("title").value = task ? task.title : "";
    form.elements.namedItem("description").value = task ? task.description : "";
    form.elements.namedItem("category").value = task ? task.category : "Programming";
    form.elements.namedItem("priority").value = task ? task.priority : "medium";
    form.elements.namedItem("dueDate").value = task ? task.dueDate : "";
    dialog.showModal();
    form.elements.namedItem("title").focus();
  }

  function deleteTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task || !window.confirm(`Delete “${task.title}” from your planner?`)) return;
    tasks = tasks.filter((item) => item.id !== id);
    persist();
    render();
  }

  page.querySelector("[data-new-task]").addEventListener("click", () => openEditor());
  search.addEventListener("input", render);
  categoryFilter.addEventListener("change", render);
  statusFilter.addEventListener("change", render);
  priorityFilter.addEventListener("change", render);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    const nextTask = {
      id: editingId || `task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: String(formData.get("title")).trim(),
      description: String(formData.get("description")).trim(),
      category: String(formData.get("category")),
      priority: String(formData.get("priority")),
      dueDate: String(formData.get("dueDate")),
      completed: editingId ? Boolean(tasks.find((task) => task.id === editingId)?.completed) : false,
      createdAt: editingId ? tasks.find((task) => task.id === editingId)?.createdAt || Date.now() : Date.now()
    };
    if (editingId) {
      tasks = tasks.map((task) => task.id === editingId ? nextTask : task);
    } else {
      tasks.unshift(nextTask);
    }
    persist();
    dialog.close();
    render();
  });

  page.querySelectorAll("[data-close-task]").forEach((button) => {
    button.addEventListener("click", () => dialog.close());
  });

  render();
}

startAppPage({
  templateId: "tasks-template",
  activePage: "tasks",
  pageName: "Tasks",
  initialize: initializeTasks
});
