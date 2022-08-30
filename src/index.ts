import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { Server } from "socket.io";
import mqtt from 'mqtt';

dotenv.config();

const mqttHost = process.env.MQTT_HOST
const mqttPort = process.env.MQTT_PORT
const clientId = process.env.MQTT_CLIENTID

const connectUrl = `mqtt://${mqttHost}:${mqttPort}`


  
const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 30000,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  reconnectPeriod: 1000,
  keepalive: 10
})

const topic = 'digitalisasi/fromclient';

client.on('connect', () => {
  console.log('Connected')
  client.subscribe([topic], () => {
    console.log(`Subscribe to topic '${topic}' on port ${mqttHost}:${mqttPort}`)
  })
})

client.on("close", () => {
  console.log("connection close")
  client.reconnect();
})

client.on('error', function(error) {
  console.log("Unable to connect: " + error);
  process.exit(1);
});


const app: Express = express();
const port = process.env.PORT;

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server with Socket.io Server');
});

const server = app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

const io = new Server(server, {
  cors: {
    origin: process.env.APP_MODE === 'production' ? `http://kai.erkasolusi.com` : `http://${process.env.WEBSOCKET_CLIENT_HOST}:${process.env.WEBSOCKET_CLIENT_PORT}`
  }
});

io.on("connection", (socket) => {
  console.log('a client connected, client id : ', socket.id);
});

client.on('message', (topic, payload) => {
    console.log(`got message from topic : ${topic}`)
    io.emit("forward-ws-message", payload.toString(), topic)
})
