/**
 * Get the angle in radiant between two points
 */
export function calculateAngle(x1, y1, x2, y2) {
    return Math.atan2(y1 - y2, x1 - x2);
}

/**
 * Lerp between two values
 */
export function lerp(a, b, n) {
    return (1 - n) * a + n * b;
}

/**
 * Get the distance between two points
 */
export function getDistance(x, y, toX, toY) {
    return Math.hypot(toX - x, toY - y);
}

/**
 * Get a random integer between min and max.
 */
export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Clamp a value
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Round a floating number to 2 digits
 */
export function round2Digits(value) {
    return Math.round(Math.round(value * 1000) / 10) / 100;
}

/**
 * Normalize a vector
 */
export function normalize2D(ax, ay) {
    return Math.sqrt(ax * ax + ay * ay);
}

/**
 * Transform an angle in degrees to the nearest cardinal point.
 */
export function degreeToCardinal(degree) {
    const cardinals = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'];
    const remainder = degree % 360;
    const index = Math.round((remainder < 0 ? degree + 360 : degree) / 45) % 8;
    return cardinals[index];
}

/**
 * Reverse a number between a range
 * reverseNumber(1.2, 0, 3) -> 1.8
 */
export function reverseNumber(num, min, max) {
    return max + min - num;
}

/**
 * Snap a position on a grid with TILE_SIZE cells
 */
export function snapPosition(pos, tileSize) {
    const rest = pos % tileSize;
    return rest < tileSize / 2 ? -rest : tileSize - rest;
}

/**
 * Shuffles an array
 */
export function shuffleArray(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = result[i];
        result[i] = result[j];
        result[j] = temp;
    }

    return result;
}

/**
 * Convert radians to degrees
 */
export function rad2Deg(radians) {
    return (radians * 180) / Math.PI;
}

/**
 * Normalize a number
 */
export function normalize(value, min, max) {
    return (value - min) / (max - min);
}