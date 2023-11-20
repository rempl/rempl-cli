import path from 'path';
import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { applyRemplProtocol } from './ws.js';

const staticPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../static');

export function createServer(options) {
    const port = options?.port || 8177;
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, { maxHttpBufferSize: 10_000_000 });

    app.use(express.static(staticPath));
    app.get('/', function (req, res) {
        res.sendFile(path.join(staticPath, 'index.html'));
    });

    // apply socket.io
    io.on('connection', function (socket) {
        // console.log(socket);
        console.log('A client connected');

        socket.on('disconnect', function () {
            console.log('A client disconnected');
        });
    });
    io.on('*', function (...a) {
        console.log(a);
    });

    applyRemplProtocol(io);

    return new Promise((resolve) => {
        server.listen(port, function () {
            console.log(`listening on http://localhost:${this.port}`);
            resolve(server);
        });
    });
}