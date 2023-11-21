import { Socket } from 'socket.io';
import { EndpointList } from './EndpointList';

type Info = {
    sessionId: null;
    title: string;
    location: string;
    pid: number;
    type: string;
    publishers: Array<any>; // FIXME: any
};
type InfoKey = 'sessionId' | 'title' | 'location' | 'pid' | 'type' | 'publishers';

const TTL = 15 * 60 * 1000; // 15 min offline -> remove from endpoint list
const INFO_DEFAULTS: Info = {
    sessionId: null,
    title: '[no title]',
    location: '[unknown]',
    pid: 0,
    type: '',
    publishers: []
};

export class Endpoint {
    // sessionId = null;
    offlineTime: number | null = null;
    ttlTimer: NodeJS.Timeout | null = null;

    list: EndpointList;
    id: string;
    num: number;
    room: string;
    socket: Socket | null;
    subscribers: Socket[];
    info: Info = { ...INFO_DEFAULTS };

    constructor(list: EndpointList, id: string, socket: Socket, data: Partial<Info>) {
        // this.sessionId = null;
        this.offlineTime = null;
        this.ttlTimer = null;

        this.list = list;
        this.id = id;
        this.num = 0;
        this.room = 'session-' + id;
        this.socket = socket;
        this.subscribers = [];

        this.update(data);

        this.list.add(this);
    }

    update(data: Partial<Info>) {
        for (const key of Object.keys(INFO_DEFAULTS) as InfoKey[]) {
            if (Object.hasOwn(data, key)) {
                // @ts-ignore FIXME
                this.info[key] = data[key];
            }
        }
    }
    getData() {
        return {
            id: this.id,
            sessionId: this.info.sessionId,
            type: this.info.type,
            title: this.info.title,
            pid: this.info.pid,
            location: this.info.location,
            online: Boolean(this.socket),
            publishers: this.info.publishers || [],
            num: this.num
        };
    }

    setOnline(socket: Socket) {
        if (!this.socket) {
            this.ttlTimer && clearTimeout(this.ttlTimer);
            this.offlineTime = null;
            this.socket = socket;
            this.list.notifyUpdates();
        }
    }
    setOffline() {
        if (this.socket) {
            this.offlineTime = Date.now();
            this.socket = null;
            this.list.notifyUpdates();
            this.ttlTimer = setTimeout(() => {
                if (
                    !this.socket &&
                    this.offlineTime !== null &&
                    Date.now() - this.offlineTime > TTL
                ) {
                    this.list.remove(this);
                }
            }, TTL);
        }
    }

    addSubscriber(subscriber: Socket) {
        this.subscribers.push(subscriber);
        this.emitIfPossible('rempl:subscriber count changed', this.subscribers.length);
    }
    removeSubscriber(subscriber: Socket) {
        const index = this.subscribers.indexOf(subscriber);

        if (index !== -1) {
            this.subscribers.splice(index, 1);
            this.emitIfPossible('rempl:subscriber count changed', this.subscribers.length);
        }
    }

    emitIfPossible(...args: any[]) {
        if (this.socket) {
            this.emit(...args);
        }
    }
    emit(...args: any[]) {
        if (!this.socket) {
            return console.warn('[rempl] Endpoint ' + this.id + ' is offline');
        }

        // console.log('socket', 'send to ' + this.id + ' ' + JSON.stringify(arguments), true);
        // @ts-ignore FIXME
        this.socket.emit(...args);
    }
}
