const express = require("express");

const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const documentRoutes = require(
  "./routes/documentRoutes"
);

const authRoutes = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");

const pool = require("./db");

const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

app.use("/documents", documentRoutes);
app.use("/workspace", workspaceRoutes);
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("CollabSpace API running 🚀");
});

const PORT = 3001;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const roomUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // JOIN ROOM
  socket.on("join_room", (roomId) => {
    socket.join(roomId);

    console.log(
      `Socket ${socket.id} joined room ${roomId}`
    );

    if (!roomUsers[roomId]) {
      roomUsers[roomId] = [];
    }

    roomUsers[roomId].push(socket.id);

    io.to(roomId).emit(
      "room_users",
      roomUsers[roomId].length
    );
  });

  // CHAT MESSAGE
  socket.on("send_message", (data) => {
    console.log("Message:", data);

    io.to(data.room).emit(
      "receive_message",
      data
    );
  });

  // CURSOR MOVEMENT
  socket.on("cursor_move", (data) => {
    socket.to(data.room).emit(
      "receive_cursor",
      {
        socketId: socket.id,
        position: data.position,
      }
    );
  });

  // LOAD DOCUMENT
  socket.on("get_document", async (room) => {
    try {
      const result = await pool.query(
        "SELECT * FROM documents WHERE id = $1",
        [room]
      );

      if (result.rows.length > 0) {
        socket.emit(
          "load_document",
          result.rows[0].content
        );
      }

    } catch (err) {
      console.error(err);
    }
  });

  // SAVE + SYNC DOCUMENT
  socket.on("document_change", async (data) => {
    const { room, content } = data;

    try {
      await pool.query(
        `
        UPDATE documents
        SET content = $1
        WHERE id = $2
        `,
        [content, room]
      );

      socket.to(room).emit(
        "receive_document",
        content
      );

    } catch (err) {
      console.error(err);
    }
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log("User disconnected");

    for (const roomId in roomUsers) {
      roomUsers[roomId] =
        roomUsers[roomId].filter(
          (id) => id !== socket.id
        );

      io.to(roomId).emit(
        "room_users",
        roomUsers[roomId].length
      );
    }
  });
});

server.listen(PORT, () => {
  console.log(
    "Server running on port " + PORT
  );
});