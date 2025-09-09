import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 🔢 Client-Zähler
let connectedClients = 0;

io.on("connection", (socket) => {
  connectedClients++;
  console.log(`Client connected. Aktuell verbunden: ${connectedClients}`);

  // Existing event: broadcasting cue updates
  socket.on("cue-update", (cue) => {
    console.log("Broadcasting cue:", cue);
    io.emit("cue-update", cue);
  });

  // ✅ New: play current line manually
  socket.on("play-current", (cue) => {
    console.log("Admin requested play of current cue:", cue);
    io.emit("play-current", cue); // send to all clients
  });

  // ✅ New: stop playback on all clients
  socket.on("stop-playback", () => {
    console.log("Admin requested STOP playback");
    io.emit("stop-playback");
  });

  socket.on("disconnect", () => {
    connectedClients--;
    console.log(`Client disconnected. Aktuell verbunden: ${connectedClients}`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
