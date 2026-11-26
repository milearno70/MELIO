const BASE_PATH = "assets/images/pet/girl";
const SKINS = [1, 2, 3, 4];
const OUTFITS = [1, 2, 3, 4, 5];
const EXPRESSIONS = [1, 2, 3, 4];
const HAIR_STYLES = [1, 2, 3, 4, 5];

export const PET_HAIR_COLORS = [
  { name: "black", hex: "#2f2a33" },
  { name: "blue", hex: "#6aa7e0" },
  { name: "brown", hex: "#5b4036" },
  { name: "orange", hex: "#e8924a" },
  { name: "purple", hex: "#9c7bd1" },
  { name: "red", hex: "#c94a4a" },
  { name: "white", hex: "#f3f0f0" },
  { name: "yellow", hex: "#f0d36b" }
];

export const DEFAULT_PET_LOOK = {
  skin: 1,
  clothes: 1,
  face: 1,
  hairStyle: 2,
  hairColor: "brown"
};

function normalizeLook(value) {
  const look = { ...DEFAULT_PET_LOOK, ...(value && typeof value === "object" ? value : {}) };
  look.skin = SKINS.includes(Number(look.skin)) ? Number(look.skin) : DEFAULT_PET_LOOK.skin;
  look.clothes = OUTFITS.includes(Number(look.clothes)) ? Number(look.clothes) : DEFAULT_PET_LOOK.clothes;
  look.face = EXPRESSIONS.includes(Number(look.face)) ? Number(look.face) : DEFAULT_PET_LOOK.face;
  look.hairStyle = HAIR_STYLES.includes(Number(look.hairStyle)) ? Number(look.hairStyle) : null;
  look.hairColor = PET_HAIR_COLORS.some((color) => color.name === look.hairColor) ? look.hairColor : null;
  if (look.hairStyle && !look.hairColor) look.hairColor = "brown";
  if (!look.hairStyle) look.hairColor = null;
  return look;
}

export function mountPetAvatar(container, initialLook = DEFAULT_PET_LOOK) {
  if (!(container instanceof HTMLElement)) {
    throw new TypeError("MELIO pet avatar requires an HTML container.");
  }

  const layers = Object.fromEntries(["body", "clothes", "face", "hair"].map((part) => {
    const image = document.createElement("img");
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    container.append(image);
    return [part, image];
  }));
  let look = normalizeLook(initialLook);

  function setLayer(image, source) {
    image.style.visibility = "visible";
    image.onerror = () => {
      image.style.visibility = "hidden";
      console.warn(`MELIO could not load a Mochi appearance asset: ${source}`);
    };
    image.src = source;
  }

  function render() {
    setLayer(layers.body, `${BASE_PATH}/body/body-skin-${look.skin}.png`);
    setLayer(layers.clothes, `${BASE_PATH}/clothes/clothes-${look.clothes}.png`);
    setLayer(layers.face, `${BASE_PATH}/face/face-${look.face}.png`);

    if (look.hairStyle && look.hairColor) {
      setLayer(layers.hair, `${BASE_PATH}/hair/hair-${look.hairColor}-${look.hairStyle}.png`);
    } else {
      layers.hair.removeAttribute("src");
      layers.hair.style.visibility = "hidden";
    }
    container.setAttribute("aria-label", `Mochi, skin ${look.skin}, outfit ${look.clothes}`);
  }

  render();
  return {
    getLook() {
      return { ...look };
    },
    update(changes) {
      look = normalizeLook({ ...look, ...changes });
      render();
      return { ...look };
    }
  };
}
