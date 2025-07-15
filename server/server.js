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

io.on("connection", (socket) => {
  console.log("Client connected");

  // Existing event: broadcasting cue updates
  socket.on("cue-update", (cue) => {
    console.log("Broadcasting cue:", cue);
    io.emit("cue-update", cue);
  });

  // ✅ New: play current line manually
  socket.on("play-current", (data: { cue: number }) => {
    console.log("Admin requested play of current cue:", data.cue);
    io.emit("play-current", data); // send to all clients
  });

  // ✅ New: stop playback on all clients
  socket.on("stop-playback", () => {
    console.log("Admin requested STOP playback");
    io.emit("stop-playback");
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
