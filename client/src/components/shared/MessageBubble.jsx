import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Heart, ThumbsUp, Laugh, Reply, MoreHorizontal, Check, Download } from 'lucide-react';
import Linkify from 'linkify-react';

const MessageBubble = ({ 
  message, 
  isOwn, 
  onReact, 
  onReply,
  showAvatar = true,
  status = 'sent', // 'sent', 'delivered', 'read'
  replyTo = null
}) => {
  const [showReactions, setShowReactions] = useState(false);

  const reactions = [
    { emoji: '👍', Icon: ThumbsUp },
    { emoji: '❤️', Icon: Heart },
    { emoji: '😂', Icon: Laugh }
  ];

  const getStatusIcon = () => {
    switch (status) {
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />;
      case 'delivered':
        return <div className="flex"><Check className="w-4 h-4 text-blue-400" /><Check className="w-4 h-4 text-blue-400 -ml-2" /></div>;
      case 'read':
        return <div className="flex"><Check className="w-4 h-4 text-blue-500" /><Check className="w-4 h-4 text-blue-500 -ml-2" /></div>;
      default:
        return null;
    }
  };

  const renderAttachment = (file) => {
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    const isVideo = file.type.startsWith('video/');

    if (isImage) {
      return (
        <div className="mt-2 rounded-lg overflow-hidden">
          <img 
            src={file.url} 
            alt={file.name}
            className="max-w-[300px] max-h-[300px] object-cover"
            loading="lazy"
          />
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="mt-2">
          <audio controls className="max-w-[300px]">
            <source src={file.url} type={file.type} />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="mt-2">
          <video 
            controls 
            className="max-w-[300px] max-h-[300px]"
            poster={file.thumbnail}
          >
            <source src={file.url} type={file.type} />
            Your browser does not support the video element.
          </video>
        </div>
      );
    }

    return (
      <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center gap-3">
        <div className="p-2 bg-white dark:bg-gray-700 rounded">
          <Download className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
        <a 
          href={file.url} 
          download={file.name}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    );
  };

  return (
    <div className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {showAvatar && (
        <div className="flex-shrink-0">
          <img 
            src={message.user.avatar} 
            alt={message.user.name} 
            className="w-8 h-8 rounded-full"
          />
        </div>
      )}
      
      <div className={`flex flex-col ${isOwn ? 'items-end' : ''}`}>
        {/* Reply Preview */}
        {replyTo && (
          <div className="mb-1 text-sm text-gray-500 flex items-center gap-1">
            <Reply className="w-4 h-4" />
            Replying to {replyTo.user.name}
          </div>
        )}

        <div className="group relative">
          {/* Message Content */}
          <motion.div
            className={`
              max-w-md p-3 rounded-lg shadow-sm
              ${isOwn 
                ? 'bg-blue-500 text-white ml-12' 
                : 'bg-white dark:bg-gray-800 mr-12'
              }
            `}
          >
            {/* Username and Time */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">
                {!isOwn && message.user.name}
              </span>
              <span className="text-xs opacity-70">
                {format(new Date(message.timestamp), 'HH:mm')}
              </span>
            </div>

            {/* Message Text */}
            <div className="text-sm">
              <Linkify>{message.content}</Linkify>
            </div>

            {/* Attachments */}
            {message.attachments?.map((file, index) => (
              <div key={index}>
                {renderAttachment(file)}
              </div>
            ))}

            {/* Delivery Status */}
            {isOwn && (
              <div className="absolute -bottom-5 right-0 flex items-center gap-1">
                <span className="text-xs text-gray-500">
                  {format(new Date(message.timestamp), 'HH:mm')}
                </span>
                {getStatusIcon()}
              </div>
            )}
          </motion.div>

          {/* Reaction Button */}
          <div 
            className={`
              absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'}
              opacity-0 group-hover:opacity-100 transition-opacity
            `}
          >
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Reactions Menu */}
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`
                  absolute top-0 ${isOwn ? 'left-0' : 'right-0'}
                  bg-white dark:bg-gray-800 rounded-full shadow-lg
                  flex items-center gap-1 p-1 border dark:border-gray-700
                `}
              >
                {reactions.map((reaction) => (
                  <button
                    key={reaction.emoji}
                    onClick={() => {
                      onReact(message.id, reaction.emoji);
                      setShowReactions(false);
                    }}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  >
                    {reaction.emoji}
                  </button>
                ))}
                <button
                  onClick={() => {
                    onReply(message.id);
                    setShowReactions(false);
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <Reply className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message Reactions */}
          {message.reactions?.length > 0 && (
            <div className={`
              flex flex-wrap gap-1 mt-1
              ${isOwn ? 'justify-end' : 'justify-start'}
            `}>
              {message.reactions.map((reaction, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs"
                >
                  {reaction.emoji} {reaction.count}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble; 