const Member = require('../models/Member');
const Message = require('../models/Message');

const userCache = new Map();

async function getAdminId(userId, role) {
    if (role === "admin") return userId;
    if (userCache.has(userId)) {
        return userCache.get(userId);
    }
    const member = await Member.findById(userId).lean();
    if (!member || !member.ownedBy) return null;
    userCache.set(userId, member.ownedBy);
    setTimeout(() => userCache.delete(userId), 5 * 60 * 1000);
    return member.ownedBy;
}

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);
        socket.on("joinRoom", async ({ userId, role }) => {
            if (!userId || !role) {
                return socket.emit("error", "Invalid data...!");
            }
            try {
                const adminId = await getAdminId(userId, role);
                if (!adminId) return socket.emit("error", "User not found...!");
                const roomId = `admin_${adminId}`;
                socket.join(roomId);
                const previousMessages = await Message.find({ roomId }).sort({ timestamp: -1 }).limit(50).lean();
                socket.emit("previousMessages", previousMessages.reverse());
            } catch (error) {
                console.log("joinRoom error:", error);
                socket.emit("error", "Failed to join room...!");
            }
        });
        socket.on("sendMessage", async ({ userId, role, message }) => {
            try {
                if (!userId || !role || !message) {
                    return socket.emit("error", "Invalid data...!");
                }
                if (message.trim() === "") {
                    return socket.emit("error", "Message cannot be empty...!");
                }
                if (message.length > 200) {
                    return socket.emit("error", "Message too long...!");
                }
                const adminId = await getAdminId(userId, role);
                if (!adminId) return socket.emit("error", "User not found...!");
                const roomId = `admin_${adminId}`;
                const newMessage = await Message.create({ roomId, senderId: userId, senderRole: role, message });
                io.to(roomId).emit("receiveMessage", newMessage);
            } catch (error) {
                console.log("sendMessage error:", error);
                socket.emit("error", "Failed to send message...!");
            }
        });
        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
};