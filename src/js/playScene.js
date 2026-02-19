import { CONFIG } from "./config.js";
import { Camera } from "./util/camera.js";
import { RoleKeeper } from "./util/RoleKeeper.js";
import { iterate2D } from "./util/utilities.js";
import { changeScene, scenes } from "./main.js";

import * as assets from "./assets.js";
import * as input from "./input.js";
import * as items from "./items.js";

export let roleKeeper;
let shared;
const camera = new Camera();
let groundCanvas;
let imgScale = 1;

export function preload() {
  shared = partyLoadShared("shared");
  roleKeeper = new RoleKeeper(["player1", "player2"], "unassigned");
  roleKeeper.setAutoAssign(false);
}

export function setup() {
  groundCanvas = createGraphics(
    CONFIG.grid.cols * CONFIG.grid.width,
    CONFIG.grid.rows * CONFIG.grid.height
  );

  imgScale = CONFIG.grid.width / assets.assets.player1.left.width;

  randomSeed(10);
  groundCanvas.background("#748853");
  drawGround();
}

export function enter() {
  for (const player of Object.values(shared.players)) {
    localPlayer(player).x = player.x;
    localPlayer(player).y = player.y;
  }
  camera.follow(...aimCamera(), 1);
  input.reset();
}

function aimCamera() {
  const cameraX =
    ((shared.players.player1.x + 0.5) * CONFIG.grid.width +
      (shared.players.player2.x + 0.5) * CONFIG.grid.width) *
    0.5;
  const cameraY =
    ((shared.players.player1.y + 0.5) * CONFIG.grid.height +
      (shared.players.player2.y + 0.5) * CONFIG.grid.height) *
    0.5;

  return [cameraX, cameraY];
}
export function update() {
  // sync scene to gameState
  if (shared.gameState === "win") {
    changeScene(scenes.win);
    return;
  }
  if (shared.gameState === "waiting") {
    changeScene(scenes.title);
    return;
  }

  input.update();

  // lerp/tween players
  for (const player of Object.values(shared.players)) {
    localPlayer(player).x = lerp(localPlayer(player).x, player.x, 0.5);
    localPlayer(player).y = lerp(localPlayer(player).y, player.y, 0.5);
  }
  camera.follow(...aimCamera(), 0.1);
}

export function mousePressed() {}

/// draw functions
export function draw() {
  clear();

  // scroll
  translate(width * 0.5, height * 0.5);
  scale(1);
  translate(-camera.x, -camera.y);

  // draw game
  image(groundCanvas, 0, 0);
  // drawGrid();
  items.drawItems(shared.items);
  drawPlayers();
  drawMap();

  push();
  noFill();
  noStroke();
  assets.drawQueue();
  pop();

  // draw overlay
  push();
  drawScores();
  drawAmmo();
  pop();
}

// eslint-disable-next-line no-unused-vars
function drawGrid() {
  push();
  noFill();
  stroke(0, 0, 0, 50);
  for (let row = 0; row < CONFIG.grid.rows; row++) {
    for (let col = 0; col < CONFIG.grid.cols; col++) {
      rect(
        col * CONFIG.grid.width,
        row * CONFIG.grid.height,
        CONFIG.grid.width,
        CONFIG.grid.height
      );
    }
  }

  pop();
}

function drawGround() {
  function drawTexture(x, y, type) {
    const img = random(assets.assets.ground[type]);
    groundCanvas.image(
      img,
      x * CONFIG.grid.width,
      y * CONFIG.grid.height,
      img.width * imgScale,
      img.height * imgScale
    );
  }
  groundCanvas.push();
  groundCanvas.tint(255, 150);

  groundCanvas.imageMode(CENTER);
  for (let row = 0; row < CONFIG.grid.rows; row++) {
    for (let col = 0; col < CONFIG.grid.cols; col++) {
      if (random() < 0.05) drawTexture(col, row, "darkest");
      if (random() < 0.08) {
        drawTexture(col, row, "dark");
        if (random() < 0.5) drawTexture(col, row, "light");
        if (random() < 0.5) drawTexture(col, row, "lightest");
      }
      if (random() < 0.03) drawTexture(col, row, "light");
      if (random() < 0.03) drawTexture(col, row, "lightest");
    }
  }

  groundCanvas.pop();

  groundCanvas.push();
  groundCanvas.blendMode(SOFT_LIGHT);
  groundCanvas.tint(255, 150);

  for (let row = 0; row < CONFIG.grid.rows; row++) {
    for (let col = 0; col < CONFIG.grid.cols; col++) {
      if (random() < 0.05) {
        const img = random(assets.assets.ground.highlight);
        groundCanvas.image(
          img,
          col * CONFIG.grid.width,
          row * CONFIG.grid.height,
          img.width * imgScale
        );
      }
    }
  }
  groundCanvas.pop();
}

function drawMap() {
  function sampleGrid(grid, col, row) {
    if (col < 0 || col >= CONFIG.grid.cols) return false;
    if (row < 0 || row >= CONFIG.grid.rows) return false;
    return grid[col][row];
  }

  function getScore(grid, col, row) {
    let score = 0;
    if (sampleGrid(grid, col, row - 1)) score += 1;
    if (sampleGrid(grid, col + 1, row)) score += 2;
    if (sampleGrid(grid, col, row + 1)) score += 4;
    if (sampleGrid(grid, col - 1, row)) score += 8;
    return score;
  }

  for (const [x, y, value] of iterate2D(shared.map)) {
    if (value) {
      const score = getScore(shared.map, x, y);

      assets.addToQueue({
        path: `${shared.map[x][y]}.${score}`,
        x: x,
        y: y,
        sort: 0,
      });
    }
  }
}

function drawPlayers() {
  for (const [key, player] of Object.entries(shared.players)) {
    assets.addToQueue({
      path: `${key}.${player.facing}.base`,
      x: localPlayer(player).x,
      y: localPlayer(player).y,
      sort: 2,
    });
    assets.addToQueue({
      path: `${key}.${player.facing}.light`,
      x: localPlayer(player).x,
      y: localPlayer(player).y,
      blendMode: SOFT_LIGHT,
      sort: 10,
    });
  }
}

function drawScores() {
  let y = 30;
  push();
  textSize(20);
  for (const player of Object.values(shared.players)) {
    fill(player.color);
    text(player.score, 10, y);
    y += 20;
  }
  pop();
}

function drawAmmo() {
  push();
  noStroke();
  const p = shared.players[roleKeeper.myRole()];
  if (!p) return;

  for (let i = 0; i < p.ammo; i++) {
    fill(p.color);
    ellipse(20 + i * 20, height - 20, 16);
  }
  pop();
}

function localPlayer(player) {
  if (!localPlayer.data) localPlayer.data = new WeakMap();
  if (!localPlayer.data.has(player)) {
    localPlayer.data.set(player, { x: player.x, y: player.y });
  }
  return localPlayer.data.get(player);
}
