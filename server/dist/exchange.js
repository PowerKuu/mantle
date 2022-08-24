"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeServer = void 0;
const socket_io_1 = require("socket.io");
class ExchangeServer {
    config;
    io;
    connections = [];
    constructor(port, config = {
        cors: { origin: "*" }
    }, io = new socket_io_1.Server(port, config)) {
        this.config = config;
        this.io = io;
        this.io.on("connection", (socket) => {
            this.connections.push(socket);
        });
    }
    registerCalls(...calls) {
        this.connections.forEach((socket) => {
            calls.forEach((call) => this.registerCall(socket, call));
        });
        this.io.on("connection", (socket) => {
            this.connections.push(socket);
            calls.forEach(call => this.registerCall(socket, call));
        });
    }
    registerCall(socket, call) {
        function CreateExchange(id) {
            return {
                send: (data) => socket.emit(call.name, {
                    id: id,
                    data: data,
                    end: false
                }),
                end: () => socket.emit(call.name, {
                    id: id,
                    data: undefined,
                    end: true
                }),
                socket: socket,
            };
        }
        socket.on(call.name, ({ id, args }) => {
            call(CreateExchange(id), ...args);
        });
    }
}
exports.ExchangeServer = ExchangeServer;
exports.default = ExchangeServer;
