import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Settings, LogOut, Moon, Sun,
  Hash, Lock, Users, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const Sidebar = ({ 
  rooms, 
  activeRoom, 
  onRoomSelect, 
  onCreateRoom,
  onlineUsers = []
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoomIcon = (type) => {
    switch (type) {
      case 'public':
        return <Hash className="w-5 h-5" />;
      case 'private':
        return <Lock className="w-5 h-5" />;
      case 'group':
        return <Users className="w-5 h-5" />;
      default:
        return <MessageSquare className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-64 h-full border-r dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Chatify</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-9 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <button
            onClick={onCreateRoom}
            className="w-full p-2 flex items-center gap-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
          >
            <Plus className="w-5 h-5" />
            Create New Room
          </button>
        </div>

        <div className="space-y-1 p-2">
          {filteredRooms.map((room) => (
            <button
              key={room.id}
              onClick={() => onRoomSelect(room)}
              className={`
                w-full p-2 flex items-center gap-3 rounded-lg transition-colors
                ${activeRoom?.id === room.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <div className="relative">
                {room.avatar ? (
                  <img 
                    src={room.avatar} 
                    alt={room.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {getRoomIcon(room.type)}
                  </div>
                )}
                {room.type === 'public' && (
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h3 className="font-medium truncate">{room.name}</h3>
                <p className="text-sm text-gray-500 truncate">
                  {room.lastMessage?.content || 'No messages yet'}
                </p>
              </div>
              {room.unreadCount > 0 && (
                <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                  {room.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t dark:border-gray-700">
        <div className="flex items-center gap-3">
          <img 
            src={user.avatar} 
            alt={user.name}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{user.name}</h3>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
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
              {/* Add settings content here */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sidebar; 