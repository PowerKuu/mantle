import {Server as SocketServer, ServerOptions, Socket} from "socket.io"

interface ExchangeType {
    send: (value:any) => any,
    socket: Socket,
}

type CallType = (exchange:ExchangeType, ...args:any[]) => any

export default class ExchangeServer {
    connections:Socket[] = []

    constructor(
        port: number, 
        public config:Partial<ServerOptions> = {
            cors: {origin: "*"}
        }, 
        public io = new SocketServer(port, config)
    ) {
        this.io.on("connection", (socket:Socket) => {
            this.connections.push(socket)
        })
    }
    
    registerCalls(...calls:CallType[]) {
        this.connections.forEach((socket) => {
            calls.forEach((call) => this.registerCall(socket, call))
        })

        this.io.on("connection", (socket:Socket) => {
            this.connections.push(socket)
            calls.forEach(call => this.registerCall(socket, call))
        })
    }

    private registerCall<LocalCallType extends CallType>(socket:Socket, call:LocalCallType) {
        const exchange:ExchangeType = {
            send: (value:any) => socket.emit(call.name, value),
            socket: socket,
        }
        
        socket.on(call.name, (...args) => {
            call(exchange, ...args)
        })
    }
}

