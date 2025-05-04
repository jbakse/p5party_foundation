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

export function preload() {
  shared = partyLoadShared("shared");
  roleKeeper = new RoleKeeper(["player1", "player2"], "unassigned");
  roleKeeper.setAutoAssign(false);
}

export function setup() {}

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
  randomSeed(0);

  clear();

  // scroll
  translate(width * 0.5, height * 0.5);
  scale(1);
  translate(-camera.x, -camera.y);

  // draw game
  drawGround();
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
  fill("#748853");
  stroke("black");
  strokeWeight(4);
  rect(0, 0, CONFIG.grid.cols * CONFIG.grid.width, CONFIG.grid.rows * CONFIG.grid.height);
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
        yOffset: 0,
      });
    }
  }
}

function drawPlayers() {
  for (const [key, player] of Object.entries(shared.players)) {
    assets.addToQueue({
      path: `${key}.${player.facing}`,
      x: localPlayer(player).x,
      y: localPlayer(player).y,
      z: 2,
      yOffset: -CONFIG.grid.height,
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
