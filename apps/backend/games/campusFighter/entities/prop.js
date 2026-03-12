import { defineTypes } from "@colyseus/schema";
import { Circle } from "./circle.js";

export class Prop extends Circle {

  constructor(propType, x, y, radius) {
    super(x, y, radius);
    this.type = propType;
    this.active = true;
  }

}

defineTypes(Prop, {
  type: "string",
  active: "boolean"
});