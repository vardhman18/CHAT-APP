import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Settings, Info, Image, Paperclip, Send, 
  X, Plus, UserPlus, Crown, MoreVertical 
} from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import MessageBubble from '../shared/MessageBubble';
import RoomInfo from './RoomInfo';
import MessageInput from '../shared/MessageInput';

const Room = ({ room }) => {
  const { user } = useAuth();
  const { 
    messages, 
    sendMessage, 
    updateMessage,
    addReaction,
    typingUsers,
    socket,
    onlineUsers
  } = useChat();
  
  const [showInfo, setShowInfo] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const messagesEndRef = useRef(null);

  const isAdmin = room.adminId === user.id;

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content) => {
    if (!content.trim() && selectedFiles.length === 0) return;

    try {
      const messageData = {
        roomId: room.id,
        content: content.trim(),
        attachments: selectedFiles,
        replyToId: replyTo?.id
      };

      await sendMessage(messageData);
      setSelectedFiles([]);
      setReplyTo(null);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFileSelect = (files) => {
    // Filter files by size and type
    const validFiles = Array.from(files).filter(file => {
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      const isValidType = /^(image|audio|video|application)\/(jpeg|png|gif|mp3|mp4|pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)$/.test(file.type);
      return isValidSize && isValidType;
    });

    if (validFiles.length + selectedFiles.length > 5) {
      alert('Maximum 5 files per message');
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await addReaction(messageId, emoji);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Room Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={room.avatar} 
                alt={room.name} 
                className="w-10 h-10 rounded-full"
              />
              {room.type === 'public' && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
              )}
            </div>
            <div>
              <h2 className="font-semibold">{room.name}</h2>
              <p className="text-sm text-gray-500">
                {typingUsers.length > 0 
                  ? `${typingUsers.join(', ')} typing...`
                  : `${room.members.length} members`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button 
                onClick={() => setShowAddMembers(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={() => setShowInfo(!showInfo)}
              className={`
                p-2 rounded-full transition-colors
                ${showInfo 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.userId === user.id}
              onReact={handleReaction}
              onReply={() => setReplyTo(message)}
              status={message.status}
              replyTo={message.replyTo}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <MessageInput
          onSend={handleSendMessage}
          onFileSelect={handleFileSelect}
          selectedFiles={selectedFiles}
          onRemoveFile={(index) => {
            setSelectedFiles(prev => prev.filter((_, i) => i !== index));
          }}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>

      {/* Room Info Sidebar */}
      <AnimatePresence>
        {showInfo && (
          <RoomInfo
            room={room}
            onClose={() => setShowInfo(false)}
            isAdmin={isAdmin}
            onlineUsers={onlineUsers}
          />
        )}
      </AnimatePresence>

      {/* Add Members Modal */}
      <AnimatePresence>
        {showAddMembers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
            >
              <div className="p-4 border-b dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Add Members</h3>
                  <button
                    onClick={() => setShowAddMembers(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full mt-4 p-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                />
              </div>

              <div className="max-h-96 overflow-y-auto p-4">
                {/* Add member list here */}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Room; 