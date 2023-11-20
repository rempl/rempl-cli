import { EndpointList } from './EndpointList.js';
import { Endpoint } from './Endpoint.js';

function genUID(len) {
    function base36(val) {
        return Math.round(val).toString(36);
    }

    // uid should starts with alpha
    let result = base36(10 + 25 * Math.random());

    if (!len) {
        len = 16;
    }

    while (result.length < len) {
        result += base36(Date.now() * Math.random());
    }

    return result.substr(0, len);
}

export function applyRemplProtocol(wsServer, options = {}) {
    const exclusiveEndpointId = options.remplExclusivePublisher ? genUID() : null;
    const endpoints = new EndpointList(wsServer);
    let onEndpointConnectMode = null;
    let lastNum = 0;

    wsServer.on('connect', function (socket) {
        //
        // endpoint (publishers) -> ws server
        //
        socket.on('rempl:endpoint connect', function (data, connectCallback) {
            data = data || {};

            const id = exclusiveEndpointId || data.id || genUID();
            let endpoint = endpoints.get('id', id);

            console.log('Publisher connect', { id, data });

            if (!endpoint) {
                endpoint = new Endpoint(endpoints, id, socket, data);
                endpoint.num = lastNum++;
            } else {
                endpoint.update(data);
                endpoint.setOnline(socket);
            }

            socket
                .on('rempl:endpoint info', function (data) {
                    endpoint.update(data);
                    endpoints.notifyUpdates();
                })
                .on('rempl:from publisher', (publisherId, ...args) => {
                    // var channel = socket.to(endpoint.room);
                    // channel.emit.apply(channel, packet('rempl:to subscriber', arguments));
                    endpoint.subscribers.forEach((subscriber) => {
                        if (subscriber.publisherId === publisherId) {
                            subscriber.emit('rempl:to subscriber', ...args);
                        }
                    });
                })
                .on('disconnect', () => endpoint.setOffline());

            // connected and inited
            connectCallback({
                id,
                subscribers: endpoint.subscribers.length,
                num: endpoint.num,
            });

            if (typeof onEndpointConnectMode === 'function') {
                onEndpointConnectMode(endpoint);
            }
        });

        //
        // host -> ws server
        //
        socket.on('rempl:host connect', function (connectCallback) {
            socket.on('rempl:pick publisher', function (pickCallback) {
                function startIdentify(endpoint) {
                    endpoint.emitIfPossible('rempl:identify', endpoint.num, (publisherId) => {
                        pickCallback(endpoint.id, publisherId);
                        stopIdentify();
                    });
                }
                function stopIdentify() {
                    onEndpointConnectMode = null;
                    socket.removeListener('disconnect', stopIdentify);
                    socket.removeListener('rempl:cancel publisher pick', stopIdentify);
                    endpoints.forEach((endpoint) => endpoint.emitIfPossible('rempl:stop identify'));
                }

                onEndpointConnectMode = startIdentify;
                lastNum = 1;

                socket.once('disconnect', stopIdentify);
                socket.once('rempl:cancel publisher pick', stopIdentify);

                for (const endpoint of endpoints) {
                    endpoint.num = lastNum++;
                    startIdentify(endpoint);
                }

                endpoints.notifyUpdates();
            });

            socket.on('rempl:get publisher ui', function (id, publisherId, callback) {
                const endpoint = endpoints.get('id', id);

                if (!endpoint || !endpoint.socket) {
                    return callback(
                        '[rempl:get publisher ui] Endpoint (' + id + ') not found or disconnected'
                    );
                }

                endpoint.emit(
                    'rempl:get ui',
                    publisherId,
                    {
                        dev: options.dev,
                        accept: ['script', 'url'],
                    },
                    (...args) => {
                        callback(...args);
                    }
                );
            });

            connectCallback({
                endpoints: endpoints.getList(),
                exclusivePublisher: exclusiveEndpointId
                    ? exclusiveEndpointId + '/' + options.remplExclusivePublisher
                    : null,
            });
        });

        //
        // subscriber -> ws server (endpoint/publisher)
        //
        socket.on('rempl:connect to publisher', function (id, publisherId, callback) {
            const endpoint = endpoints.get('id', id);

            if (!endpoint || !endpoint.socket) {
                return callback(
                    '[rempl:connect to publisher] Endpoint (' + id + ') not found or disconnected'
                );
            }

            endpoint.addSubscriber(socket);
            socket.publisherId = publisherId;
            socket.on('rempl:to publisher', (...args) => {
                endpoint.emit('rempl:to publisher', publisherId, ...args);
            });
            socket.on('disconnect', () => endpoint.removeSubscriber(socket));

            callback();
        });
    });
}
