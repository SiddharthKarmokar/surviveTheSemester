import { Client } from "colyseus";
import { GameError } from "../../errorHandlers/index"

export class GameAdapter {
    
    init(options){
        throw new GameError("init() must be implemented");
    }
    
    onJoin(client, options){
        throw new GameError("onJoin() must be implemented");
    }
    
    onLeave(client){
        throw new GameError("onLeave() must be implemented");
    }
    
    onMessgae(client, type, message){
        throw new GameError("onLeave() must be implemented");
    }
    
    update(){
        throw new GameError("update() must be implemented");
    }
    
    getState(){
        throw new GameError("getState() must be implemented");
    }
}