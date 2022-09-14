import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { Server, Socket } from "socket.io";
import mqtt from 'mqtt';
import { argv } from 'process';
import { from, fromEvent, map, Observable, of, Subscriber, pipe, filter } from 'rxjs';
import { Console } from 'console';
import { takeWhile } from 'rxjs-compat/operator/takeWhile';

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

const topic = process.env.MQTT_TOPIC;

const onConnect = fromEvent(client, "connect");
const onSubscribe = of(client.subscribe([topic]));
const onError = fromEvent(client, "error");
const onMessage = fromEvent(client, "message");

onConnect.subscribe(() => {
  console.log("connected to broker")
})

onSubscribe.subscribe((observer) => {
  console.log("Subcribe to topic", topic, connectUrl);
})

onError.subscribe((observer) => {
  console.log("Unable to connect", observer)
})

const app: Express = express();
const port = process.env.APP_PORT;

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server with Socket.io Server');
});

const server = app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

const io = new Server(server, {
  cors: {
    origin: process.env.APP_MODE === 'production' ? 
    `http://${process.env.WEBSOCKET_CLIENT_PRODUCTION_HOST}:${process.env.WEBSOCKET_CLIENT_PRODUCTION_PORT}` : 
    `http://${process.env.WEBSOCKET_CLIENT_HOST}:${process.env.WEBSOCKET_CLIENT_PORT}`
  }
});

let locoId: any = undefined;

const webSocketSource = of(io);
webSocketSource.subscribe((socket) => {
  const WsConnection = of(socket);
  WsConnection.subscribe((client) => {
    const onWsClientConnected     = fromEvent(client, "connection");
    const onWsClientDisconnected  = fromEvent(client, "disconnected");

    onWsClientConnected.subscribe((o) => {
      const socket = (o as Socket);
      const onLocoChanged = fromEvent(socket, "locoid-changed")

      console.log(`Client ID : ${(o as Socket).id} connected`);

      // jalankan observaable keyika loco changed
      onLocoChanged.subscribe((...args) => {
        const emitedSelectionChangeId = (JSON.parse((args[0] as string))).value;
        locoId = emitedSelectionChangeId;
      })

      // @ts-ignore jalankan observable yang match dengan filter
      onMessage.pipe(filter(([topic, payload]) => locoId === (JSON.parse(payload.toString())).locoid)).subscribe(([topic, payload]) => {
        io.emit("forward-ws-message", payload.toString(), topic)
      })
    })

    onWsClientDisconnected.subscribe((o) => {
      console.log(`Client ID : ${(o as Socket).id} disconnected`)
    })

  })
})
