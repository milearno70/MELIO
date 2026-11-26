import { readStoredData, writeStoredData } from "../core/storage.js";
import { startAppPage } from "../core/page-shell.js";

const STORAGE_KEY = "study-notes";
const SUBJECTS = ["Database Systems", "Calculus", "English", "Computer Science", "Other"];
const DEFAULT_NOTES = [
  {
    id: "sql-join-cheat-sheet",
    title: "SQL JOIN cheat sheet",
    subject: "Database Systems",
    content: [
      "INNER JOIN → only matching rows",
      "LEFT JOIN → all left rows + matches",
      "RIGHT JOIN → all right rows + matches",
      "FULL OUTER → everything",
      "",
      "Remember: filter in ON vs WHERE changes results for outer joins!"
    ].join("\n"),
    tags: ["sql", "exam"],
    pinned: true,
    updatedAt: Date.now() - 3000
  },
  {
    id: "limits-key-ideas",
    title: "Limits — key ideas",
    subject: "Calculus",
    content: "lim x→a f(x) = L means f gets arbitrarily close to L.\nSqueeze theorem for sin(x)/x → 1.",
    tags: ["calculus"],
    pinned: false,
    updatedAt: Date.now() - 2000
  },
  {
    id: "essay-brainstorm",
    title: "Essay brainstorm",
    subject: "English",
    content: "Remote learning: flexibility vs. isolation.\nInterview two classmates?",
    tags: ["ideas"],
    pinned: false,
    updatedAt: Date.now() - 1000
  }
];

function normalizeNotes(value) {
  if (!Array.isArray(value)) return DEFAULT_NOTES.map((note) => ({ ...note, tags: [...note.tags] }));
  return value
    .filter((note) => note && typeof note.title === "string")
    .map((note) => ({
      id: typeof note.id === "string" ? note.id : `note-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: note.title.slice(0, 100),
      subject: SUBJECTS.includes(note.subject) ? note.subject : "Other",
      content: typeof note.content === "string" ? note.content.slice(0, 10000) : "",
      tags: Array.isArray(note.tags)
        ? [...new Set(note.tags.filter((tag) => typeof tag === "string").map((tag) => tag.trim().replace(/^#+/, "").slice(0, 24)).filter(Boolean))].slice(0, 12)
        : [],
      pinned: Boolean(note.pinned),
      updatedAt: Number.isFinite(Number(note.updatedAt)) ? Number(note.updatedAt) : Date.now()
    }));
}

function initializeNotes(root) {
  const page = root.querySelector(".notes-page");
  const list = page.querySelector("[data-note-list]");
  const editor = page.querySelector("[data-note-editor]");
  const emptyState = page.querySelector("[data-note-empty]");
  const search = page.querySelector("[data-notes-search]");
  const subjectFilter = page.querySelector("[data-notes-subject-filter]");
  const titleInput = page.querySelector("[data-note-title]");
  const subjectInput = page.querySelector("[data-note-subject]");
  const contentInput = page.querySelector("[data-note-content]");
  const status = page.querySelector("[data-save-status]");
  const tagList = page.querySelector("[data-note-tags]");
  const tagInput = page.querySelector("[data-new-tag]");
  let notes = normalizeNotes(readStoredData(STORAGE_KEY, null));
  let selectedId = notes.find((note) => note.pinned)?.id || notes[0]?.id || null;

  function getSelectedNote() {
    return notes.find((note) => note.id === selectedId) || null;
  }

  function getVisibleNotes() {
    const query = search.value.trim().toLocaleLowerCase();
    return notes
      .filter((note) => {
        const searchableText = [note.title, note.subject, note.content, ...note.tags].join(" ").toLocaleLowerCase();
        const matchesSearch = !query || searchableText.includes(query);
        const matchesSubject = subjectFilter.value === "all" || note.subject === subjectFilter.value;
        return matchesSearch && matchesSubject;
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
  }

  function renderList() {
    const visibleNotes = getVisibleNotes();
    const items = visibleNotes.map((note) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "note-list-item";
      item.setAttribute("aria-current", note.id === selectedId ? "page" : "false");

      const heading = document.createElement("span");
      heading.className = "note-list-item__heading";
      const noteTitle = document.createElement("span");
      noteTitle.className = "note-list-item__title";
      noteTitle.textContent = note.title || "Untitled note";
      heading.append(noteTitle);
      if (note.pinned) {
        const pin = document.createElement("span");
        pin.className = "note-list-item__pin";
        pin.textContent = "★";
        pin.setAttribute("aria-label", "Pinned");
        heading.append(pin);
      }

      const preview = document.createElement("span");
      preview.className = "note-list-item__preview";
      preview.textContent = note.content || note.subject;

      const footer = document.createElement("span");
      footer.className = "note-list-item__footer";
      const subject = document.createElement("span");
      subject.textContent = note.subject;
      footer.append(subject);
      note.tags.slice(0, 2).forEach((tag) => {
        const tagLabel = document.createElement("span");
        tagLabel.className = "note-list-item__tag";
        tagLabel.textContent = `#${tag}`;
        footer.append(tagLabel);
      });

      item.append(heading, preview, footer);
      item.addEventListener("click", () => {
        selectedId = note.id;
        render();
      });
      return item;
    });

    list.replaceChildren(...items);
    page.querySelector("[data-notes-count]").textContent = `${notes.length} ${notes.length === 1 ? "page" : "pages"}`;
    page.querySelector("[data-notes-list-empty]").hidden = visibleNotes.length > 0;
  }

  function renderTags(note) {
    const tags = note.tags.map((tag) => {
      const chip = document.createElement("span");
      chip.className = "note-tag";
      const label = document.createElement("span");
      label.textContent = `#${tag}`;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "note-tag__remove";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Remove tag ${tag}`);
      remove.addEventListener("click", () => {
        note.tags = note.tags.filter((item) => item !== tag);
        saveNote(note);
        renderTags(note);
      });
      chip.append(label, remove);
      return chip;
    });
    tagList.replaceChildren(...tags);
  }

  function updatePinButton(note) {
    const pinButton = page.querySelector("[data-toggle-pin]");
    pinButton.setAttribute("aria-pressed", String(note.pinned));
    pinButton.setAttribute("aria-label", note.pinned ? "Unpin note" : "Pin note");
    pinButton.querySelector("[data-pin-label]").textContent = note.pinned ? "Pinned" : "Pin note";
    pinButton.firstElementChild.textContent = note.pinned ? "★" : "☆";
  }

  function renderEditor() {
    const note = getSelectedNote();
    editor.hidden = !note;
    emptyState.hidden = Boolean(note);
    if (!note) return;

    titleInput.value = note.title;
    subjectInput.value = note.subject;
    contentInput.value = note.content;
    status.textContent = "Saved in this browser";
    status.dataset.state = "saved";
    updatePinButton(note);
    renderTags(note);
  }

  function render() {
    renderList();
    renderEditor();
  }

  function saveNote(note) {
    note.updatedAt = Date.now();
    status.textContent = "Saving…";
    status.dataset.state = "saving";
    const saved = writeStoredData(STORAGE_KEY, notes);
    status.textContent = saved ? "Saved in this browser" : "Could not save this note";
    status.dataset.state = saved ? "saved" : "error";
    renderList();
  }

  function createNote() {
    const note = {
      id: `note-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: "Untitled note",
      subject: "Other",
      content: "",
      tags: [],
      pinned: false,
      updatedAt: Date.now()
    };
    notes.unshift(note);
    selectedId = note.id;
    saveNote(note);
    renderEditor();
    titleInput.focus();
    titleInput.select();
  }

  function deleteSelectedNote() {
    const note = getSelectedNote();
    if (!note || !window.confirm(`Delete “${note.title || "Untitled note"}” from your notebook?`)) return;
    notes = notes.filter((item) => item.id !== note.id);
    selectedId = notes.find((item) => item.pinned)?.id || notes[0]?.id || null;
    const saved = writeStoredData(STORAGE_KEY, notes);
    status.dataset.state = saved ? "saved" : "error";
    render();
  }

  function addTag(value) {
    const note = getSelectedNote();
    const tag = value.trim().replace(/^#+/, "").slice(0, 24);
    if (!note || !tag || note.tags.some((item) => item.toLocaleLowerCase() === tag.toLocaleLowerCase())) return;
    if (note.tags.length >= 12) {
      status.textContent = "A note can have up to 12 tags";
      status.dataset.state = "error";
      return;
    }
    note.tags.push(tag);
    saveNote(note);
    renderTags(note);
  }

  search.addEventListener("input", render);
  subjectFilter.addEventListener("change", render);
  page.querySelector("[data-new-note]").addEventListener("click", createNote);
  page.querySelector("[data-empty-new-note]").addEventListener("click", createNote);

  titleInput.addEventListener("input", () => {
    const note = getSelectedNote();
    if (!note) return;
    note.title = titleInput.value.slice(0, 100);
    saveNote(note);
  });
  subjectInput.addEventListener("change", () => {
    const note = getSelectedNote();
    if (!note) return;
    note.subject = subjectInput.value;
    saveNote(note);
  });
  contentInput.addEventListener("input", () => {
    const note = getSelectedNote();
    if (!note) return;
    note.content = contentInput.value.slice(0, 10000);
    saveNote(note);
  });

  page.querySelector("[data-toggle-pin]").addEventListener("click", () => {
    const note = getSelectedNote();
    if (!note) return;
    note.pinned = !note.pinned;
    saveNote(note);
    updatePinButton(note);
  });

  page.querySelector("[data-delete-note]").addEventListener("click", deleteSelectedNote);
  page.querySelector("[data-add-tag-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    addTag(tagInput.value);
    tagInput.value = "";
    tagInput.focus();
  });

  render();
}

startAppPage({
  templateId: "notes-template",
  activePage: "notes",
  pageName: "Notes",
  initialize: initializeNotes
});
