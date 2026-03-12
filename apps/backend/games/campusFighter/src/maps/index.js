import {TMX} from "../tiled/index.js"
import gigantic from "./gigantic.json" with { type: "json" }
import small from "./small.json" with { type: "json" }

/**@type {Object<string, TMX.IMap>} */
export const List = Object.freeze({
    small,
    gigantic,
});