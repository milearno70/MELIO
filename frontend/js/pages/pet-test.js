import { DEFAULT_PET_LOOK, mountPetAvatar, PET_HAIR_COLORS } from "../components/pet-avatar.js";

const skins = [1, 2, 3, 4];
const clothes = [1, 2, 3, 4, 5];
const faces = [1, 2, 3, 4];
const hairStyles = [1, 2, 3, 4, 5];
const avatar = mountPetAvatar(document.querySelector(".pet"), DEFAULT_PET_LOOK);

function addButton(rowId, label, active, onClick, color) {
  const button = document.createElement("button");
  if (color) {
    button.className = "swatch";
    button.style.background = color;
    button.title = label;
    button.setAttribute("aria-label", label);
  } else {
    button.textContent = label;
  }
  button.setAttribute("aria-pressed", String(active));
  if (active) button.classList.add("active");
  button.addEventListener("click", onClick);
  document.getElementById(rowId).appendChild(button);
}

function renderButtons() {
  ["skin-row", "clothes-row", "face-row", "hair-style-row", "hair-color-row"]
    .forEach((id) => {
      document.getElementById(id).innerHTML = "";
    });

  skins.forEach((value) => addButton("skin-row", `Skin ${value}`, avatar.getLook().skin === value, () => {
    avatar.update({ skin: value });
    render();
  }));
  clothes.forEach((value) => addButton("clothes-row", `Outfit ${value}`, avatar.getLook().clothes === value, () => {
    avatar.update({ clothes: value });
    render();
  }));
  faces.forEach((value) => addButton("face-row", `Face ${value}`, avatar.getLook().face === value, () => {
    avatar.update({ face: value });
    render();
  }));
  hairStyles.forEach((value) => addButton("hair-style-row", `Style ${value}`, avatar.getLook().hairStyle === value, () => {
    avatar.update({ hairStyle: value });
    render();
  }));
  PET_HAIR_COLORS.forEach((color) => addButton("hair-color-row", color.name, avatar.getLook().hairColor === color.name,
    () => {
      avatar.update({ hairColor: color.name });
      render();
    }, color.hex));
}

function render() {
  const look = avatar.getLook();
  document.getElementById("color-group").hidden = !look.hairStyle;
  document.getElementById("info").textContent =
    `Skin ${look.skin} · Outfit ${look.clothes} · Face ${look.face} · Hair ${look.hairStyle ?? "-"} / ${look.hairColor ?? "-"}`;
  renderButtons();
}

render();
