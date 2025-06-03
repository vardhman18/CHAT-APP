import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import MessageList from './MessageList';

const ChatArea = () => {
  const { activeRoom, messages, sendMessage } = useChat();

  if (!activeRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            Select a room to start chatting
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Choose from your existing rooms or create a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      {/* Room Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-3">
          {activeRoom.avatar ? (
            <img 
              src={activeRoom.avatar} 
              alt={activeRoom.name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {activeRoom.type === 'public' ? '#' : activeRoom.name[0].toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold">{activeRoom.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activeRoom.memberCount} members
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <MessageList messages={messages} />

      {/* Message Input */}
      <div className="p-4 border-t dark:border-gray-700">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.target.elements.message;
            if (input.value.trim()) {
              sendMessage(input.value, activeRoom.id);
              input.value = '';
            }
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            name="message"
            placeholder="Type a message..."
            className="flex-1 p-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatArea; 