import {Server as SocketServer, ServerOptions, Socket} from "socket.io"

export interface ExchangeType {
    send: (value:any) => boolean,
    end: () => boolean,
    socket: Socket,
}

export type CallType = (exchange:ExchangeType, ...args:any[]) => any

export class ExchangeServer {
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
        function CreateExchange(id:string):ExchangeType {
            return {
                send: (data:any) => socket.emit(call.name, {
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
            }
        }
        
        socket.on(call.name, ({id, args}) => {
            call(CreateExchange(id), ...args)
        })
    }
}

export default ExchangeServer