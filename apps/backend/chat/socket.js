import { Server } from "socket.io";
import { prisma } from "../prisma/prisma.js";

// Keep track of connected users: userId -> Set of socketIds
const onlineUsers = new Map();

export default function initChatSocket() {
  const io = new Server(3001, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    // Expected to receive userId upon connection
    const userId = socket.handshake.query.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    // Add to online users
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Broadcast to friends that user is online
    // Wait, first we need to get user's friends to broadcast to them
    prisma.users.findUnique({ where: { id: userId }, select: { friendlist: true } })
      .then(user => {
        if (user && user.friendlist) {
          user.friendlist.forEach(friendId => {
            const friendSockets = onlineUsers.get(friendId);
            if (friendSockets) {
              // emit to all friend's connected sockets
              friendSockets.forEach(sockId => {
                io.to(sockId).emit("user_status", { userId, status: "online" });
              });
            }
          });
        }
      })
      .catch(err => console.error("Error fetching friends for online status", err));

    socket.on("get_online_friends", async (data, callback) => {
      // Returns a list of friendIds who are currently online
      try {
        const user = await prisma.users.findUnique({ where: { id: userId }, select: { friendlist: true } });
        if (!user || !user.friendlist) return callback([]);

        const onlineFriends = user.friendlist.filter(fid => {
          const sockets = onlineUsers.get(fid);
          return sockets && sockets.size > 0;
        });
        callback(onlineFriends);
      } catch (err) {
        callback([]);
      }
    });

    socket.on("send_message", async (data) => {
      const { receiverId, content } = data;
      if (!receiverId || !content) return;

      try {
        // Save to database
        const message = await prisma.message.create({
          data: {
            senderId: userId,
            receiverId: receiverId,
            content: content
          }
        });

        // Emit to receiver if online
        const receiverSockets = onlineUsers.get(receiverId);
        if (receiverSockets) {
          receiverSockets.forEach(sockId => {
            io.to(sockId).emit("receive_message", message);
          });
        }

        // Also emit back to sender (other tabs)
        const senderSockets = onlineUsers.get(userId);
        if (senderSockets) {
          senderSockets.forEach(sockId => {
            if (sockId !== socket.id) {
              io.to(sockId).emit("receive_message", message);
            }
          });
        }

        // acknowledge back to the sender socket that message was saved
        socket.emit("message_sent", message);

      } catch (err) {
        console.error("Error saving message:", err);
      }
    });

    socket.on("disconnect", () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);

          // Broadcast offline to friends
          prisma.users.findUnique({ where: { id: userId }, select: { friendlist: true } })
            .then(user => {
              if (user && user.friendlist) {
                user.friendlist.forEach(friendId => {
                  const friendSockets = onlineUsers.get(friendId);
                  if (friendSockets) {
                    friendSockets.forEach(sockId => {
                      io.to(sockId).emit("user_status", { userId, status: "offline" });
                    });
                  }
                });
              }
            })
            .catch(err => console.error("Error on disconnect friends fetch", err));
        }
      }
    });
  });

  return io;
}
