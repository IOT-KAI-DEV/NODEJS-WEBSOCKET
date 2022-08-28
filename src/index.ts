import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from './type';
import mqtt from 'mqtt';
import { Queue } from './queue';
dotenv.config();

const mqttHost = process.env.MQTT_HOST
const mqttPort = process.env.MQTT_PORT
const clientId = process.env.MQTT_CLIENTID
// const clientId = `mqttjs_${Math.random().toString(16).slice(3)}`

const connectUrl = `mqtt://${mqttHost}:${mqttPort}`


  
const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 30000,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_USERNAME,
  reconnectPeriod: 1000,
  keepalive: 10
})

const topic = 'test';

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
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173"
  }
});

io.on("connection", (socket) => {
  console.log('a client connected, client id : ', socket.id);
});

client.on('message', (topic, payload) => {
    console.log(`Got a new message from topi : ${topic}, ${mqttHost}:${mqttPort}`)
    io.emit("forward-ws-message", payload.toString(), topic)
})