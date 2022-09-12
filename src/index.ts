import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { Server } from "socket.io";
import mqtt from 'mqtt';
import { argv } from 'process';

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
    origin: process.env.APP_MODE === 'production' ? `http://${process.env.WEBSOCKET_CLIENT_PRODUCTION_HOST}:${process.env.WEBSOCKET_CLIENT_PRODUCTION_PORT}` : `http://${process.env.WEBSOCKET_CLIENT_HOST}:${process.env.WEBSOCKET_CLIENT_PORT}`
  }
});

// please note that we defined outer to perform hositing
let defaulLocomotiveID : string = "default";
let timeStart = new Date();
let lastSec = 0;

// first ly we need to listen to socket connection, everything start from socket, the broker is behind as a callback
io.on("connection", (socket) => {
  console.log('A client connected, socket id : ' + socket.id)
  // thee process inside her is simultaneous, but are blocking mechanisme can be performed heere, since we defineed a outeer state constraint
  
  // after socket get conected please listen to socket event first
  socket.on("locoid-changed", (...args) => {
    console.log("Select performed: need to changedd", ...args)
    const emitedClientEvent = (JSON.parse(args[0])).name
    defaulLocomotiveID = emitedClientEvent;
  })

  // the action is perfomed async, so we can also listen broker suimulatnesously, 
  client.on("message", (topic, payload) => {
    console.log("listen all message coming from broker")
    send("forward-ws-message", payload)
    // const messageObject = JSON.parse(payload.toString());
    // // chek if the broker payload is a single object -> is meaning the broker just send a single message 
    // if(typeof messageObject === 'object' && messageObject.locoid === defaulLocomotiveID){
    //   console.log('forward single message to vue that matched the rule')
      // io.emit("forward-ws-message", payload.toString(), topic)
    // }
    // console.log(typeof messageObject)
  })

  // // mas rian kaya gini cara ngelisten di nodejs dari event emit yang saya kirim di client nya 
  // socket.on("locoid-changed", (...args) => {
  //   console.log(JSON.parse(args[0]))
  // })
});

export const send = (event: string, payload: Buffer) => {
    const payloadObject = JSON.parse(payload.toString());
    let timeRun = new Date(payloadObject.gpsdatetime);
    // @ts-ignore
    let diff = Math.abs(timeStart - timeRun);
    let sec = Math.floor(diff/1000);

    // console.log(sec, lastSec);

    if(sec > lastSec){
      lastSec = sec;
      io.emit("forward-ws-message", payload.toString(), topic);
      console.log("send")
    }
}

// client.on('message', (topic, payload) => {
//     console.log(`got message from topic : ${topic}`)
//     // io.emit("forward-ws-message", payload.toString(), topic)

//     const payloadObject = JSON.parse(payload.toString());
//     let timeRun = new Date(payloadObject.gpsdatetime);
//     // @ts-ignore
//     let diff = Math.abs(timeStart - timeRun);
//     let sec = Math.floor(diff/1000);

//     console.log(sec, lastSec);
//     if(sec > lastSec){
//       lastSec = sec;
//       io.emit("forward-ws-message", payload.toString(), topic)
//     }
// })
