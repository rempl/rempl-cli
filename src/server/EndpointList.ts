import type { Server } from 'socket.io';
import { Endpoint } from './Endpoint';

export class EndpointList {
    connections: Array<Endpoint>;
    server: Server;

    constructor(server: Server) {
        this.connections = [];
        this.server = server;
    }

    get(property: 'id', value: string) {
        for (const connection of this.connections) {
            if (connection[property] === value) {
                return connection;
            }
        }

        return null;
    }
    add(connection: Endpoint) {
        if (this.connections.indexOf(connection) === -1) {
            this.connections.push(connection);
            this.notifyUpdates();
        }
    }
    remove(connection: Endpoint) {
        const index = this.connections.indexOf(connection);
        if (index !== -1) {
            this.connections.splice(index, 1);
            this.notifyUpdates();
        }
    }
    forEach(fn: (endpoint: Endpoint) => any) {
        this.connections.forEach((endpoint) => fn(endpoint));
    }
    notifyUpdates() {
        // TODO: notify subscribers
        this.server.emit('rempl:endpointList', this.getList());
    }
    broadcast(...args: any[]) {
        for (const connection of this.connections) {
            connection.emitIfPossible(...args);
        }
    }
    getList() {
        return this.connections.map((connection) => connection.getData());
    }

    [Symbol.iterator]() {
        return this.connections[Symbol.iterator]();
    }
}
