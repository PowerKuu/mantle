import { io, ManagerOptions, Socket, SocketOptions } from "socket.io-client"

export default class ExchangeClient {
    constructor(
        public options:Partial<ManagerOptions & SocketOptions>, 
        public socket:Socket = io(options)
    ){}
    
    start(func:string, ...args:any[]) {
        const callbacks = []
        var history = []

        this.socket.emit(func, ...args)

        const event = this.socket.on(func, (data:any) => {
            history.push(data)
            callbacks.forEach((callback) => callback(data))
        }).on("error", (err) => {
            console.error(err)
        }).on("disconnect", () => {
            console.error(new Error("Disconnected"))
        })

        return {
            data: (callback:(data:any) => void) => {
                history.forEach(callback)
                callbacks.push(callback)
            },

            end: () => {
                history = []
                event.removeAllListeners()
            }
        }
    }
}