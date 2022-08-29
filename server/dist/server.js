"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateServer = exports.Connection = exports.SocketProtocolNames = void 0;
const socket_io_1 = require("socket.io");
const crypto_1 = require("crypto");
exports.SocketProtocolNames = {
    GET: "GET",
    SET: "SET"
};
const connections = {};
const DeafultServerOptions = {
    cors: { origin: "*" }
};
function hash(str) {
    return (0, crypto_1.createHash)("sha1")
        .update(str)
        .digest("hex");
}
function GetId(id, functions) {
    if (typeof id == "function") {
        return Object.keys(functions).find(k => functions[k] === id);
    }
    else {
        return id;
    }
}
class Connection {
    socket;
    functions = {};
    hash;
    constructor(socket) {
        this.socket = socket;
        this.hash = hash(this.constructor.toString());
        this.receive();
        const connectionsHash = connections[this.hash];
        if (connectionsHash)
            connectionsHash.push(this);
        else
            connections[this.hash] = [this];
    }
    register(funcions) {
        for (var key in funcions) {
            if (this.functions[key])
                throw new Error("Dupicate function key:" + key);
        }
        this.functions = {
            ...this.functions,
            ...funcions
        };
    }
    cast(id, ...args) {
        this.execute(this.socket, GetId(id, this.functions), ...args);
    }
    brodcast(id, ...args) {
        for (var session of connections[this.hash]) {
            this.execute(session.socket, GetId(id, this.functions), ...args);
        }
    }
    type(types) {
        for (var type in types) {
            if (typeof types[type] != type)
                return false;
        }
        return true;
    }
    receive() {
        const { SET } = exports.SocketProtocolNames;
        this.socket.on(SET, (id, args) => {
            this.execute(this.socket, id, ...args);
        });
    }
    send(socket = this.socket, id, data) {
        const { GET } = exports.SocketProtocolNames;
        socket.emit(GET, id, data);
    }
    execute(socket = this.socket, id, ...args) {
        const func = this.functions[id];
        if (!func)
            return;
        func.bind(this)((data) => {
            this.send(socket, id, data);
        }, ...args);
    }
}
exports.Connection = Connection;
function CreateServer(port, config = DeafultServerOptions) {
    return new socket_io_1.Server(port, config);
}
exports.CreateServer = CreateServer;
