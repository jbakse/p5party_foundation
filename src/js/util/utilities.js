import { CONFIG } from "../config.js";
// return a random integer between in range [a, b)
export function randomInt() {
  return floor(random(...arguments));
}

// return a random color (expects colorMode(RGB, 255))
export function randomColor() {
  return color(randomInt(0, 255), randomInt(0, 255), randomInt(0, 255));
}

// returns a random color base on noise inputs
export function noiseColor(a = 0, b = 0, c = 0) {
  return color(
    //
    noise(a, b, c + 100) * 255,
    noise(a, b, c + 200) * 255,
    noise(a, b, c + 300) * 255
  );
}

export function removeItemFromArray(a, item) {
  const index = a.indexOf(item);
  if (index > -1) {
    a.splice(index, 1);
  }
}

export function filterInPlace(a, predicate) {
  let i = a.length;
  while (i--) {
    if (!predicate(a[i])) {
      a.splice(i, 1);
    }
  }
}

// creates a 2D array with the given dimensions and fills it with the given value
export function createArray2D(cols, rows, value) {
  return Array.from({ length: cols }, () => Array(rows).fill(value));
}

export function makeId() {
  // 1. Math.random() creates a random number between 0 and 1 (0.123456789)
  // 2. toString(36) converts the number to base-36 (0-9 and a-z) (0.4fzyo6ny8)
  // 3. substring(2, 9) takes 7 characters starting after "0." (4fzyo6n)
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Creates a generator that yields each element in a 2D array along with its coordinates.
 * Useful for iterating over 2D arrays with a for...of loop.
 * @param {Array<Array<any>>} array - The 2D array to iterate over
 * @yields {[number, number, any]} - A tuple of [x, y, value]
 *
 * Example:
 * const grid = [[1, 2], [3, 4]];
 * for (const [x, y, value] of iterate2D(grid)) {
 *   console.log(`Value ${value} at position (${x}, ${y})`);
 * }
 */
export function* iterate2D(array) {
  for (let x = 0; x < array.length; x++) {
    for (let y = 0; y < array[x].length; y++) {
      yield [x, y, array[x][y]];
    }
  }
}

/**
 * Converts a 2D array to a string representation. With each sub-array on a new line.
 * @param {Array<Array<any>>} arr - The 2D array to convert to a string
 * @returns {string} - A string representation of the 2D array
 **/
export function stringFrom2D(arr) {
  const lines = arr.map((subArr) => JSON.stringify(subArr));
  return "[\n  " + lines.join(",\n  ") + "\n]";
}

/**
 * Transposes a 2D array (swaps rows and columns)
 * @param {Array<Array<any>>} array - Original 2D array
 * @returns {Array<Array<any>>} Transposed 2D array
 */
export function transpose2D(array) {
  const cols = array.length;
  const rows = array[0].length;
  const result = createArray2D(rows, cols, null);

  for (const [x, y, value] of iterate2D(array)) {
    result[y][x] = value;
  }

  return result;
}

export function sampleGrid(grid, col, row) {
  if (col < 0 || col >= CONFIG.grid.cols) return false;
  if (row < 0 || row >= CONFIG.grid.rows) return false;
  return grid[col][row];
}

export function getScore(grid, col, row) {
  let score = 0;
  if (sampleGrid(grid, col, row - 1)) score += 1;
  if (sampleGrid(grid, col + 1, row)) score += 2;
  if (sampleGrid(grid, col, row + 1)) score += 4;
  if (sampleGrid(grid, col - 1, row)) score += 8;
  return score;
}
