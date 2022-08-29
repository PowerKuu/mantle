import { io, ManagerOptions, Socket, SocketOptions } from "socket.io-client"

type CallbackType = (data:any) => any

interface CallbackMapType {
    [id:string]: CallbackType
}

interface CallbackBufferType {
    [id:string]: any[]
}

const SocketProtocolNames = {
    GET: "GET",
    SET: "SET"
}


export class Connection {
    private CallbackMap:CallbackMapType = {}
    private CallbackBuffer:CallbackBufferType = {}

    socket:Socket

    constructor(
        private options:Partial<ManagerOptions & SocketOptions>|string, 
    ){
       this.socket = io(this.options)

        this.socket.on(SocketProtocolNames.GET, (id:string, data:any) => {
            const callback = this.CallbackMap[id]
            if (callback) callback(data) 
            else this.CallbackBuffer[id].push(data)
        })        
    }

    get(id:string, callback:CallbackType, buffer = true){
        this.CallbackMap[id] = callback
        const callBuffer = this.CallbackBuffer[id]
        
        if (!buffer || !callBuffer) return

        for (var data of callBuffer) callback(data)
        this.CallbackBuffer[id] = []
    }
    
    set(id:string, ...args:any[]){
        this.socket.emit(SocketProtocolNames.SET, id, args)
    }
}