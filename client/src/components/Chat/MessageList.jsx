import React from 'react';
import { format } from 'date-fns';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';
import Linkify from "react-linkify";

const MessageList = ({ messages, currentUser }) => {
  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const isCurrentUserMessage = (message) => {
    return message.userId === currentUser.id;
  };

  const renderMessage = (message) => {
    const isOwn = isCurrentUserMessage(message);

    return (
      <div
        key={message.id}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} max-w-[80%]`}>
          {/* Avatar */}
          {!isOwn && (
            <div className="flex-shrink-0 mr-3">
              {message.user?.avatar ? (
                <img
                  src={message.user.avatar}
                  alt={message.user.username}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-medium">
                  {message.user?.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
          )}

          {/* Message Content */}
          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
            {/* Message Header */}
            <div className={`flex items-center space-x-2 mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              <span className="text-sm font-medium text-gray-300">
                {message.user?.username || 'Unknown User'}
              </span>
              <span className="text-xs text-gray-500">
                {formatTime(message.createdAt)}
              </span>
            </div>

            {/* Message Bubble */}
            <div className="group relative">
              <div
                className={`px-4 py-2 rounded-lg ${
                  isOwn
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-white'
                }`}
              >
                <Linkify options={{ target: '_blank', className: 'text-blue-300 hover:underline' }}>
                  {message.content}
                </Linkify>
              </div>

              {/* Message Actions */}
              {isOwn && (
                <div className="absolute top-0 -right-8 hidden group-hover:flex items-center space-x-1">
                  <button className="p-1 text-gray-400 hover:text-white rounded">
                    <Edit2 size={14} />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-red-500 rounded">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Message Status */}
            {isOwn && message.isEdited && (
              <span className="text-xs text-gray-500 mt-1">
                edited
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {messages.map(renderMessage)}
    </div>
  );
};

export default MessageList; 