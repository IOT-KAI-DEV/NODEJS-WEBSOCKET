"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const socket_io_1 = require("socket.io");
const mqtt_1 = __importDefault(require("mqtt"));
const rxjs_1 = require("rxjs");
dotenv_1.default.config();
const mqttHost = process.env.MQTT_HOST;
const mqttPort = process.env.MQTT_PORT;
const clientId = process.env.MQTT_CLIENTID;
const connectUrl = `mqtt://${mqttHost}:${mqttPort}`;
const client = mqtt_1.default.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 30000,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    reconnectPeriod: 1000,
    keepalive: 10
});
const topic = process.env.MQTT_TOPIC;
const onConnect = (0, rxjs_1.fromEvent)(client, "connect");
const onSubscribe = (0, rxjs_1.of)(client.subscribe([topic]));
const onError = (0, rxjs_1.fromEvent)(client, "error");
const onMessage = (0, rxjs_1.fromEvent)(client, "message");
onConnect.subscribe(() => {
    console.log("connected to broker");
});
onSubscribe.subscribe((observer) => {
    console.log("Subcribe to topic", topic, connectUrl);
});
onError.subscribe((observer) => {
    console.log("Unable to connect", observer);
});
const app = (0, express_1.default)();
const port = process.env.APP_PORT;
app.get('/', (req, res) => {
    res.send('Express + TypeScript Server with Socket.io Server');
});
const server = app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.APP_MODE === 'production' ?
            `http://${process.env.WEBSOCKET_CLIENT_PRODUCTION_HOST}:${process.env.WEBSOCKET_CLIENT_PRODUCTION_PORT}` :
            `http://${process.env.WEBSOCKET_CLIENT_HOST}:${process.env.WEBSOCKET_CLIENT_PORT}`
    }
});
let locoId = undefined;
const webSocketSource = (0, rxjs_1.of)(io);
webSocketSource.subscribe((socket) => {
    const WsConnection = (0, rxjs_1.of)(socket);
    WsConnection.subscribe((client) => {
        const onWsClientConnected = (0, rxjs_1.fromEvent)(client, "connection");
        const onWsClientDisconnected = (0, rxjs_1.fromEvent)(client, "disconnected");
        onWsClientConnected.subscribe((o) => {
            const socket = o;
            const onLocoChanged = (0, rxjs_1.fromEvent)(socket, "locoid-changed");
            console.log(`Client ID : ${o.id} connected`);
            // jalankan observaable keyika loco changed
            onLocoChanged.subscribe((...args) => {
                const emitedSelectionChangeId = (JSON.parse(args[0])).value;
                locoId = emitedSelectionChangeId;
            });
            // @ts-ignore jalankan observable yang match dengan filter
            onMessage.pipe((0, rxjs_1.filter)(([topic, payload]) => locoId === (JSON.parse(payload.toString())).locoid)).subscribe(([topic, payload]) => {
                io.emit("forward-ws-message", payload.toString(), topic);
            });
        });
        onWsClientDisconnected.subscribe((o) => {
            console.log(`Client ID : ${o.id} disconnected`);
        });
    });
});
//# sourceMappingURL=index.js.map