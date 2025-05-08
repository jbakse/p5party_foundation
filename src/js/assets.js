import { CONFIG } from "./config.js";
import { getValueAtPath } from "./util/utilities.js";

export const assets = {};

const assetsQueue = [];

export function preload() {
  assets.player1 = {
    left: {
      base: loadImage("generated/players/player1/left/base.png"),
      light: loadImage("generated/players/player1/left/light.png"),
    },
    right: {
      base: loadImage("generated/players/player1/right/base.png"),
      light: loadImage("generated/players/player1/right/light.png"),
    },
    up: {
      base: loadImage("generated/players/player1/up/base.png"),
      light: loadImage("generated/players/player1/up/light.png"),
    },
    down: {
      base: loadImage("generated/players/player1/down/base.png"),
      light: loadImage("generated/players/player1/down/light.png"),
    },
  };
  assets.player2 = {
    left: {
      base: loadImage("generated/players/player2/left/base.png"),
      light: loadImage("generated/players/player2/left/light.png"),
    },
    right: {
      base: loadImage("generated/players/player2/right/base.png"),
      light: loadImage("generated/players/player2/right/light.png"),
    },
    up: {
      base: loadImage("generated/players/player2/up/base.png"),
      light: loadImage("generated/players/player2/up/light.png"),
    },
    down: {
      base: loadImage("generated/players/player2/down/base.png"),
      light: loadImage("generated/players/player2/down/light.png"),
    },
  };
  assets.tileMaps = [loadImage("generated/tile_map/1.png"), loadImage("generated/tile_map/2.png")];

  assets.items = {
    crate: [
      {
        base: loadImage("generated/items/crystals/1/base.png"),
        light: loadImage("generated/items/crystals/1/light.png"),
      },
      {
        base: loadImage("generated/items/crystals/2/base.png"),
        light: loadImage("generated/items/crystals/2/light.png"),
      },
      {
        base: loadImage("generated/items/crystals/3/base.png"),
        light: loadImage("generated/items/crystals/3/light.png"),
      },
    ],
    door: {
      open: loadImage("generated/items/bridge/open.png"),
      closed: loadImage("generated/items/bridge/closed.png"),
    },
    floorSwitch: {
      up: loadImage("generated/items/switch/up.png"),
      down: loadImage("generated/items/switch/down.png"),
    },
    bullet: {
      player1: loadImage("generated/items/bullet/player1.png"),
      player2: loadImage("generated/items/bullet/player2.png"),
    },
    stairs: {
      up: {
        base: loadImage("generated/items/stairs/up/base.png"),
        light: loadImage("generated/items/stairs/up/light.png"),
      },
      down: loadImage("generated/items/stairs/down.png"),
    },
    treasure: loadImage("generated/items/treasure.png"),
  };

  assets.ground = {
    darkest: [
      loadImage("generated/ground/darkest/1.png"),
      loadImage("generated/ground/darkest/2.png"),
      loadImage("generated/ground/darkest/3.png"),
    ],
    dark: [
      loadImage("generated/ground/dark/1.png"),
      loadImage("generated/ground/dark/2.png"),
      loadImage("generated/ground/dark/3.png"),
    ],
    light: [
      loadImage("generated/ground/light/1.png"),
      loadImage("generated/ground/light/2.png"),
      loadImage("generated/ground/light/3.png"),
      loadImage("generated/ground/light/4.png"),
      loadImage("generated/ground/light/5.png"),
      loadImage("generated/ground/light/6.png"),
      loadImage("generated/ground/light/7.png"),
      loadImage("generated/ground/light/8.png"),
    ],
    lightest: [
      loadImage("generated/ground/lightest/1.png"),
      loadImage("generated/ground/lightest/2.png"),
      loadImage("generated/ground/lightest/3.png"),
    ],
    highlight: [
      loadImage("generated/ground/highlight/1.png"),
      loadImage("generated/ground/highlight/2.png"),
    ],
  };
}

export function setup() {
  CONFIG.numWalls = assets.tileMaps.length;

  assets.walls = [];
  for (const tileMap of assets.tileMaps) {
    assets.walls.push(sliceTiles(tileMap));
  }
}

export function addToQueue(imageInfo) {
  assetsQueue.push(imageInfo);
}

function sortQueue() {
  // sort images by sort, then by y
  assetsQueue.sort((a, b) => {
    if (a.sort !== b.sort) {
      return a.sort - b.sort;
    }
    if (a.y !== b.y) {
      return a.y - b.y;
    }
    return 0;
  });
}

export function drawQueue() {
  sortQueue();
  push();
  imageMode(CENTER);
  for (const imageInfo of assetsQueue) {
    const { path, x, y, yOffset = 0 } = imageInfo;
    const img = getValueAtPath(assets, path, assets.missingImage);
    const imgRatio = img.width / img.height;
    const imgW = CONFIG.grid.width;
    const imgH = CONFIG.grid.width / imgRatio;
    push();

    if (imageInfo.blendMode) blendMode(imageInfo.blendMode);

    image(
      img,
      x * CONFIG.grid.width + CONFIG.grid.width / 2,
      y * CONFIG.grid.height - imgH / 2 + CONFIG.grid.height + yOffset,
      imgW,
      imgH
    );
    pop();
  }
  pop();
  assetsQueue.length = 0; // clear the queue
}

function sliceTiles(tileMap) {
  const imgWidth = tileMap.width / 4;
  const imgHeight = tileMap.height / 4;
  const numTiles = 16;

  const tiles = [];

  for (let i = 0; i < numTiles; i++) {
    const sx = (i % 4) * imgWidth;
    const sy = floor(i / 4) * imgHeight;
    const tile = tileMap.get(sx, sy, imgWidth, imgHeight);
    tiles.push(tile);
  }

  return tiles;
}
