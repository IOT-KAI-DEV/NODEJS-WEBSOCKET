"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const socket_io_1 = require("socket.io");
const mqtt_1 = __importDefault(require("mqtt"));
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
    password: process.env.MQTT_USERNAME,
    reconnectPeriod: 1000,
    keepalive: 10
});
const topic = 'test';
client.on('connect', () => {
    console.log('Connected');
    client.subscribe([topic], () => {
        console.log(`Subscribe to topic '${topic}' on port ${mqttHost}:${mqttPort}`);
    });
});
client.on("close", () => {
    console.log("connection close");
    client.reconnect();
});
client.on('error', function (error) {
    console.log("Unable to connect: " + error);
    process.exit(1);
});
const app = (0, express_1.default)();
const port = process.env.PORT;
app.get('/', (req, res) => {
    res.send('Express + TypeScript Server with Socket.io Server');
});
const server = app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.APP_MODE === 'production' ? `http://kai.erkasolusi.com` : `http://${process.env.WEBSOCKET_CLIENT_HOST}:${process.env.WEBSOCKET_CLIENT_PORT}`
    }
});
io.on("connection", (socket) => {
    console.log('a client connected, client id : ', socket.id);
});
client.on('message', (topic, payload) => {
    io.emit("forward-ws-message", payload.toString(), topic);
});
//# sourceMappingURL=index.js.map