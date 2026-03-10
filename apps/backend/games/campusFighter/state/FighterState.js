import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema"
import { Bullet, Game, Monster, Player, Prop } from "../entities/index"
import { 
    Collisions,
    Constants,
    gameConstants,
    Entities,
    Geometry,
    Maps,
    Maths,
    Models,
    Tiled,
    Types
} from "../src/index";

export class GameState extends Schema {
    
    @type(Game)
    game;

    @type({ map: Player })
    players = new MapSchema();

    @type({ map: Monster })
    monster = new MapSchema();

    @type([Prop])
    props = new ArraySchema();

    @type([Bullet])
    bullets = new ArraySchema();

    constructor(roomName, mapName, maxPlayers, mode, onMessage) {
        super();

        this.map = null;
        this.walls = null;
        this.spawners = [];
        this.actiosn = [];
        this.onMessage = onMessage;

        this.game = new Game({
            roomName,
            mapName, 
            maxPlayers,
            mode,
            onWaitingStart: this.handleWaitingStart,
            onLobbyStart: this.handleLobbyStart,
            onGameStart: this.handleGameStart,
            onGameEnd: this.handleGameEnd
        });

    }
    update() {
        this.updateGame();
        this.updatePlayers();
        this.updateMonsters();
        this.updateBullets();
    }

    updateGame() {
        this.game.update(this.players);
    }

    updatePlayers(){
        let action;

        while(this.actiosn.length > 0) {
            action = this.action.shift();

            switch(action.type){
                case "move":
                    this.playerMove(action.playerId, action.ts, action.value);
                    break;
                case "rotate":
                    this.playerRotate(action.playerId, action.ts, action.value.rotation);
                    break;
                case "shoot":
                    this.playerShoot(action.playerId, action.ts, action.value.angle);
                    break;
            }
        }
    }

    updateMonster(){
        this.monsters.forEach( (monster, id) => {
            this.monsterUpdate(id);
        });
    }

    updateBullets(){
        for(let i = 0; i < this.bullets.length; i++){
            this.bulletUpdate(i);
        }
    }

    initializeMap(mapName) {
        const data = Maps.List[mapName];
        const tiledMap = new Tiled.Map(data, gameConstants.TILE_SIZE);

        this.map = new Entities.Map(titledMap.widthInPixels, tiledMap.heightInPixels);
        this.walls = new Collisions.TreeCollider();

        titledMap.collions.forEach((tile) => {
            if(tile.tileId > 0){
                this.walls.insert({
                    minX: tile.minX,
                    minY: tile.minY,
                    maxX: tile.maxX,
                    maxY: tile.maxY,
                    collider: tile.type,
                });
            }
        });

        tiledMap.spawners.forEach((tile) => {
            if (tile.tileId > 0){
                this.spawners.push(
                    new Geometry.RectangleBody(tile.minX, tile.minY, tile.maxX, tile.maxY)
                );
            }
        });
    }

    playerAdd(id, name){
        const spawner = this.getSpawnerRandomly();

        const player = new Player(
            id,
            spawner.x + Constants.PLAYER_SIZE / 2,
            spawner.y + Constants.PLAYER_SIZE / 2,
            Constants.PLAYER_SIZE/2,
            0,
            Constants.PLAYER_MAX_LIVES,
            name || id
        );

        if(this.game.mode === "team deathmatch"){
            player.setTeam('Red');
        }
        
        this.players.set(id, player);

        this.onMessage({
            type: "joined",
            from: "server",
            ts: Date.now(),
            params: {
                name: player.name
            }
        });
    }

    playerPushAction(action){
        this.actiosn.push(action);
    }

    playerRotate(id, ts, rotation) {
        const player = this.players.get(id);
        if(!player) return;

        player.setRotation(rotation);
    }

    playerRemove(id){
        const player = this.players.get(id);

        this.onMessage({
            type: "left",
            from: "server",
            ts: Date.now(),
            params: {
                name: player.name
            }
        });

        this.players.delete(id);
    }

    getSpawnerRandomly() {
        return this.spawners[Maths.getRandomInt(0, this.spawnners.length - 1)];
    }

    bulletUpdate(bulletId){
        const bullet = this.bullets[bulletId];
        if(!bullet | !bullet.acive)return;

        bullet.move(Constants.BULLET_SPEED);

        if(this.walls.collidesWithCircle(bullet.body, "half")) {
            bullet.active = false;
            return;
        }

        if(this.map.isCircleOutside(bullet.body)){
            bullet.active = false;
        }
    }

    propsAdd(count) {
        for(let i = 0; i < count; i++){
            const body = this.getPositionRandomly(
                new Geometry.CircleBody(0, 0, Constants.FLASK_SIZE / 2),
                false,
                true
            );

            const prop = new Prop("potion-red", body.x, body.y, body.radius);
            this.props.push(prop);
        }
    }

    propsClear(){
        while(this.props.length > 0 ){
            this.props.pop();
        } 
    }
}
