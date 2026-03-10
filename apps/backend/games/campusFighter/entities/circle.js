import { Schema, defineTypes } from "@colyseus/schema";
import * as Geometry from "../src/geometry.js";

export class Circle extends Schema {

  constructor(x, y, radius) {
    super();
    this.x = x;
    this.y = y;
    this.radius = radius;
  }

  get body() {
    return new Geometry.CircleBody(this.x, this.y, this.radius);
  }

}

defineTypes(Circle, {
  x: "number",
  y: "number",
  radius: "number"
});