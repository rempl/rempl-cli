export class EndpointList {
    constructor(server) {
        this.connections = [];
        this.server = server;
    }

    get(property, value) {
        for (const connection of this.connections) {
            if (connection[property] === value) {
                return connection;
            }
        }

        return null;
    }
    add(connection) {
        if (this.connections.indexOf(connection) === -1) {
            this.connections.push(connection);
            this.notifyUpdates();
        }
    }
    remove(connection) {
        const index = this.connections.indexOf(connection);
        if (index !== -1) {
            this.connections.splice(index, 1);
            this.notifyUpdates();
        }
    }
    forEach(fn, context) {
        this.connections.forEach(fn, context);
    }
    notifyUpdates() {
        // TODO: notify subscribers
        this.server.emit('rempl:endpointList', this.getList());
    }
    broadcast(...args) {
        for (const connection of this.connections) {
            connection.emitIfPossible(...args);
        }
    }
    getList() {
        return this.connections.map((connection) => connection.getData());
    }
}
