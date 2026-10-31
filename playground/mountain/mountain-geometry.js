// Y is up. The mountain, snow apron and square grid all share ground Y=0.
export const TERRAIN_HALF = 4.1;
export const GRID_HALF = 4.45;
export const MAX_HEIGHT = 3.7;
export const INITIAL_YAW = -0.7;
export const INITIAL_PITCH = Math.PI / 12;
export const MIN_PITCH = Math.PI / 18;
export const MAX_PITCH = Math.PI / 5;
export const VERTEX_STRIDE = 12;

// The watershed is shared with the offline sculptor. Its rear-side mask stays
// attached to the object as it turns; it is never selected by camera angle.
export const SUMMIT_RIDGE = [
  [-2.35, 0.65, 0],
  [-1.88, 0.36, 1.1],
  [-1.38, -0.42, 2.18],
  [-0.85, -0.98, 1.9],
  [-0.12, -1.42, 2.68],
  [0.28, -1.52, 2.42],
  [0.78, -1.66, 3.62],
  [1.22, -1.4, 3.2],
  [1.86, -0.96, 2.15],
  [2.72, -0.45, 0],
];

export function rearFaceWeight(horizontal, depth) {
  const px = horizontal / 1.28,
    pz = depth / 1.28;
  let ridgeDepth = SUMMIT_RIDGE[0][1];
  for (let index = 1; index < SUMMIT_RIDGE.length; index++) {
    const start = SUMMIT_RIDGE[index - 1],
      end = SUMMIT_RIDGE[index];
    const along = Math.max(0, Math.min(1, (px - start[0]) / (end[0] - start[0])));
    ridgeDepth = start[1] + (end[1] - start[1]) * along;
    if (px <= end[0]) {
      break;
    }
  }
  return smooth((ridgeDepth - 0.04 - pz) / 0.25);
}

const REAR_GULLIES = [
  {
    width: 0.26,
    points: [
      [0.82, -1.89],
      [1.1, -2.08],
      [1.52, -2.13],
      [1.87, -2.02],
      [2.1, -2.42],
      [2.47, -2.25],
      [2.77, -2.72],
    ],
  },
  {
    width: 0.25,
    points: [
      [0.48, -2.13],
      [0.73, -2.42],
      [0.84, -2.72],
      [1.1, -2.72],
      [1.44, -2.7],
      [1.46, -3.08],
    ],
  },
  {
    width: 0.19,
    points: [
      [0.08, -2.12],
      [-0.28, -2.07],
      [-0.28, -2.52],
      [-0.3, -2.86],
      [-0.32, -3.09],
    ],
  },
  {
    width: 0.18,
    points: [
      [1.61, -2.51],
      [1.62, -2.83],
      [1.87, -3.1],
    ],
  },
  {
    width: 0.16,
    points: [
      [-0.65, -1.92],
      [-1.2, -2.32],
      [-1.14, -2.94],
    ],
  },
];

export function rearSnow(horizontal, depth) {
  const rear = rearFaceWeight(horizontal, depth);
  if (rear === 0) {
    return 0;
  }
  const px = horizontal / 1.28,
    pz = depth / 1.28;
  let snow = 0;
  for (const gully of REAR_GULLIES) {
    for (let index = 1; index < gully.points.length; index++) {
      const start = gully.points[index - 1],
        end = gully.points[index],
        dx = end[0] - start[0],
        dz = end[1] - start[1];
      const along = Math.max(0, Math.min(1, ((px - start[0]) * dx + (pz - start[1]) * dz) / (dx * dx + dz * dz)));
      const progress = (index - 1 + along) / (gully.points.length - 1);
      const distance = Math.hypot(px - start[0] - dx * along, pz - start[1] - dz * along);
      const width = gully.width * (0.45 + 0.55 * progress);
      snow = Math.max(snow, smooth((1 - distance / (width * 0.88)) * 2) * smooth(progress * 10));
    }
  }
  return snow * rear;
}

const REAR_FRACTURES = [
  [
    [1.0, -1.98],
    [1.13, -2.04],
    [1.22, -2.15],
  ],
  [
    [1.3, -2.37],
    [1.29, -2.46],
    [1.42, -2.51],
    [1.39, -2.59],
  ],
  [
    [1.29, -2.46],
    [1.18, -2.49],
    [1.15, -2.55],
  ],
  [
    [0.37, -2.65],
    [0.49, -2.75],
    [0.46, -2.86],
    [0.55, -2.96],
  ],
  [
    [0.49, -2.75],
    [0.59, -2.77],
    [0.64, -2.85],
  ],
  [
    [2.19, -2.77],
    [2.14, -2.86],
    [2.23, -2.94],
    [2.2, -3.01],
  ],
  [
    [-0.54, -2.69],
    [-0.43, -2.76],
    [-0.47, -2.88],
  ],
  [
    [-1.58, -1.27],
    [-1.66, -1.37],
    [-1.61, -1.47],
  ],
];

export function rearFracture(horizontal, depth) {
  const rear = rearFaceWeight(horizontal, depth);
  if (rear === 0) {
    return 0;
  }
  const px = horizontal / 1.28,
    pz = depth / 1.28;
  let fracture = 0;
  for (const path of REAR_FRACTURES) {
    for (let index = 1; index < path.length; index++) {
      const start = path[index - 1],
        end = path[index],
        dx = end[0] - start[0],
        dz = end[1] - start[1];
      const along = Math.max(0, Math.min(1, ((px - start[0]) * dx + (pz - start[1]) * dz) / (dx * dx + dz * dz)));
      const distance = Math.hypot(px - start[0] - dx * along, pz - start[1] - dz * along);
      const taper = smooth((index - 1 + along) * 3) * smooth((path.length - index - along) * 3);
      fracture = Math.max(fracture, Math.max(0, 1 - distance / 0.014) * taper);
    }
  }
  return fracture * rear;
}

function smooth(value) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}
function hash(column, row) {
  let bits = Math.imul(column, 374761393) + Math.imul(row, 668265263);
  bits = Math.imul(bits ^ (bits >>> 13), 1274126177);
  return ((bits ^ (bits >>> 16)) >>> 0) / 4294967295;
}
function noise(horizontal, vertical) {
  const column = Math.floor(horizontal),
    row = Math.floor(vertical);
  const fractionX = smooth(horizontal - column),
    fractionZ = smooth(vertical - row);
  const back = hash(column, row) * (1 - fractionX) + hash(column + 1, row) * fractionX;
  const front = hash(column, row + 1) * (1 - fractionX) + hash(column + 1, row + 1) * fractionX;
  return back * (1 - fractionZ) + front * fractionZ;
}

export function buildTerrain(elevations, size = 513) {
  if (elevations.length !== 513 * 513 || !Number.isInteger(size) || size < 3) {
    throw new Error("Invalid terrain dimensions");
  }
  function elevation(horizontal, vertical) {
    const column = Math.max(0, Math.min(511.999, (horizontal / (TERRAIN_HALF * 2) + 0.5) * 512));
    const row = Math.max(0, Math.min(511.999, (vertical / (TERRAIN_HALF * 2) + 0.5) * 512));
    const left = Math.floor(column),
      back = Math.floor(row),
      blendX = column - left,
      blendZ = row - back;
    const meters =
      (elevations[back * 513 + left] * (1 - blendX) + elevations[back * 513 + left + 1] * blendX) * (1 - blendZ) +
      (elevations[(back + 1) * 513 + left] * (1 - blendX) + elevations[(back + 1) * 513 + left + 1] * blendX) * blendZ;
    return meters / 16384;
  }
  const heights = new Float32Array(size * size),
    macro = new Float32Array(size * size);
  const rear = new Float32Array(size * size),
    coverage = new Float32Array(size * size);
  const snow = new Float32Array(size * size);
  const step = (TERRAIN_HALF * 2) / (size - 1);
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      const px = column * step - TERRAIN_HALF,
        pz = row * step - TERRAIN_HALF;
      const edge = Math.min(column, row, size - 1 - column, size - 1 - row) * step;
      const sampledHeight = elevation(px, pz);
      // Subpixel residue at the toe belongs to the ground plane, exactly Y=0.
      const base = edge === 0 || sampledHeight < 1 / 1024 ? 0 : sampledHeight;
      const index = row * size + column;
      macro[index] = base;
      heights[index] = base;
      rear[index] = rearFaceWeight(px, pz);
      snow[index] = rearSnow(px, pz);
      const skirt = Math.max(
        elevation(px - 0.1, pz),
        elevation(px + 0.1, pz),
        elevation(px, pz - 0.1),
        elevation(px, pz + 0.1),
      );
      const irregularity = 0.0008 + noise(px * 22, pz * 22) * 0.004;
      coverage[index] = smooth((skirt - irregularity) / 0.004) * smooth(edge / 0.12);
    }
  }
  // Snow follows broad slopes; detailed normals still describe every rock face.
  const smoothed = new Float32Array(macro.length);
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      let value = 0,
        weight = 0;
      for (let delta = -3; delta <= 3; delta++) {
        const kernel = 4 - Math.abs(delta);
        value += macro[row * size + Math.max(0, Math.min(size - 1, column + delta))] * kernel;
        weight += kernel;
      }
      smoothed[row * size + column] = value / weight;
    }
  }
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      let value = 0,
        weight = 0;
      for (let delta = -3; delta <= 3; delta++) {
        const kernel = 4 - Math.abs(delta);
        value += smoothed[Math.max(0, Math.min(size - 1, row + delta)) * size + column] * kernel;
        weight += kernel;
      }
      macro[row * size + column] = value / weight;
    }
  }
  // World-space derivatives and shared vertices keep the surface watertight.
  // Stride: position, normal, macro normal, curvature, coverage, snow.
  const vertices = new Float32Array(size * size * VERTEX_STRIDE);
  const footprint = [];
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      const index = row * size + column;
      const left = row * size + Math.max(0, column - 1),
        right = row * size + Math.min(size - 1, column + 1);
      const back = Math.max(0, row - 1) * size + column,
        front = Math.min(size - 1, row + 1) * size + column;
      const spanX = (column === 0 || column === size - 1 ? 1 : 2) * step;
      const spanZ = (row === 0 || row === size - 1 ? 1 : 2) * step;
      const normalX = (heights[left] - heights[right]) / spanX,
        normalZ = (heights[back] - heights[front]) / spanZ;
      const macroX = (macro[left] - macro[right]) / spanX,
        macroZ = (macro[back] - macro[front]) / spanZ;
      const length = Math.hypot(normalX, 1, normalZ),
        macroLength = Math.hypot(macroX, 1, macroZ);
      const curvature = (heights[left] + heights[right] + heights[back] + heights[front] - 4 * heights[index]) / step;
      vertices.set(
        [
          column * step - TERRAIN_HALF,
          heights[index],
          row * step - TERRAIN_HALF,
          normalX / length,
          1 / length,
          normalZ / length,
          macroX / macroLength,
          1 / macroLength,
          macroZ / macroLength,
          curvature,
          coverage[index],
          snow[index],
        ],
        index * VERTEX_STRIDE,
      );
    }
    // Each row's two outermost covered cells bound its entire silhouette.
    // Include neighbouring cells for triangles crossing the coverage boundary.
    let first = size,
      last = -1;
    for (let column = 0; column < size; column++) {
      if (coverage[row * size + column] > 0) {
        first = Math.min(first, column);
        last = column;
      }
    }
    if (last >= 0) {
      for (const column of [Math.max(0, first - 1), Math.min(size - 1, last + 1)]) {
        for (const neighbour of [Math.max(0, row - 1), Math.min(size - 1, row + 1)]) {
          footprint.push(column * step - TERRAIN_HALF, neighbour * step - TERRAIN_HALF);
        }
      }
    }
  }
  const indices = new Uint32Array((size - 1) * (size - 1) * 6);
  let offset = 0;
  for (let row = 0; row < size - 1; row++) {
    for (let column = 0; column < size - 1; column++) {
      const index = row * size + column;
      indices.set([index, index + size, index + 1, index + 1, index + size, index + size + 1], offset);
      offset += 6;
    }
  }
  return { vertices, indices, heights, rear, coverage, snow, size, footprint };
}

export function buildGrid(divisions = 28) {
  const points = [];
  const point = (horizontal, depth) => points.push(horizontal, 0, depth, 0, 1, 0, 0, 1, 0, 0, 1, 0);
  for (let index = 0; index <= divisions; index++) {
    const position = -GRID_HALF + index * ((GRID_HALF * 2) / divisions);
    point(position, -GRID_HALF);
    point(position, GRID_HALF);
    point(-GRID_HALF, position);
    point(GRID_HALF, position);
  }
  return new Float32Array(points);
}

export function sceneMatrix(yaw, pitch, aspect, compact = false, clearance = null) {
  // Orthographic R_x(-pitch) * R_y(yaw). Desktop deliberately crops the outer
  // ground like the approved landscape; mobile bleeds across the sides and bottom.
  const cosine = Math.cos(yaw),
    sine = Math.sin(yaw),
    up = Math.cos(pitch),
    down = Math.sin(pitch);
  const scale = compact ? Math.max(2.2, 2.5 * aspect) : Math.max(3.35, 2.9 * aspect);
  const horizontal = 1 / scale,
    vertical = aspect / scale,
    depth = 1 / 16;
  // At steep manual tilts, the far summit projects higher. Follow that rise
  // without reducing the approved mobile zoom or moving its default view.
  const tiltLift = Math.max(0, Math.tan(pitch) - Math.tan(INITIAL_PITCH)) * 0.72;
  const focusHeight = compact ? 1.85 + tiltLift : 1.32;
  let shift = compact ? 0 : 0.35;
  if (!compact && clearance) {
    let left = Infinity;
    for (let index = 0; index < clearance.footprint.length; index += 2) {
      left = Math.min(left, cosine * clearance.footprint[index] + sine * clearance.footprint[index + 1]);
    }
    shift = Math.max(shift, clearance.left - left * horizontal);
  }
  return new Float32Array([
    cosine * horizontal,
    down * sine * vertical,
    up * sine * depth,
    0,
    0,
    up * vertical,
    -down * depth,
    0,
    sine * horizontal,
    -down * cosine * vertical,
    -up * cosine * depth,
    0,
    shift,
    -focusHeight * up * vertical,
    focusHeight * down * depth,
    1,
  ]);
}
