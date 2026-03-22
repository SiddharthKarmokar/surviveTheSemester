import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Send Request
export const sendRequest = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId } = req.body;

        if (!receiverId || senderId === receiverId) {
            return res.status(400).json({ message: "Invalid receiver" });
        }

        const receiver = await prisma.users.findUnique({ where: { id: receiverId } });
        if (!receiver) {
            return res.status(404).json({ message: "User not found" });
        }

        if (receiver.receivedRequests.includes(senderId) || receiver.friendlist.includes(senderId)) {
            return res.status(400).json({ message: "Request already sent or already friends" });
        }

        await prisma.users.update({
            where: { id: senderId },
            data: { sentRequests: { push: receiverId } }
        });

        await prisma.users.update({
            where: { id: receiverId },
            data: { receivedRequests: { push: senderId } }
        });

        const sender = await prisma.users.findUnique({ where: { id: senderId } });

        await prisma.notification.create({
            data: {
                userId: receiverId,
                type: 'request',
                message: `${sender.name} sent you a connection request.`,
                senderId: senderId
            }
        });

        res.status(200).json({ message: "Request sent successfully" });
    } catch (error) {
        console.error("sendRequest Error:", error);
        res.status(500).json({ message: "An error occurred while sending request" });
    }
};

// Accept Request
export const acceptRequest = async (req, res) => {
    try {
        const receiverId = req.user.id;
        const { senderId, notificationId } = req.body;

        if (!senderId) {
            return res.status(400).json({ message: "Invalid sender" });
        }

        const receiver = await prisma.users.findUnique({ where: { id: receiverId } });
        if (!receiver.receivedRequests.includes(senderId)) {
            return res.status(400).json({ message: "No such connection request" });
        }

        await prisma.users.update({
            where: { id: receiverId },
            data: {
                receivedRequests: receiver.receivedRequests.filter(id => id !== senderId),
                friendlist: { push: senderId }
            }
        });

        const sender = await prisma.users.findUnique({ where: { id: senderId } });
        if (sender) {
            await prisma.users.update({
                where: { id: senderId },
                data: {
                    sentRequests: sender.sentRequests.filter(id => id !== receiverId),
                    friendlist: { push: receiverId }
                }
            });
        }

        if (notificationId) {
            await prisma.notification.update({
                where: { id: notificationId },
                data: { isRead: true }
            });
        } else {
             await prisma.notification.updateMany({
                 where: { userId: receiverId, senderId: senderId, type: 'request', isRead: false },
                 data: { isRead: true }
             });
        }

        await prisma.notification.create({
            data: {
                userId: senderId,
                type: 'accepted',
                message: `${receiver.name} accepted your connection request.`,
                senderId: receiverId
            }
        });

        res.status(200).json({ message: "Request accepted" });
    } catch (error) {
        console.error("acceptRequest Error:", error);
        res.status(500).json({ message: "An error occurred while accepting request" });
    }
};

// Decline Request
export const declineRequest = async (req, res) => {
    try {
        const receiverId = req.user.id;
        const { senderId, notificationId } = req.body;

        const receiver = await prisma.users.findUnique({ where: { id: receiverId } });
        
        await prisma.users.update({
            where: { id: receiverId },
            data: {
                receivedRequests: receiver.receivedRequests.filter(id => id !== senderId),
            }
        });

        const sender = await prisma.users.findUnique({ where: { id: senderId } });
        if (sender) {
            await prisma.users.update({
                where: { id: senderId },
                data: {
                    sentRequests: sender.sentRequests.filter(id => id !== receiverId),
                }
            });
        }

        if (notificationId) {
            await prisma.notification.update({
                where: { id: notificationId },
                data: { isRead: true }
            });
        } else {
             await prisma.notification.updateMany({
                 where: { userId: receiverId, senderId: senderId, type: 'request', isRead: false },
                 data: { isRead: true }
             });
        }

        res.status(200).json({ message: "Request declined" });
    } catch (error) {
        console.error("declineRequest Error:", error);
        res.status(500).json({ message: "An error occurred while declining request" });
    }
};

// Get Notifications
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const notifications = await prisma.notification.findMany({
            where: { userId: userId },
            orderBy: { createdAt: 'desc' }
        });
        
        const populatedNotifications = await Promise.all(notifications.map(async (notif) => {
           let sender = null;
           if (notif.senderId) {
               sender = await prisma.users.findUnique({ where: { id: notif.senderId }, select: { name: true, id: true } });
           }
           return {
               ...notif,
               senderName: sender ? sender.name : 'System',
           };
        }));

        return res.status(200).json({ notifications: populatedNotifications });
    } catch (error) {
        console.error("getNotifications Error:", error);
        if (!res.headersSent) {
            return res.status(500).json({ message: "An error occurred while fetching notifications" });
        }
    }
};

export const markNotificationsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await prisma.notification.updateMany({
            where: { userId: userId, isRead: false },
            data: { isRead: true }
        });
        res.status(200).json({ message: "Notifications marked as read" });
    } catch (error) {
        res.status(500).json({ message: "An error occurred while marking notifications as read" });
    }
};
