import { CONFIG } from "./config.js";
import { getValueAtPath } from "./util/utilities.js";

export const assets = {};

const assetsQueue = [];

export function preload() {
  assets.player1 = {
    left: loadImage("assets/players/player1/left.png"),
    right: loadImage("assets/players/player1/right.png"),
    up: loadImage("assets/players/player1/up.png"),
    down: loadImage("assets/players/player1/down.png"),
  };
  assets.player2 = {
    left: loadImage("assets/players/player2/left.png"),
    right: loadImage("assets/players/player2/right.png"),
    up: loadImage("assets/players/player2/up.png"),
    down: loadImage("assets/players/player2/down.png"),
  };
  assets.tileMaps = [loadImage("assets/tile_map/1.png"), loadImage("assets/tile_map/2.png")];

  assets.items = {
    crate: [loadImage("assets/items/crystals/1.png"), loadImage("assets/items/crystals/2.png")],
    door: {
      open: loadImage("assets/items/bridge/open.png"),
      closed: loadImage("assets/items/bridge/closed.png"),
    },
    floorSwitch: {
      up: loadImage("assets/items/switch/up.png"),
      down: loadImage("assets/items/switch/down.png"),
    },
    bullet: {
      player1: loadImage("assets/items/bullet/player1.png"),
      player2: loadImage("assets/items/bullet/player2.png"),
    },
    stairs: loadImage("assets/items/stairs/down.png"),
    treasure: loadImage("assets/items/treasure.png"),
  };
}

export function setup() {
  assets.walls = [];
  for (const tileMap of assets.tileMaps) {
    assets.walls.push(sliceTiles(tileMap));
  }
}

export function addToQueue(imageInfo) {
  assetsQueue.push(imageInfo);
}

function sortQueue() {
  // sort images by z position if y is the same
  assetsQueue.sort((a, b) => {
    if (a.y === b.y) {
      const aZ = a.z ?? 0;
      const bZ = b.z ?? 0;
      return aZ - bZ;
    }
    return a.y - b.y;
  });
}

export function drawQueue() {
  sortQueue();
  push();
  imageMode(CENTER);
  for (const imageInfo of assetsQueue) {
    const { path, x, y } = imageInfo;
    const yOffset = imageInfo.yOffset ?? 0;
    const img = getValueAtPath(assets, path, assets.missingImage);
    const imgRatio = img.width / img.height;
    const imgW = CONFIG.grid.width;
    const imgH = CONFIG.grid.width / imgRatio;

    image(
      img,
      x * CONFIG.grid.width + CONFIG.grid.width / 2,
      y * CONFIG.grid.height + imgH / 2 + yOffset,
      imgW,
      imgH
    );
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
