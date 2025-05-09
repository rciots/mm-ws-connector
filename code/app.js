
const fs = require('fs');
const serverCACert = 'certs/serverCA.crt';
const clientKey = 'certs/client.key';
const clientCert = 'certs/client.crt';
const { Server } = require("socket.io");
const port = process.env.PORT || 8080;
const wsmanager = process.env.WS_MANAGER || "socket.rciots.com";
const socketcli = require("socket.io-client");
const ioclient = new socketcli.connect("https://" + wsmanager , {
    ca: fs.readFileSync(serverCACert, 'utf-8'),
    key: fs.readFileSync(clientKey, 'utf-8'),
    cert: fs.readFileSync(clientCert, 'utf-8'),
    rejectUnauthorized: true,
    reconnection: true,
    reconnectionDelay: 500
  });
ioclient.on('connect_error', (error) => {
    console.log("connect_error: " + error);
    console.log(error.description);

    // some additional context, for example the XMLHttpRequest object
    console.log(error.context);
});
ioclient.on('error', (error) => {
    console.log("error: " + error);
});
  
ioclient.on("connect", () => {
    console.log("connected to wsmanager");
});


let socketCam, socketMKS, socketArduino = "";

ioclient.on("movement", (movement) => {
    console.log("movement: " + movement);
    if (socketMKS != "") {
        socketMKS.emit("movement", movement);
    }
});

ioclient.on("led", (data) => {
    console.log("led: " + data);
    if (socketArduino != "") {
        socketArduino.emit("led", data);
    }
});

ioclient.on("phase", (data) => {
    console.log("phase: " + data);
    if (socketMKS != "") {
        socketMKS.emit("phase", data);
    }
    if (socketArduino != "") {
        socketArduino.emit("phase", data);
    }
});

ioclient.on("endgame", (data) => {
    console.log("endgame: " + data);
    if (socketMKS != "") {
        socketMKS.emit("endgame", data);
    }
});

const io = new Server(port, { /* options */ });


io.on('connection', (socket) => {
    console.log(socket.handshake.headers);
    if (socket.handshake.headers.origin == "cam") {
        socketCam = socket;
        console.log('cam connected');
        socketCam.on('disconnect', () => {
            socketCam = "";
            console.log('cam disconnected');
        });
        socketCam.on("video", (data) => {
            ioclient.emit("video", data);
        }
        );
    } else if (socket.handshake.headers.origin == "controller-arduino") {
        socketArduino = socket;
        console.log('arduino connected');
        socketArduino.on('selectedColors', (data) => {
            ioclient.emit('selectedColors', data);
        });
        socketArduino.on('winner', (data) => {
            ioclient.emit('winner', data);
        });
        socketArduino.on('disconnect', () => {
            socketArduino = "";
            console.log('arduino disconnected');
        });
    } else if (socket.handshake.headers.origin == "controller-steppers") {
        socketMKS = socket;
        console.log('mks connected');
        socketMKS.on('disconnect', () => {
            socketMKS = "";
            console.log('mks disconnected');
        });
    }
});
