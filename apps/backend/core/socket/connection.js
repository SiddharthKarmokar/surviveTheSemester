export class Connection{
    constructor(id, socket) {
        this.id = id;
        this.socket = socket;

        this.userid = null;
        this.roomid = null;
        
        this.connectedAt = Date.now();
        this.lastPing = Date.now();
    }

    send(data) {
        if(this.socket.readyState === 1) {
            this.socket.send(JSON.stringify(data));
        }
    }
}