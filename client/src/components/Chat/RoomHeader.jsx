import React from 'react';
import { Users, Info } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';

const RoomHeader = ({ room }) => {
  const { onlineUsers } = useChat();

  const getOnlineCount = () => {
    if (!room.members) return 0;
    return room.members.filter(member => 
      onlineUsers.includes(member.id)
    ).length;
  };

  return (
    <div className="border-b dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {room.avatar ? (
            <img
              src={room.avatar}
              alt={room.name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          )}
          
          <div>
            <h2 className="font-semibold">{room.name}</h2>
            <p className="text-sm text-gray-500">
              {getOnlineCount()} online
            </p>
          </div>
        </div>

        <button
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          onClick={() => {}} // TODO: Implement room info panel
        >
          <Info className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default RoomHeader; 