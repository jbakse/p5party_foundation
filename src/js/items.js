import { CONFIG } from "./config.js";
import { shared } from "./host.js";
import { makeId } from "./util/utilities.js";

const itemTemplate = {
  id: "",
  type: "item",
  x: 0,
  y: 0,
  z: 0,
  size: 60,
  shape: "rect",
  color: "magenta",
  alpha: 255,
  mapSymbol: "?",
  hasAsset: false,
  state: null,
  drawAsset: function (assets) {
    push();
    imageMode(CENTER);
    const img = this.state ? assets[this.type][this.state] : assets[this.type];
    const imgRatio = img.width / img.height;
    const isVertical = img.width < img.height;
    const imgW = isVertical ? CONFIG.grid.size * imgRatio : CONFIG.grid.size;
    const imgH = isVertical ? CONFIG.grid.size : CONFIG.grid.size / imgRatio;
    image(
      img,
      this.x * CONFIG.grid.size + CONFIG.grid.size / 2,
      this.y * CONFIG.grid.size + CONFIG.grid.size / 2,
      imgW,
      imgH
    );
    pop();
  },
  draw: function () {
    push();
    ellipseMode(CENTER);
    rectMode(CENTER);
    const itemColor = color(this.color);
    itemColor.setAlpha(this.alpha);
    fill(itemColor);

    const shapeFunction = this.shape === "rect" ? rect : ellipse;
    shapeFunction(
      this.x * CONFIG.grid.size + CONFIG.grid.size / 2,
      this.y * CONFIG.grid.size + CONFIG.grid.size / 2,
      this.size
    );
    pop();
  },
};

const crateTemplate = {
  type: "crate",
  hits: 0,
  alpha: 255,
  z: 2,
  mapSymbol: "▢",
  hasAsset: true,
  blocksPush: function () {
    return true;
  },
};

const waterTemplate = {
  type: "water",
  hits: 0,
  size: 56,
  shape: "rect",
  color: "#006",
  alpha: 255,
  z: 1,
  mapSymbol: "≈",
  blocksMove: function () {
    return true;
  },
  blocksPush: function () {
    return true;
  },
};

const treasureTemplate = {
  type: "treasure",
  size: 16,
  shape: "ellipse",
  color: "yellow",
  z: -1,
  mapSymbol: "$",
  blocksPush: function () {
    return true;
  },
};

const doorTemplate = {
  type: "door",
  open: false,
  group: "",
  hasAsset: true,
  mapSymbol: function () {
    return this.group.toUpperCase();
  },
  blocksMove: function () {
    return !this.open;
  },
  blocksPush: function () {
    return !this.open;
  },
  drawAsset: function (assets) {
    if (this.open) return;
    itemTemplate.drawAsset.call(this, assets);
  },
};

const floorSwitchTemplate = {
  type: "floorSwitch",
  group: "",
  state: "up",
  hasAsset: true,
  mapSymbol: function () {
    return this.group;
  },
};

const stairsTemplate = {
  type: "stairs",
  size: 48,
  mapSymbol: "↑",
};

const bulletTemplate = {
  type: "bullet",
  size: 16,
  color: "gray",
  mapSymbol: false,
  z: 2,
};

const templates = {
  crate: crateTemplate,
  treasure: treasureTemplate,
  door: doorTemplate,
  floorSwitch: floorSwitchTemplate,
  bullet: bulletTemplate,
  stairs: stairsTemplate,
  water: waterTemplate,
};

export function typeForSymbol(symbol) {
  for (const [type, template] of Object.entries(templates)) {
    if (template.mapSymbol === symbol) return type;
  }
  return false;
}

export function createItem(type, x, y, options = {}) {
  const item = {
    id: makeId(),
    type,
    x,
    y,
    ...options,
  };

  return item;
}

export function expand(item) {
  return { ...itemTemplate, ...templates[item.type], ...item };
}
export function blocksMove(item) {
  item = { ...itemTemplate, ...templates[item.type], ...item };
  // Object.setPrototypeOf(item, templates[item.type]);
  return item.blocksMove?.() ?? false;
}

export function blocksPush(item) {
  item = { ...itemTemplate, ...templates[item.type], ...item };
  return item.blocksPush?.() ?? false;
}

export function drawItem(item, assets) {
  item = { ...itemTemplate, ...templates[item.type], ...item };
  if (item.hasAsset) {
    item.drawAsset(assets);
  } else {
    item.draw();
  }
}

export function itemsOfType(type) {
  return shared.items.filter((g) => g.type === type);
}

export function drawItems(items, assets) {
  push();

  // sort items by z. undefined zs default to 0
  // sort on copy of array to avoid mutating shared object
  const sortedItems = [...items].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
  for (const item of sortedItems) {
    // don't draw items flagged to remove
    if (item.remove) continue;
    drawItem(item, assets);
  }
  pop();
}
