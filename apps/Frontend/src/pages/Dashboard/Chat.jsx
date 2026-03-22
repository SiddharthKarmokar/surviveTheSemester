import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import './chat.css';

const SendIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

const getAvatarBackground = (name) => {
    const colors = [
        'linear-gradient(135deg, #FF9A9E, #FECFEF)',
        'linear-gradient(135deg, #a18cd1, #fbc2eb)',
        'linear-gradient(135deg, #84fab0, #8fd3f4)',
        'linear-gradient(135deg, #fccb90, #d57eeb)',
        'linear-gradient(135deg, #e0c3fc, #8ec5fc)',
    ];
    if (!name) return colors[0];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
};

const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length > 1) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name[0] || '?').toUpperCase();
};

const renderMessageContent = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
        if (part.match(urlRegex)) {
            return (
                <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#8ec5fc', textDecoration: 'underline' }}>
                    {part}
                </a>
            );
        }
        return part;
    });
};

const Chat = () => {
    const currentUser = useSelector((state) => state.user.currentUser);
    const [contacts, setContacts] = useState([]);
    const [activeContactId, setActiveContactId] = useState(null);
    const [inputMessage, setInputMessage] = useState('');
    const [messagesState, setMessagesState] = useState({}); // { friendId: [messages] }
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Auto-scroll inside chat
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messagesState, activeContactId]);

    useEffect(() => {
        if (!currentUser) return;

        // Fetch Friends
        const fetchFriends = async () => {
            try {
                const res = await fetch(`${API_URL}/api/users/friends`, { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    const formatted = data.map(f => ({
                        id: f.id,
                        name: f.name,
                        init: getInitials(f.name),
                        avatarBg: getAvatarBackground(f.name),
                        online: false,
                        lastMsg: '',
                        time: ''
                    }));
                    setContacts(formatted);
                    if (formatted.length > 0) setActiveContactId(formatted[0].id);
                }
            } catch (err) {
                console.error("Error fetching friends", err);
            }
        };

        fetchFriends();

        // Initialize Socket
        socketRef.current = io(SOCKET_URL, {
            query: { userId: currentUser.id }
        });

        const socket = socketRef.current;

        socket.on("connect", () => {
            socket.emit("get_online_friends", {}, (onlineFriendIds) => {
                setContacts(prev => prev.map(c =>
                    onlineFriendIds.includes(c.id) ? { ...c, online: true } : c
                ));
            });
        });

        socket.on("user_status", ({ userId, status }) => {
            setContacts(prev => prev.map(c =>
                c.id === userId ? { ...c, online: status === 'online' } : c
            ));
        });

        socket.on("receive_message", (msg) => {
            const partnerId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
            setMessagesState(prev => ({
                ...prev,
                [partnerId]: [...(prev[partnerId] || []), msg]
            }));

            // update lastMsg preview
            setContacts(prev => prev.map(c =>
                c.id === partnerId ? {
                    ...c,
                    lastMsg: msg.content,
                    time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                } : c
            ));
        });

        socket.on("message_sent", (msg) => {
            setMessagesState(prev => ({
                ...prev,
                [msg.receiverId]: [...(prev[msg.receiverId] || []), msg]
            }));
            setContacts(prev => prev.map(c =>
                c.id === msg.receiverId ? {
                    ...c,
                    lastMsg: msg.content,
                    time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                } : c
            ));
        });

        return () => {
            if (socket) socket.disconnect();
        };
    }, [currentUser]);

    // Fetch history when active contact changes
    useEffect(() => {
        if (!activeContactId || !currentUser) return;

        // if we already have some messages, we probably fetched them, but for real app better to refetch or paginate. 
        // to avoid constant refetching:
        if (messagesState[activeContactId]) return;

        const fetchHistory = async () => {
            try {
                const res = await fetch(`${API_URL}/api/chat/history/${activeContactId}?userId=${currentUser.id}`, {
                    credentials: 'include' // needed if backend relies on cookies for other middlewares
                });
                if (res.ok) {
                    const data = await res.json();
                    setMessagesState(prev => ({
                        ...prev,
                        [activeContactId]: data
                    }));
                }
            } catch (err) {
                console.error("Error fetching chat history", err);
            }
        };

        fetchHistory();
    }, [activeContactId, currentUser]);

    const activeContact = contacts.find(c => c.id === activeContactId);
    const activeMessages = messagesState[activeContactId] || [];

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !activeContactId || !socketRef.current) return;

        socketRef.current.emit("send_message", {
            receiverId: activeContactId,
            content: inputMessage
        });

        setInputMessage('');
    };

    return (
        <div className="chat-container">
            {/* Sidebar List */}
            <div className="chat-sidebar">
                <div className="chat-sidebar-header">
                    <h3>Messages</h3>
                </div>
                <div className="chat-contacts-list">
                    {contacts.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                            You have no friends yet. Add some to start chatting!
                        </div>
                    ) : (
                        contacts.map(contact => (
                            <div
                                key={contact.id}
                                className={`chat-contact-item ${activeContactId === contact.id ? 'active' : ''}`}
                                onClick={() => setActiveContactId(contact.id)}
                            >
                                <div className="contact-avatar" style={{ background: contact.avatarBg }}>
                                    {contact.init}
                                </div>
                                <div className="contact-info">
                                    <div className="contact-header">
                                        <h4 className="contact-name">{contact.name}</h4>
                                        <span className="contact-time">{contact.time}</span>
                                    </div>
                                    <p className="contact-last-msg">{contact.lastMsg || (contact.online ? 'Online' : 'Offline')}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Active Chat Area */}
            {activeContact ? (
                <div className="chat-main">
                    <div className="chat-active-header">
                        <div className="chat-active-avatar" style={{ background: activeContact.avatarBg }}>
                            {activeContact.init}
                        </div>
                        <div>
                            <h4 className="chat-active-name">{activeContact.name}</h4>
                            <p className="chat-active-status">{activeContact.online ? 'Online' : 'Offline'}</p>
                        </div>
                    </div>

                    <div className="chat-messages-area">
                        {activeMessages.map((msg) => {
                            const isMe = msg.senderId === currentUser.id;
                            const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return (
                                <div key={msg.id} className={`message-bubble-wrapper ${isMe ? 'sent' : 'received'}`}>
                                    <div className="message-bubble">{renderMessageContent(msg.content)}</div>
                                    <span className="message-time">{timeStr}</span>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-input-area" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Type a message or send a game link..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                        />
                        <button type="submit" className="chat-send-btn">
                            <SendIcon />
                        </button>
                    </form>
                </div>
            ) : (
                <div className="chat-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: '#888' }}>Select a friend to start chatting</p>
                </div>
            )}
        </div>
    );
};

export default Chat;
