import { prisma } from '../prisma/prisma.js';

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

const isValidObjectId = (value) => typeof value === 'string' && OBJECT_ID_REGEX.test(value);
const toSafeArray = (value) => (Array.isArray(value) ? value : []);

// Send Request
export const sendRequest = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId } = req.body;

        if (!isValidObjectId(senderId) || !isValidObjectId(receiverId) || senderId === receiverId) {
            return res.status(400).json({ message: "Invalid receiver" });
        }

        const receiver = await prisma.users.findUnique({
            where: { id: receiverId },
            select: { id: true, name: true, friendlist: true, receivedRequests: true }
        });
        if (!receiver) {
            return res.status(404).json({ message: "User not found" });
        }

        const receiverRequests = toSafeArray(receiver.receivedRequests);
        const receiverFriends = toSafeArray(receiver.friendlist);

        if (receiverRequests.includes(senderId) || receiverFriends.includes(senderId)) {
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

        const sender = await prisma.users.findUnique({
            where: { id: senderId },
            select: { name: true }
        });

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

        if (!isValidObjectId(receiverId) || !isValidObjectId(senderId)) {
            return res.status(400).json({ message: "Invalid sender" });
        }

        if (notificationId && !isValidObjectId(notificationId)) {
            return res.status(400).json({ message: "Invalid notification" });
        }

        if (!senderId) {
            return res.status(400).json({ message: "Invalid sender" });
        }

        const receiver = await prisma.users.findUnique({
            where: { id: receiverId },
            select: { name: true, receivedRequests: true }
        });
        const receiverRequests = toSafeArray(receiver?.receivedRequests);
        if (!receiver || !receiverRequests.includes(senderId)) {
            return res.status(400).json({ message: "No such connection request" });
        }

        await prisma.users.update({
            where: { id: receiverId },
            data: {
                receivedRequests: receiverRequests.filter(id => id !== senderId),
                friendlist: { push: senderId }
            }
        });

        const sender = await prisma.users.findUnique({
            where: { id: senderId },
            select: { sentRequests: true, name: true }
        });
        if (sender) {
            const senderRequests = toSafeArray(sender.sentRequests);
            await prisma.users.update({
                where: { id: senderId },
                data: {
                    sentRequests: senderRequests.filter(id => id !== receiverId),
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

        if (!isValidObjectId(receiverId) || !isValidObjectId(senderId)) {
            return res.status(400).json({ message: "Invalid sender" });
        }

        if (notificationId && !isValidObjectId(notificationId)) {
            return res.status(400).json({ message: "Invalid notification" });
        }

        const receiver = await prisma.users.findUnique({
            where: { id: receiverId },
            select: { receivedRequests: true }
        });
        const receiverRequests = toSafeArray(receiver?.receivedRequests);
        
        await prisma.users.update({
            where: { id: receiverId },
            data: {
                receivedRequests: receiverRequests.filter(id => id !== senderId),
            }
        });

        const sender = await prisma.users.findUnique({
            where: { id: senderId },
            select: { sentRequests: true }
        });
        if (sender) {
            const senderRequests = toSafeArray(sender.sentRequests);
            await prisma.users.update({
                where: { id: senderId },
                data: {
                    sentRequests: senderRequests.filter(id => id !== receiverId),
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

        res.status(200).json({ notifications: populatedNotifications });
    } catch (error) {
        console.error("getNotifications Error:", error);
        res.status(500).json({ message: "An error occurred while fetching notifications" });
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
