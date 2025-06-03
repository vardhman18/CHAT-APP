import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Users, Image, FileText, Crown, 
  MoreVertical, UserMinus, UserPlus 
} from 'lucide-react';
import { format } from 'date-fns';

const RoomInfo = ({ room, onClose, isAdmin, onlineUsers }) => {
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'media'
  const [showMemberActions, setShowMemberActions] = useState(null);

  const tabs = [
    { id: 'members', label: 'Members', icon: Users },
    { id: 'media', label: 'Shared Media', icon: Image }
  ];

  const renderMembersList = () => (
    <div className="space-y-2">
      {room.members.map((member) => (
        <div 
          key={member.id}
          className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg group"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={member.avatar} 
                alt={member.name} 
                className="w-10 h-10 rounded-full"
              />
              <span 
                className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white dark:border-gray-800 rounded-full ${
                  onlineUsers.includes(member.id) ? 'bg-green-500' : 'bg-gray-300'
                }`} 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{member.name}</span>
                {member.id === room.adminId && (
                  <Crown className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <p className="text-sm text-gray-500">
                {onlineUsers.includes(member.id) 
                  ? 'Online'
                  : `Last seen ${format(new Date(member.lastSeen), 'MMM d, HH:mm')}`
                }
              </p>
            </div>
          </div>

          {isAdmin && member.id !== room.adminId && (
            <div className="relative">
              <button
                onClick={() => setShowMemberActions(showMemberActions === member.id ? null : member.id)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMemberActions === member.id && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1 z-10">
                  <button
                    onClick={() => {/* Handle remove member */}}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <UserMinus className="w-4 h-4" />
                    Remove from room
                  </button>
                  <button
                    onClick={() => {/* Handle make admin */}}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    Make admin
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderMediaGrid = () => {
    const mediaFiles = room.messages
      ?.filter(msg => msg.attachments?.some(att => att.type.startsWith('image/')))
      .flatMap(msg => msg.attachments.filter(att => att.type.startsWith('image/')))
      .slice(0, 30) || [];

    return (
      <div className="grid grid-cols-3 gap-2">
        {mediaFiles.map((file, index) => (
          <div 
            key={index}
            className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
          >
            <img 
              src={file.url} 
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween' }}
      className="w-80 h-full border-l dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Room Info</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative mb-3">
            <img 
              src={room.avatar} 
              alt={room.name}
              className="w-20 h-20 rounded-full"
            />
            {room.type === 'public' && (
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
            )}
          </div>
          <h2 className="text-xl font-semibold mb-1">{room.name}</h2>
          <p className="text-sm text-gray-500 text-center">{room.description}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 py-3 flex items-center justify-center gap-2
              text-sm font-medium transition-colors
              ${activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'members' ? renderMembersList() : renderMediaGrid()}
      </div>
    </motion.div>
  );
};

export default RoomInfo; 