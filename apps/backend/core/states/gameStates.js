import { Schema } from "@colyseus/schema"
import { GameError } from "../../errorHandlers/index"

export class GameState extends Schema {
    
    update() {
        throw new GameError("update() must be implemented");
    }
}