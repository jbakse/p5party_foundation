import { loadMap } from "./map.js";
import { makeId } from "./util/utilities.js";
import { filterInPlace } from "./util/utilities.js";
import { CONFIG } from "./config.js";
import { itemsOfType, blocksMove, blocksPush } from "./items.js";
import { roleKeeper } from "./playScene.js";

export let shared;

export function preload() {
  // shared should be written ONLY by host
  shared = partyLoadShared("shared", {
    map: [[]], // 2D array of booleans
    items: [], // array of { x, y, type, id } objects
    players: {
      player1: {
        x: 0, // grid position
        y: 0, // grid position
        color: "black", // tint color
        facing: "up", // up | down | left | right
        ammo: 0, // number of bullets
        score: 0, // number of treasures collected
      },
      player2: { x: 0, y: 0, color: "black", facing: "up", ammo: 0, score: 0 },
    },

    gameState: "waiting", // waiting | playing | win
  });
}

export function setup() {
  partySubscribe("face", onFace);
  partySubscribe("move", onMove);
  partySubscribe("shoot", onShoot);
}

function onFace({ role, facing }) {
  if (!partyIsHost()) return;
  if (shared.gameState !== "playing") return;
  const player = shared.players[role];
  player.facing = facing;
}

function onMove({ role, dX, dY }) {
  if (!partyIsHost()) return;

  if (shared.gameState !== "playing") return;

  const player = shared.players[role];

  const newX = player.x + dX;
  const newY = player.y + dY;

  // reject if blocked by bounds
  if (newX < 0 || newX >= CONFIG.grid.cols || newY < 0 || newY >= CONFIG.grid.rows) {
    return;
  }

  // reject if blocked by map
  if (shared.map[newX][newY]) return;

  // reject if blocked by item
  if (
    shared.items.some((item) => {
      return item.x === newX && item.y === newY && blocksMove(item);
    })
  ) {
    return;
  }

  // check for crate
  const crate = itemsOfType("crate").find((c) => c.x === newX && c.y === newY);
  if (crate) {
    // if crate, collect info about other side
    const otherSideWall = shared.map[newX + dX][newY + dY];
    const otherSideGuest = Object.values(shared.players).some(
      (g) => g.x === newX + dX && g.y === newY + dY
    );
    const otherSideItem = shared.items.some(
      (item) => item.x === newX + dX && item.y === newY + dY && blocksPush(item)
    );
    const otherSideBlocked = otherSideWall || otherSideGuest || otherSideItem;
    // reject pushing blocked
    if (crate && otherSideBlocked) return;

    // push crate
    crate.x += dX;
    crate.y += dY;
  }

  // move the player
  player.x = newX;
  player.y = newY;
}

function onShoot({ role }) {
  if (!partyIsHost()) return;
  if (shared.gameState !== "playing") return;

  const player = shared.players[role];
  if (player.ammo <= 0) return;
  player.ammo--;

  shared.items.push({
    type: "bullet",
    id: makeId(),
    x: player.x,
    y: player.y,
    facing: player.facing,
    color: player.color,
  });
}

function startPlaying() {
  if (shared.gameState !== "waiting") {
    throw new Error(`Invalid game state transition: ${shared.gameState} -> playing`);
  }
  const { map, items, p1, p2 } = loadMap();

  shared.map = map;
  shared.items = items;
  shared.players = {
    player1: { ...p1, color: "red", facing: "down", ammo: 10, score: 0 },
    player2: { ...p2, color: "blue", facing: "down", ammo: 10, score: 0 },
  };

  shared.gameState = "playing";
}

function startWin() {
  if (shared.gameState !== "playing") {
    throw new Error(`Invalid game state transition: ${shared.gameState} -> win`);
  }
  shared.gameState = "win";

  // warn: this won't hand off if host leaves during timeout
  setTimeout(startWaiting, 5000);
}

function startWaiting() {
  if (shared.gameState !== "win") {
    throw new Error(`Invalid game state transition: ${shared.gameState} -> waiting`);
  }

  shared.gameState = "waiting";
}

function players() {
  return Object.values(shared.players);
}

export function update() {
  if (!partyIsHost()) return;

  if (shared.gameState === "waiting") updateWaiting();
  if (shared.gameState === "win") return;
  if (shared.gameState === "playing") updatePlaying();
}

function updateWaiting() {
  const player1 = roleKeeper.guestsWithRole("player1")[0];
  const player2 = roleKeeper.guestsWithRole("player2")[0];
  if (player1 && player2) {
    startPlaying();
  }
}
function updatePlaying() {
  // check for treasure collection
  const treasures = itemsOfType("treasure");
  for (const treasure of treasures) {
    for (const player of players()) {
      if (player.x === treasure.x && player.y === treasure.y) {
        treasure.remove = true;
        player.score++;
      }
    }
  }

  // operate floor switches
  const floorSwitches = itemsOfType("floorSwitch");
  const crates = itemsOfType("crate");
  for (const floorSwitch of floorSwitches) {
    const pressedByGuest = players().some(
      (guest) => guest.x === floorSwitch.x && guest.y === floorSwitch.y
    );
    const pressedByCrate = crates.some(
      (crate) => crate.x === floorSwitch.x && crate.y === floorSwitch.y
    );
    const pressed = pressedByGuest || pressedByCrate;
    if (pressed) {
      floorSwitch.state = "down";
    } else {
      floorSwitch.state = "up";
    }
    itemsOfType("door")
      .filter((g) => floorSwitch.group === g.group)
      .forEach((door) => (door.open = pressed));
  }

  const stairs = itemsOfType("stairs");

  // if every player is on stairs, goto win state
  if (
    shared.gameState === "playing" &&
    players().every((player) =>
      stairs.some((stairs) => stairs.x === player.x && stairs.y === player.y)
    )
  ) {
    startWin();
  }

  // bullet - handle bullet movement
  const bullets = itemsOfType("bullet");
  for (const bullet of bullets) {
    const directionDict = {
      down: 0,
      up: PI,
      left: PI / 2,
      right: -PI / 2,
    };

    const dx = -sin(directionDict[bullet.facing]);
    const dy = cos(directionDict[bullet.facing]);

    const newX = bullet.x + dx * CONFIG.game.bulletSpeed;
    const newY = bullet.y + dy * CONFIG.game.bulletSpeed;

    const roundedX = round(newX);
    const roundedY = round(newY);

    // check for collision with walls and closed doors
    if (
      shared.map[roundedX]?.[roundedY] ||
      itemsOfType("door").some((door) => door.x === roundedX && door.y === roundedY && !door.open)
    ) {
      bullet.remove = true;
      continue;
    }

    // bullet - check for collision with crates
    const maxCrateHits = 3;
    const crate = crates.find((c) => c.x === roundedX && c.y === roundedY);
    if (crate) {
      crate.hits++;
      crate.alpha = map(crate.hits, 0, maxCrateHits, 255, 0);
      if (crate.hits >= maxCrateHits) {
        crate.remove = true;
      }
      bullet.remove = true;
      continue;
    }

    // bullet - move the bullet
    bullet.x = newX;
    bullet.y = newY;
  }

  // remove dead items
  filterInPlace(shared.items, (item) => !item.remove);
}
