import { icon } from "../components/icons.js";
import { ApiError, apiRequest, clearAuthToken } from "../api.js";

export async function initializeDashboard(root, currentUser) {
  const greeting = root.querySelector("#dashboard-title");
  greeting.textContent = `Haii, ${currentUser.name}!`;

  root.querySelectorAll("[data-dashboard-icon]").forEach((element) => {
    element.innerHTML = icon(element.dataset.dashboardIcon);
  });

  const mobileCloseLinks = root.querySelectorAll(".sidebar__link");
  mobileCloseLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 680px)").matches) {
        root.dispatchEvent(new CustomEvent("melio:close-navigation"));
      }
    });
  });

  const taskForm = root.querySelector("[data-task-form]");
  const taskList = root.querySelector("[data-task-list]");
  const loadingMessage = root.querySelector("[data-task-loading]");
  const emptyMessage = root.querySelector("[data-task-empty]");
  const errorMessage = root.querySelector("[data-task-error]");
  const errorText = root.querySelector("[data-task-error-message]");
  const retryButton = root.querySelector("[data-task-retry]");
  const taskProgress = root.querySelector("[data-task-progress]");
  const submitButton = taskForm.querySelector("[type='submit']");
  let tasks = [];

  function renderTasks() {
    taskList.replaceChildren();
    emptyMessage.hidden = tasks.length > 0;
    taskProgress.textContent = `${tasks.filter((task) => task.isCompleted).length}/${tasks.length}`;

    for (const task of tasks) {
      const row = document.createElement("li");
      row.className = "task-row";
      row.dataset.completed = String(task.isCompleted);

      const completeButton = document.createElement("button");
      completeButton.className = "task-row__check";
      completeButton.type = "button";
      completeButton.textContent = task.isCompleted ? "✓" : "";
      completeButton.setAttribute("aria-label", `${task.isCompleted ? "Mark" : "Complete"} ${task.title}`);
      completeButton.setAttribute("aria-pressed", String(task.isCompleted));
      completeButton.addEventListener("click", () => updateTask(task, completeButton));

      const title = document.createElement("span");
      title.className = "task-row__title";
      title.textContent = task.title;

      const category = document.createElement("span");
      category.className = "tag";
      category.textContent = task.category;
      category.dataset.category = task.category;

      const deleteButton = document.createElement("button");
      deleteButton.className = "task-row__delete";
      deleteButton.type = "button";
      deleteButton.textContent = "×";
      deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
      deleteButton.addEventListener("click", () => deleteTask(task, deleteButton));

      row.append(completeButton, title, category, deleteButton);
      taskList.append(row);
    }
  }

  function showError(error, action) {
    console.error(`MELIO could not ${action} dashboard tasks.`, error);
    if (error instanceof ApiError && error.status === 401) {
      clearAuthToken();
      window.location.replace("login.html");
      return;
    }
    errorText.textContent = `Could not ${action} tasks. ${error.message}`;
    errorMessage.hidden = false;
  }

  async function loadTasks() {
    loadingMessage.textContent = "Loading your tasks…";
    loadingMessage.hidden = false;
    errorMessage.hidden = true;
    taskList.setAttribute("aria-busy", "true");
    submitButton.disabled = true;
    try {
      const result = await apiRequest("/api/tasks");
      if (!Array.isArray(result)) throw new Error("The task response was not a list.");
      tasks = result;
      renderTasks();
    } catch (error) {
      showError(error, "load");
    } finally {
      loadingMessage.hidden = true;
      taskList.setAttribute("aria-busy", "false");
      submitButton.disabled = false;
    }
  }

  async function updateTask(task, button) {
    button.disabled = true;
    errorMessage.hidden = true;
    try {
      const updatedTask = await apiRequest(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isCompleted: !task.isCompleted })
      });
      tasks = tasks.map((item) => item.id === updatedTask.id ? updatedTask : item);
      renderTasks();
    } catch (error) {
      showError(error, "update");
      button.disabled = false;
    }
  }

  async function deleteTask(task, button) {
    button.disabled = true;
    errorMessage.hidden = true;
    try {
      await apiRequest(`/api/tasks/${task.id}`, { method: "DELETE" });
      tasks = tasks.filter((item) => item.id !== task.id);
      renderTasks();
    } catch (error) {
      showError(error, "delete");
      button.disabled = false;
    }
  }

  taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!taskForm.reportValidity()) return;

    const formData = new FormData(taskForm);
    const title = String(formData.get("title")).trim();
    if (!title) {
      taskForm.elements.namedItem("title").focus();
      return;
    }

    submitButton.disabled = true;
    errorMessage.hidden = true;
    try {
      const task = await apiRequest("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title,
          category: String(formData.get("category"))
        })
      });
      tasks.unshift(task);
      taskForm.reset();
      renderTasks();
    } catch (error) {
      showError(error, "add");
    } finally {
      submitButton.disabled = false;
    }
  });

  retryButton.addEventListener("click", loadTasks);
  await loadTasks();
}
