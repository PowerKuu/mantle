import { Server as SocketServer, ServerOptions, Socket } from "socket.io";
export interface ExchangeType {
    send: (value: any) => boolean;
    end: () => boolean;
    socket: Socket;
}
export declare type CallType = (exchange: ExchangeType, ...args: any[]) => any;
export declare class ExchangeServer {
    config: Partial<ServerOptions>;
    io: SocketServer<import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, any>;
    connections: Socket[];
    constructor(port: number, config?: Partial<ServerOptions>, io?: SocketServer<import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, any>);
    registerCalls(...calls: CallType[]): void;
    private registerCall;
}
export default ExchangeServer;
