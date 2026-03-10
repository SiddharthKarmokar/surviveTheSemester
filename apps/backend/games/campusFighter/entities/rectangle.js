import { Schema, defineTypes } from "@colyseus/schema";
import { Geometry } from "@tosios/common";

export class Rectangle extends Schema {

  constructor(x, y, width, height) {
    super();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  get body() {
    return new Geometry.RectangleBody(this.x, this.y, this.width, this.height);
  }

}

defineTypes(Rectangle, {
  x: "number",
  y: "number",
  width: "number",
  height: "number"
});