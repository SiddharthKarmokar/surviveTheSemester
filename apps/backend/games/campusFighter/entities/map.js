import { Vector2 } from '../src/geometry.js';
import { Maths } from '../src/index.js';

export class Map {

    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    // Methods
    isVectorOutside(x, y) {
        return x < 0 || x > this.width || y < 0 || y > this.height;
    }

    isRectangleOutside(rectangle) {
        return (
            rectangle.x < 0 ||
            rectangle.right > this.width ||
            rectangle.y < 0 ||
            rectangle.bottom > this.height
        );
    }

    isCircleOutside(circle) {
        return (
            circle.left < 0 ||
            circle.right > this.width ||
            circle.top < 0 ||
            circle.bottom > this.height
        );
    }

    clampRectangle(rectangle) {
        return new Vector2(
            Maths.clamp(rectangle.x, 0, this.width - rectangle.width),
            Maths.clamp(rectangle.y, 0, this.height - rectangle.height)
        );
    }

    clampCircle(circle) {
        return new Vector2(
            Maths.clamp(circle.x, circle.radius, this.width - circle.radius),
            Maths.clamp(circle.y, circle.radius, this.height - circle.radius)
        );
    }

    // Setters
    setDimensions(width, height) {
        this.width = width;
        this.height = height;
    }
}