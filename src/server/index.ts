import path from 'path';
import pem from 'pem';
import http from 'http';
import https from 'https';
import express from 'express';
import Server from 'socket.io';
import { fileURLToPath } from 'url';
import { applyRemplProtocol } from './ws.js';
import { createRequire } from 'module';

const staticPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../static');
const require = createRequire(import.meta.url);

type Options = {
    port?: number;
    ssl?: boolean;
    sslKey?: string | Buffer;
    sslCert?: string | Buffer;
};

function createCertificate() {
    return new Promise<pem.CertificateCreationResult>((resolve, reject) => {
        pem.createCertificate({ days: 1, selfSigned: true }, (error, keys) => {
            if (error) {
                reject(error);
            } else {
                resolve(keys);
            }
        });
    });
}

function createServerInternal(options: Options) {
    const port = options?.port || 8177;
    const app = express();
    const server = options.ssl
        ? https.createServer({ key: options.sslKey, cert: options.sslCert }, app)
        : http.createServer(app);

    app.use(express.static(staticPath));
    app.get('/socket.io.slim.js', (_, res) => {
        res.sendFile(require.resolve('socket.io-client/dist/socket.io.slim.js'));
    });
    app.get('/', (_, res) => {
        res.sendFile(path.join(staticPath, 'index.html'));
    });

    // apply socket.io
    const io = new Server(server, { maxHttpBufferSize: 100_000_000 });

    // io.on('connection', function (socket) {
    //     // console.log(socket);
    //     console.log('A client connected');

    //     socket.on('disconnect', function () {
    //         console.log('A client disconnected');
    //     });
    // });

    applyRemplProtocol(io);

    return new Promise((resolve) => {
        server.listen(port, function (this: http.Server) {
            const address = this.address();
            console.log(
                `Listening on ${options.ssl ? 'https' : 'http'}://${
                    typeof address === 'string' ? address : `localhost:${address?.port}`
                }`
            );
            resolve(this);
        });
    });
}

export async function createServer(options: Options) {
    if (options.ssl) {
        if (!options.sslKey && !options.sslCert) {
            const res = await createCertificate();
            options = {
                ...options,
                sslKey: res.clientKey,
                sslCert: res.certificate
            };

            console.warn(
                '[WARNING] A self-signed SSL certificate is currently in use. This configuration is only suitable for development purposes and should not be used in a production environment. For production deployments, please provide valid SSL certificate files using "--ssl-key" and "--ssl-cert" options.\n'
            );
        } else if (!options.sslKey || !options.sslCert) {
            throw new Error('sslKey and sslCert options should be both specified or omitted');
        }
    }

    return createServerInternal(options);
}
