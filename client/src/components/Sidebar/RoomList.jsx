import React from 'react';
import { Hash, Lock, Users } from 'lucide-react';

const RoomList = ({ rooms, activeRoom, onRoomSelect, onlineUsers }) => {
  const getRoomIcon = (type) => {
    switch (type) {
      case 'public':
        return <Hash size={18} />;
      case 'private':
        return <Lock size={18} />;
      case 'direct':
        return <Users size={18} />;
      default:
        return <Hash size={18} />;
    }
  };

  const getOnlineCount = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room || !room.members) return 0;
    return room.members.filter(memberId => 
      onlineUsers.some(user => user.id === memberId)
    ).length;
  };

  return (
    <div className="space-y-1 p-2">
      {rooms.map((room) => (
        <button
          key={room.id}
          onClick={() => onRoomSelect(room)}
          className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-700 transition-colors ${
            activeRoom?.id === room.id ? 'bg-gray-700' : ''
          }`}
        >
          <div className="flex items-center space-x-2">
            {getRoomIcon(room.type)}
            <span className="truncate">{room.name}</span>
          </div>
          {room.type !== 'direct' && (
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span>{getOnlineCount(room.id)}</span>
              <Users size={14} />
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default RoomList; 