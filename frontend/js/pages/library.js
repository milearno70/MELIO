import { icon } from "../components/icons.js";
import { readStoredData, writeStoredData } from "../core/storage.js";
import { startAppPage } from "../core/page-shell.js";

const STORAGE_KEY = "library-books";
const CATEGORIES = ["Programming", "Textbook", "Fiction", "Other"];
const STATUSES = ["Want to read", "Reading", "Finished"];
const CATEGORY_COLORS = {
  Programming: "#c5e5f4",
  Textbook: "#ded3f4",
  Fiction: "#f7c5d8",
  Other: "#fff0b5"
};
const DEFAULT_BOOKS = [
  {
    id: "clean-code",
    title: "Clean Code",
    author: "Robert C. Martin",
    category: "Programming",
    status: "Reading",
    progress: 45,
    summary: "Practical notes on writing code that is clear, kind to future readers, and easier to maintain."
  },
  {
    id: "database-system-concepts",
    title: "Database System Concepts",
    author: "Silberschatz et al.",
    category: "Textbook",
    status: "Reading",
    progress: 20,
    summary: "A steady reference for data models, SQL, transactions, and the ideas behind database systems."
  },
  {
    id: "little-prince",
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    category: "Fiction",
    status: "Finished",
    progress: 100,
    summary: "A well-loved story about curiosity, friendship, and seeing with the heart."
  },
  {
    id: "calculus-early-transcendentals",
    title: "Calculus: Early Transcendentals",
    author: "James Stewart",
    category: "Textbook",
    status: "Want to read",
    progress: 0,
    summary: "A familiar calculus text waiting for its next study session."
  }
];

function normalizeBooks(value) {
  if (!Array.isArray(value)) return DEFAULT_BOOKS.map((book) => ({ ...book }));
  return value
    .filter((book) => book && typeof book.title === "string" && typeof book.author === "string")
    .map((book) => ({
      id: typeof book.id === "string" ? book.id : `book-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: book.title.slice(0, 100),
      author: book.author.slice(0, 80),
      category: CATEGORIES.includes(book.category) ? book.category : "Other",
      status: STATUSES.includes(book.status) ? book.status : "Want to read",
      progress: Math.max(0, Math.min(100, Math.round(Number(book.progress) || 0))),
      summary: typeof book.summary === "string" ? book.summary.slice(0, 500) : ""
    }));
}

function createButton(label, className, text) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.setAttribute("aria-label", label);
  button.textContent = text;
  return button;
}

function initializeLibrary(root) {
  const page = root.querySelector(".library-page");
  const grid = page.querySelector("[data-book-grid]");
  const search = page.querySelector("[data-book-search]");
  const categoryFilter = page.querySelector("[data-category-filter]");
  const statusFilter = page.querySelector("[data-status-filter]");
  const emptyState = page.querySelector("[data-library-empty]");
  const editorDialog = page.querySelector("[data-editor-dialog]");
  const detailsDialog = page.querySelector("[data-details-dialog]");
  const bookForm = page.querySelector("[data-book-form]");
  const progressInput = bookForm.elements.namedItem("progress");
  const progressOutput = page.querySelector("[data-progress-output]");
  let books = normalizeBooks(readStoredData(STORAGE_KEY, null));
  let editingId = null;
  let detailsId = null;

  function persist() {
    writeStoredData(STORAGE_KEY, books);
  }

  function visibleBooks() {
    const query = search.value.trim().toLocaleLowerCase();
    return books.filter((book) => {
      const matchesQuery = !query || [book.title, book.author, book.category, book.summary]
        .some((value) => value.toLocaleLowerCase().includes(query));
      const matchesCategory = categoryFilter.value === "all" || book.category === categoryFilter.value;
      const matchesStatus = statusFilter.value === "all" || book.status === statusFilter.value;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }

  function renderStats() {
    page.querySelector("[data-book-total]").textContent = String(books.length);
    page.querySelector("[data-book-reading]").textContent = String(books.filter((book) => book.status === "Reading").length);
    page.querySelector("[data-book-finished]").textContent = String(books.filter((book) => book.status === "Finished").length);
  }

  function renderBook(book) {
    const card = document.createElement("article");
    card.className = "book-card";
    card.style.setProperty("--book-cover", CATEGORY_COLORS[book.category] || CATEGORY_COLORS.Other);

    const cover = document.createElement("button");
    cover.type = "button";
    cover.className = "book-card__cover";
    cover.setAttribute("aria-label", `View details for ${book.title}`);
    const category = document.createElement("span");
    category.className = "book-card__category";
    category.textContent = book.category;
    const title = document.createElement("span");
    title.className = "book-card__title";
    title.textContent = book.title;
    const mark = document.createElement("span");
    mark.className = "book-card__mark";
    mark.innerHTML = icon("library");
    mark.setAttribute("aria-hidden", "true");
    const author = document.createElement("span");
    author.className = "book-card__author";
    author.textContent = book.author;
    cover.append(category, title, mark, author);
    cover.addEventListener("click", () => openDetails(book.id));

    const meta = document.createElement("div");
    meta.className = "book-card__meta";
    const status = document.createElement("div");
    status.className = "book-card__status";
    const statusText = document.createElement("span");
    statusText.textContent = book.status;
    const actions = document.createElement("span");
    actions.className = "book-card__actions";
    const edit = createButton(`Edit ${book.title}`, "book-card__action", "✎");
    edit.addEventListener("click", () => openEditor(book));
    const remove = createButton(`Delete ${book.title}`, "book-card__action", "♲");
    remove.addEventListener("click", () => deleteBook(book.id));
    actions.append(edit, remove);
    status.append(statusText, actions);

    const progress = document.createElement("div");
    progress.className = "book-card__progress";
    const track = document.createElement("div");
    track.className = "progress-track";
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-label", `${book.title} reading progress`);
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    track.setAttribute("aria-valuenow", String(book.progress));
    const fill = document.createElement("span");
    fill.style.setProperty("--progress", `${book.progress}%`);
    fill.style.setProperty("--progress-color", "var(--color-primary)");
    track.append(fill);
    const percent = document.createElement("span");
    percent.textContent = `${book.progress}%`;
    progress.append(track, percent);
    meta.append(status, progress);
    card.append(cover, meta);
    return card;
  }

  function render() {
    const results = visibleBooks();
    grid.replaceChildren(...results.map(renderBook));
    emptyState.hidden = results.length > 0;
    renderStats();
  }

  function openEditor(book = null) {
    editingId = book ? book.id : null;
    page.querySelector("[data-editor-title]").textContent = book ? "Edit this book" : "Add a book";
    bookForm.elements.namedItem("title").value = book ? book.title : "";
    bookForm.elements.namedItem("author").value = book ? book.author : "";
    bookForm.elements.namedItem("category").value = book ? book.category : "Programming";
    bookForm.elements.namedItem("status").value = book ? book.status : "Want to read";
    progressInput.value = String(book ? book.progress : 0);
    progressOutput.textContent = `${progressInput.value}%`;
    bookForm.elements.namedItem("summary").value = book ? book.summary : "";
    editorDialog.showModal();
    bookForm.elements.namedItem("title").focus();
  }

  function openDetails(id) {
    const book = books.find((item) => item.id === id);
    if (!book) return;
    detailsId = id;
    page.querySelector("[data-details-category]").textContent = book.category;
    page.querySelector("[data-details-title]").textContent = book.title;
    page.querySelector("[data-details-author]").textContent = book.author;
    page.querySelector("[data-details-status]").textContent = book.status;
    page.querySelector("[data-details-progress]").textContent = `${book.progress}%`;
    page.querySelector("[data-details-summary]").textContent = book.summary || "No notes for this book yet.";
    const bar = page.querySelector("[data-details-progressbar]");
    bar.setAttribute("aria-label", `${book.title} reading progress`);
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", "100");
    bar.setAttribute("aria-valuenow", String(book.progress));
    bar.querySelector("span").style.setProperty("--progress", `${book.progress}%`);
    detailsDialog.showModal();
  }

  function deleteBook(id) {
    const book = books.find((item) => item.id === id);
    if (!book || !window.confirm(`Remove “${book.title}” from your library?`)) return;
    books = books.filter((item) => item.id !== id);
    persist();
    if (detailsDialog.open) detailsDialog.close();
    render();
  }

  page.querySelector("[data-add-book]").addEventListener("click", () => openEditor());
  search.addEventListener("input", render);
  categoryFilter.addEventListener("change", render);
  statusFilter.addEventListener("change", render);
  page.querySelector("[data-clear-filters]").addEventListener("click", () => {
    search.value = "";
    categoryFilter.value = "all";
    statusFilter.value = "all";
    render();
    search.focus();
  });

  progressInput.addEventListener("input", () => {
    progressOutput.textContent = `${progressInput.value}%`;
  });

  bookForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!bookForm.reportValidity()) return;

    const formData = new FormData(bookForm);
    const updatedBook = {
      id: editingId || `book-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: String(formData.get("title")).trim(),
      author: String(formData.get("author")).trim(),
      category: String(formData.get("category")),
      status: String(formData.get("status")),
      progress: Number(formData.get("progress")),
      summary: String(formData.get("summary")).trim()
    };

    if (editingId) {
      books = books.map((book) => book.id === editingId ? updatedBook : book);
    } else {
      books.unshift(updatedBook);
    }
    persist();
    editorDialog.close();
    render();
  });

  page.querySelectorAll("[data-close-editor]").forEach((button) => {
    button.addEventListener("click", () => editorDialog.close());
  });
  page.querySelectorAll("[data-close-details]").forEach((button) => {
    button.addEventListener("click", () => detailsDialog.close());
  });
  page.querySelector("[data-details-edit]").addEventListener("click", () => {
    const book = books.find((item) => item.id === detailsId);
    detailsDialog.close();
    if (book) openEditor(book);
  });
  page.querySelector("[data-details-dialog]").addEventListener("keydown", (event) => {
    if (event.key === "Escape") detailsId = null;
  });

  render();
}

startAppPage({
  templateId: "library-template",
  activePage: "library",
  pageName: "My Library",
  initialize: initializeLibrary
});
