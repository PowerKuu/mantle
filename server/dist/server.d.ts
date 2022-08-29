import { Server as SocketServer, ServerOptions, Socket } from "socket.io";
export declare type NormalTypes = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
export declare type FunctionType = (callback: (data: any) => any, ...input: any[]) => any;
export declare type FunctionsType = {
    [id: string]: FunctionType;
};
export declare type FunctionIdType = string;
export declare type ConnectionsType = {
    [hash: string]: Connection[];
};
export declare const SocketProtocolNames: {
    GET: string;
    SET: string;
};
export declare abstract class Connection {
    socket: Socket;
    functions: FunctionsType;
    hash: string;
    constructor(socket: Socket);
    register(funcions: FunctionsType): void;
    cast(id: FunctionIdType | FunctionType, ...args: any[]): void;
    brodcast(id: FunctionIdType | FunctionType, ...args: any[]): void;
    type(types: {
        [key in NormalTypes]?: any;
    }): boolean;
    private receive;
    private send;
    private execute;
}
export declare function CreateServer(port: number, config?: Partial<ServerOptions>): SocketServer<import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, any>;
