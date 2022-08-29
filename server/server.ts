import {Server as SocketServer, ServerOptions, Socket} from "socket.io"
import { createHash } from "crypto"


export type NormalTypes = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function"

export type FunctionType = (callback:(data:any) => any, ...input:any[]) => any

export type FunctionsType = {
    [id:string]: FunctionType
} 

export type FunctionIdType = string

export type ConnectionsType = {
    [hash:string]: Connection[]
}

export const SocketProtocolNames = {
    GET: "GET",
    SET: "SET"
}

const connections:ConnectionsType = {}
const DeafultServerOptions = {
    cors: {origin: "*"}
}

function hash(str:string){
    return createHash("sha1")
        .update(str)
        .digest("hex")
}

function GetId(id:FunctionIdType|FunctionType, functions:FunctionsType):string {
    if (typeof id == "function"){
        return Object.keys(functions).find(k=>functions[k]===id)
    } else {
        return id
    }
}

export abstract class Connection {
    functions: FunctionsType = {}
    hash: string

    constructor(public socket:Socket){
        this.hash = hash(this.constructor.toString())
        this.receive()

        const connectionsHash = connections[this.hash]
        if (connectionsHash) connectionsHash.push(this)
        else connections[this.hash] = [this]
    }   

    register(funcions:FunctionsType){ 
        for (var key in funcions){
            if (this.functions[key]) throw new Error("Dupicate function key:" + key)
        }
        
        this.functions = {
            ...this.functions,
            ...funcions
        }
    }

    cast(id:FunctionIdType|FunctionType, ...args:any[]){
        this.execute(this.socket, GetId(id, this.functions), ...args)
    }

    brodcast(id:FunctionIdType|FunctionType, ...args:any[]){
        for (var session of connections[this.hash]){
            this.execute(session.socket, GetId(id, this.functions), ...args)
        }    
    }

    type(types:{[key in NormalTypes]?: any}){
        for (var type in types){
            if (typeof types[type] != type) return false
        }

        return true
    }

    private receive(){
        const { SET } = SocketProtocolNames
        
        this.socket.on(SET, (id:string, args:any[]) => {
            this.execute(this.socket, id, ...args)
        })
    }

    private send(socket:Socket = this.socket, id:string, data:any) {
        const { GET } = SocketProtocolNames
        
        socket.emit(GET, id, data)
    } 

    private execute(socket:any = this.socket, id:string, ...args:any[]){
        const func = this.functions[id] 
        if (!func) return

        func.bind(this)((data:any) => {
            this.send(socket, id, data)
        }, ...args)
    }
}

export function CreateServer(port: number, config:Partial<ServerOptions> = DeafultServerOptions) {   
    return new SocketServer(port, config)
}