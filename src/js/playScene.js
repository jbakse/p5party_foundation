import { CONFIG } from "./config.js";
import { Camera } from "./util/camera.js";
import { RoleKeeper } from "./util/RoleKeeper.js";
import { iterate2D, getScore } from "./util/utilities.js";
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

  assets.player1 = {
    left: loadImage("assets/player1/left.png"),
    right: loadImage("assets/player1/right.png"),
    up: loadImage("assets/player1/up.png"),
    down: loadImage("assets/player1/down.png"),
  };
  assets.player2 = {
    left: loadImage("assets/player2/left.png"),
    right: loadImage("assets/player2/right.png"),
    up: loadImage("assets/player2/up.png"),
    down: loadImage("assets/player2/down.png"),
  };
  assets.walls = [
    loadImage("assets/tile_map/1.png"),
    loadImage("assets/tile_map/2.png"),
    loadImage("assets/tile_map/3.png"),
  ];
  assets.items = {
    crate: [loadImage("assets/crystals/1.png"), loadImage("assets/crystals/2.png")],
    door: { open: loadImage("assets/door/open.png"), closed: loadImage("assets/door/closed.png") },
    floorSwitch: {
      up: loadImage("assets/switch/up.png"),
      down: loadImage("assets/switch/down.png"),
    },
    bullet: {
      player1: loadImage("assets/bullets/player1.png"),
      player2: loadImage("assets/bullets/player2.png"),
    },
    water: loadImage("assets/water.png"),
    stairs: loadImage("assets/stairs/down.png"),
    treasure: loadImage("assets/treasure.png"),
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

  push();
  // scroll
  translate(width * 0.5, height * 0.5);
  scale(1);
  translate(-camera.x, -camera.y);

  // draw game
  drawGrid();
  items.drawItems(shared.items, assets.items);
  drawPlayers();
  drawMap();
  pop();

  // draw overlay
  push();
  drawScores();
  drawAmmo();
  pop();
}

function drawGrid() {
  push();
  // noFill();
  // stroke(0, 0, 0, 50);
  // for (let row = 0; row < CONFIG.grid.rows; row++) {
  //   for (let col = 0; col < CONFIG.grid.cols; col++) {
  //     rect(
  //       col * CONFIG.grid.width,
  //       row * CONFIG.grid.height,
  //       CONFIG.grid.width,
  //       CONFIG.grid.height
  //     );
  //   }
  // }

  fill("#748853");
  stroke("black");
  strokeWeight(4);
  rect(0, 0, CONFIG.grid.cols * CONFIG.grid.width, CONFIG.grid.rows * CONFIG.grid.height);
  pop();
}

function drawMap() {
  push();
  noStroke();
  noFill();

  for (const [x, y, value] of iterate2D(shared.map)) {
    if (value) {
      const score = getScore(shared.map, x, y);

      const img = random(assets.walls);

      const imageWidth = img.width / 4;
      const imageHeight = img.height / 4;
      const imageRatio = imageWidth / imageHeight;

      const sx = (score % 4) * imageWidth;
      const sy = floor(score / 4) * imageHeight;
      push();
      translate(x * CONFIG.grid.width, y * CONFIG.grid.height - CONFIG.grid.height);
      image(
        img,
        0,
        0,
        CONFIG.grid.width,
        CONFIG.grid.width / imageRatio,
        sx,
        sy,
        imageWidth,
        imageHeight
      );

      pop();
    }
  }

  pop();
}

function drawPlayers() {
  push();


  for (const playerKey of Object.keys(shared.players)) {
    const player = shared.players[playerKey];
    const playerImg = assets[playerKey][player.facing];

    const imgRatio = playerImg.width / playerImg.height;
    push();
    translate(
      localPlayer(player).x * CONFIG.grid.width,
      localPlayer(player).y * CONFIG.grid.height
    );
    image(playerImg, 0, -CONFIG.grid.height, CONFIG.grid.width, CONFIG.grid.width / imgRatio);
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
