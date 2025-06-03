import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { io } from 'socket.io-client';
import { FiSend } from 'react-icons/fi';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatArea from '../components/Chat/ChatArea';
import { useChat } from '../contexts/ChatContext';

const API_URL = 'http://localhost:5001';

const Chat = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomDetails, setRoomDetails] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef();

  const { 
    rooms = [], 
    activeRoom, 
    setActiveRoom, 
    onlineUsers,
    createRoom 
  } = useChat();

  useEffect(() => {
    // Connect to WebSocket
    socketRef.current = io(API_URL);

    // Join room
    socketRef.current.emit('join_room', roomId);

    // Listen for messages
    socketRef.current.on('receive_message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Fetch room details and message history
    fetchRoomDetails();
    fetchMessages();

    return () => {
      socketRef.current.emit('leave_room', roomId);
      socketRef.current.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchRoomDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${roomId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch room details');
      }
      const data = await response.json();
      setRoomDetails(data);
    } catch (error) {
      console.error('Error fetching room details:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${roomId}/messages`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      roomId,
      userId: user.uid,
      userName: user.displayName || user.email,
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    try {
      // Send to backend
      const response = await fetch(`${API_URL}/api/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Emit through socket
      socketRef.current.emit('send_message', messageData);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleRoomSelect = (room) => {
    setActiveRoom(room);
  };

  const handleCreateRoom = () => {
    // This will be implemented when we create the room creation modal
    createRoom({
      name: 'New Room',
      type: 'private',
      description: 'A new chat room'
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        rooms={rooms}
        activeRoom={activeRoom}
        onRoomSelect={handleRoomSelect}
        onCreateRoom={handleCreateRoom}
        onlineUsers={onlineUsers}
      />
      <div className="flex flex-col h-screen bg-gray-900">
        {/* Chat Header */}
        <div className="bg-gray-800 p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            #{roomDetails?.name || 'Loading...'}
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.userId === user.uid ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.userId === user.uid
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {message.userId === user.uid ? 'You' : message.userName}
                    </span>
                    <span className="text-xs opacity-50">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p>{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FiSend /> Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat; 