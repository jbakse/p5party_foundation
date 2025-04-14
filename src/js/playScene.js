import { CONFIG } from "./config.js";
import { Camera } from "./util/camera.js";
import { RoleKeeper } from "./util/RoleKeeper.js";
import { iterate2D } from "./util/utilities.js";
import { changeScene, scenes } from "./main.js";

import * as input from "./input.js";
import * as items from "./items.js";

export let roleKeeper;
let shared;
const camera = new Camera();

const assets = {};

export function preload() {
  shared = partyLoadShared("shared");
  roleKeeper = new RoleKeeper(["player1", "player2"], "unassigned");
  roleKeeper.setAutoAssign(false);
  assets.player = {
    left: loadImage("assets/player-l.png"),
    right: loadImage("assets/player-r.png"),
    up: loadImage("assets/player-r.png"),
    down: loadImage("assets/player-r.png"),
  };
  assets.items = {
    crate: loadImage("assets/crate.png"),
    door: loadImage("assets/door.png"),
    floorSwitch: {
      up: loadImage("assets/switch-up.png"),
      down: loadImage("assets/switch-down.png"),
    },
  };
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
    ((shared.players.player1.x + 0.5) * CONFIG.grid.size +
      (shared.players.player2.x + 0.5) * CONFIG.grid.size) *
    0.5;
  const cameraY =
    ((shared.players.player1.y + 0.5) * CONFIG.grid.size +
      (shared.players.player2.y + 0.5) * CONFIG.grid.size) *
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

  push();
  // scroll
  translate(width * 0.5, height * 0.5);
  scale(1);
  translate(-camera.x, -camera.y);

  // draw game
  drawGrid();
  drawMap();
  items.drawItems(shared.items, assets.items);
  drawPlayers();
  pop();

  // draw overlay
  push();
  drawScores();
  drawAmmo();
  pop();
}

function drawGrid() {
  push();
  noFill();
  stroke(0, 0, 0, 50);
  for (let row = 0; row < CONFIG.grid.rows; row++) {
    for (let col = 0; col < CONFIG.grid.cols; col++) {
      rect(col * CONFIG.grid.size, row * CONFIG.grid.size, CONFIG.grid.size, CONFIG.grid.size);
    }
  }

  noFill();
  stroke("black");
  strokeWeight(4);
  rect(0, 0, CONFIG.grid.cols * CONFIG.grid.size, CONFIG.grid.rows * CONFIG.grid.size);
  pop();
}

function drawMap() {
  push();
  fill("#555");
  for (const [x, y, value] of iterate2D(shared.map)) {
    if (value) {
      rect(x * CONFIG.grid.size + 4, y * CONFIG.grid.size + 4, 56, 56);
    }
  }

  pop();
}

function drawPlayers() {
  push();

  for (const player of Object.values(shared.players)) {
    const playerImg = assets.player[player.facing];
    const imgRatio = playerImg.width / playerImg.height;
    push();
    translate(localPlayer(player).x * CONFIG.grid.size, localPlayer(player).y * CONFIG.grid.size);
    image(
      playerImg,
      0,
      -CONFIG.grid.size / imgRatio + CONFIG.grid.size,
      CONFIG.grid.size,
      CONFIG.grid.size / imgRatio
    );
    pop();
  }
  pop();
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
