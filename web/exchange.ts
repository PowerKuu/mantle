import { io, ManagerOptions, Socket, SocketOptions } from "socket.io-client"

export default class ExchangeClient {
    public EndID = ""

    constructor(
        public options:Partial<ManagerOptions & SocketOptions>|string, 
        public socket:Socket = io(options)
    ){}
    
    start(func:string, callback: (data:any) => void, ...args:any[]) {
        var LocalId = (Math.random() * 10000).toFixed(5).toString()

        this.socket.emit(func, {
            args: args,
            id: LocalId
        })

        const event = this.socket.on(func, (payload:any) => {
            const {id, data, end} = payload

            const destroy = () => {
                event.removeAllListeners()
            }

            if (LocalId !== id) return
            if (end) return destroy()
            callback(data)
        }).on("error", (err) => {
            console.error(err)
        }).on("disconnect", () => {
            console.error(new Error("Disconnected"))
        })
    }
}