import { CONFIG } from "./config.js";
import { shared } from "./host.js";
import { makeId, randomInt } from "./util/utilities.js";
import * as assets from "./assets.js";

/// parent template
// base for specific item type templates

const itemTemplate = {
  id: "", // string — random id generated when item is created
  type: "item", // string — name of item type
  mapSymbol: "?", // string or function — symbol on ascii map
  assetPath: undefined, // string path on assets object to items image "items.crate.2"
  x: 0, // number — x position in grid widths
  y: 0, // number — y position in grid heights
  z: 0, // number — sorting hint for vertically aligned items

  // init - function — called when item is created

  init: function () {
    console.error("init called on itemTemplate, this is not expected");
  },

  // draw - function — called when item is drawn
  draw: function () {
    if (!this.assetPath) {
      console.warn("no assetPath for item", this);
      return;
    }
    assets.addToQueue({
      path: this.assetPath,
      x: this.x,
      y: this.y,
      z: this.z ?? 0,
      yOffset: this.yOffset ?? 0,
    });
  },
};

/// item type templates

const crateTemplate = {
  type: "crate",
  mapSymbol: "▢",
  assetPath: "items.crate.1",
  z: 2,

  alpha: 255,
  hits: 0,

  init: function () {
    this.assetPath = `items.crate.${randomInt(2)}`;
  },

  blocksPush: function () {
    return true;
  },

  //todo: remove
  yOffset: -CONFIG.grid.height,
};

const waterTemplate = {
  type: "water",
  mapSymbol: "≈",
  assetPath: "items.water",
  z: 1,

  hits: 0,

  blocksMove: function () {
    return true;
  },
  blocksPush: function () {
    return true;
  },
};

const treasureTemplate = {
  type: "treasure",
  mapSymbol: "$",
  assetPath: "items.treasure",

  blocksPush: function () {
    return true;
  },
};

const doorTemplate = {
  type: "door",
  mapSymbol: function () {
    return this.group.toUpperCase();
  },

  group: "",
  open: false,

  draw: function () {
    assets.addToQueue({
      path: `items.door.${this.open ? "open" : "closed"}`,
      x: this.x,
      y: this.y,
      z: this.z ?? 0,
      yOffset: this.yOffset ?? 0,
    });
  },
  blocksMove: function () {
    return !this.open;
  },
  blocksPush: function () {
    return !this.open;
  },

  //todo: remove
  yOffset: 0,
};

const floorSwitchTemplate = {
  type: "floorSwitch",
  mapSymbol: function () {
    return this.group;
  },

  group: "",
  state: "up",

  draw: function () {
    assets.addToQueue({
      path: `items.floorSwitch.${this.state}`,
      x: this.x,
      y: this.y,
      z: this.z ?? 0,
      yOffset: this.yOffset ?? 0,
    });
  },
};

const stairsTemplate = {
  type: "stairs",
  mapSymbol: "↑",
  assetPath: "items.stairs",
};

const bulletTemplate = {
  type: "bullet",
  mapSymbol: false,

  z: 2,
  player: "player1",

  draw: function () {
    assets.addToQueue({
      path: `items.bullet.${this.player}`,
      x: this.x,
      y: this.y,
      z: this.z ?? 0,
      yOffset: this.yOffset ?? 0,
    });
  },
};

/// template registry
const templates = {
  crate: crateTemplate,
  treasure: treasureTemplate,
  door: doorTemplate,
  floorSwitch: floorSwitchTemplate,
  bullet: bulletTemplate,
  stairs: stairsTemplate,
  water: waterTemplate,
};

/// item dispatchable functions

export function blocksMove(item) {
  item = { ...itemTemplate, ...templates[item.type], ...item };
  return item.blocksMove?.() ?? false;
}

export function blocksPush(item) {
  item = { ...itemTemplate, ...templates[item.type], ...item };
  return item.blocksPush?.() ?? false;
}

///item utitlity functions

export function createItem(type, x, y, options = {}) {
  const item = {
    id: makeId(),
    type,
    x,
    y,
    ...options,
  };

  templates[type]?.init?.call(item);

  return item;
}

export function expand(item) {
  return { ...itemTemplate, ...templates[item.type], ...item };
}

/// item collection functions

export function itemsOfType(type) {
  return shared.items.filter((g) => g.type === type);
}

export function drawItems(items) {
  push();

  for (const item of items) {
    // don't draw items flagged to remove
    if (item.remove) continue;
    const resolvedItem = { ...itemTemplate, ...templates[item.type], ...item };
    resolvedItem.draw?.();
  }
  pop();
}

/// item type functions
// typeForMapSymbol — returns the type name for the given map symbol
export function typeForMapSymbol(symbol) {
  for (const [type, template] of Object.entries(templates)) {
    if (template.mapSymbol === symbol) return type;
  }
  return false;
}
