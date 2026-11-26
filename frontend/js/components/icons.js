const ICON_PATHS = {
  dashboard: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  pomodoro: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2h6M12 2v3M18 5l1.5-1.5"/>',
  library: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 3v12"/>',
  notes: '<path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5M8 12h8M8 16h8"/>',
  tracking: '<path d="M3 3v18h18"/><path d="m7 14 4-4 3 2 6-7"/>',
  pet: '<path d="M12 3 14.5 8l5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z"/><path d="M8 21h8"/>',
  tasks: '<path d="m4 6 1.5 1.5L8 5M11 6h9M4 12l1.5 1.5L8 11M11 12h9M4 18l1.5 1.5L8 17M11 18h9"/>',
  settings: '<circle cx="12" cy="12" r="2.6"/><path d="M12 2.5v3m0 13v3m-9.5-9.5h3m13 0h3M4.9 4.9 7 7m10 10 2.1 2.1M4.9 19.1 7 17m10-10 2.1-2.1"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  chevronLeft: '<path d="m14 5-7 7 7 7"/>',
  chevronRight: '<path d="m10 5 7 7-7 7"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  star: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  play: '<path d="m8 5 11 7-11 7z"/>',
  flame: '<path d="M12 22c4.2 0 7-2.8 7-6.7 0-2.5-1.4-4.8-4.1-7.3.2 2.1-.5 3.1-1.4 3.6C13.4 7.7 11 4.6 8 2c.4 4.4-3 7-3 12.2C5 18.5 7.8 22 12 22Z"/>'
};

export function icon(name, className = "") {
  const path = ICON_PATHS[name];
  if (!path) {
    throw new Error(`Unknown MELIO icon: ${name}`);
  }

  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}
