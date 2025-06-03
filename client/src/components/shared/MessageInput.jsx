import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Paperclip, Send, X, Image, FileText, Music, Video } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const MessageInput = ({ 
  onSend, 
  onFileSelect, 
  selectedFiles = [], 
  onRemoveFile,
  replyTo,
  onCancelReply
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend(message);
    setMessage('');
  };

  const handleFileIconClick = (type) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = {
        image: 'image/*',
        document: '.pdf,.doc,.docx',
        audio: 'audio/*',
        video: 'video/*'
      }[type];
      fileInputRef.current.click();
    }
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (type.startsWith('audio/')) return <Music className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="p-4 border-t dark:border-gray-700">
      {/* Reply Preview */}
      {replyTo && (
        <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-8 bg-blue-500 rounded-full" />
            <div>
              <p className="text-sm font-medium">{replyTo.user.name}</p>
              <p className="text-sm text-gray-500 truncate">{replyTo.content}</p>
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="relative group bg-gray-50 dark:bg-gray-800 rounded-lg p-2 flex items-center gap-2"
            >
              {getFileIcon(file.type)}
              <span className="text-sm truncate max-w-[150px]">{file.name}</span>
              <button
                onClick={() => onRemoveFile(index)}
                className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full p-3 pr-12 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 resize-none"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
            >
              <Smile className="w-5 h-5" />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => handleFileIconClick('image')}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    onFileSelect(e.target.files);
                    e.target.value = ''; // Reset input
                  }
                }}
                multiple
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!message.trim() && selectedFiles.length === 0}
          className="p-3 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full right-0 mb-2"
          >
            <Picker
              data={data}
              onEmojiSelect={(emoji) => {
                setMessage(prev => prev + emoji.native);
                setShowEmojiPicker(false);
              }}
              theme="auto"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageInput; 