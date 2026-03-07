import React, { useState } from 'react';
import './chat.css';

const SendIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);

const dummyContacts = [
    { id: 1, name: 'Alex Johnson', lastMsg: 'Are we doing the match tonight?', time: '10:45 AM', avatarBg: 'linear-gradient(135deg, #f12711, #f5af19)', init: 'AJ', online: true },
    { id: 2, name: 'guest4991', lastMsg: 'GG man, that was close', time: 'Yesterday', avatarBg: 'linear-gradient(135deg, #11998e, #38ef7d)', init: 'G', online: false },
    { id: 3, name: 'Sam Rivera', lastMsg: 'Send me the link when ready.', time: 'Monday', avatarBg: 'linear-gradient(135deg, #8E2DE2, #4A00E0)', init: 'SR', online: true },
    { id: 4, name: 'Charlie Pal', lastMsg: 'I beat your high score 😎', time: 'Jan 12', avatarBg: '#555', init: 'CP', online: false },
];

const dummyMessages = {
    1: [
        { id: 101, text: 'Hey Anil!', sender: 'them', time: '10:30 AM' },
        { id: 102, text: 'Hey Alex, what\'s up?', sender: 'me', time: '10:35 AM' },
        { id: 103, text: 'Are we doing the match tonight?', sender: 'them', time: '10:45 AM' },
    ],
    2: [
        { id: 201, text: 'Wow you are fast at 15 puzzle', sender: 'them', time: 'Yesterday, 4:00 PM' },
        { id: 202, text: 'Thanks! Lots of practice haha', sender: 'me', time: 'Yesterday, 4:15 PM' },
        { id: 203, text: 'GG man, that was close', sender: 'them', time: 'Yesterday, 4:20 PM' }
    ],
    3: [
        { id: 301, text: 'Let\'s play group match with Bob', sender: 'them', time: 'Monday, 1:00 PM' },
        { id: 302, text: 'Sure, I will invite', sender: 'me', time: 'Monday, 1:05 PM' },
        { id: 303, text: 'Send me the link when ready.', sender: 'them', time: 'Monday, 1:15 PM' }
    ],
    4: [
        { id: 401, text: 'Look at the leaderboard', sender: 'them', time: 'Jan 12, 9:00 AM' },
        { id: 402, text: 'I beat your high score 😎', sender: 'them', time: 'Jan 12, 9:02 AM' }
    ]
};

const Chat = () => {
    const [activeContactId, setActiveContactId] = useState(1);
    const [inputMessage, setInputMessage] = useState('');
    
    // We would typically hold messages in state, simulating it here
    const [messagesState, setMessagesState] = useState(dummyMessages);

    const activeContact = dummyContacts.find(c => c.id === activeContactId);
    const activeMessages = messagesState[activeContactId] || [];

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const newMessage = {
            id: Date.now(),
            text: inputMessage,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessagesState(prev => ({
            ...prev,
            [activeContactId]: [...(prev[activeContactId] || []), newMessage]
        }));
        
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
                    {dummyContacts.map(contact => (
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
                                <p className="contact-last-msg">{contact.lastMsg}</p>
                            </div>
                        </div>
                    ))}
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
                        {activeMessages.map((msg) => (
                            <div key={msg.id} className={`message-bubble-wrapper ${msg.sender === 'me' ? 'sent' : 'received'}`}>
                                <div className="message-bubble">{msg.text}</div>
                                <span className="message-time">{msg.time}</span>
                            </div>
                        ))}
                    </div>

                    <form className="chat-input-area" onSubmit={handleSendMessage}>
                        <input 
                            type="text" 
                            className="chat-input" 
                            placeholder="Type a message..." 
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                        />
                        <button type="submit" className="chat-send-btn">
                            <SendIcon />
                        </button>
                    </form>
                </div>
            ) : null}
        </div>
    );
};

export default Chat;
