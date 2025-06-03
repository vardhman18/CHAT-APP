import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';
import EditProfileModal from '../modals/EditProfileModal';

const UserProfile = ({ user }) => {
  const [showEditProfile, setShowEditProfile] = useState(false);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="relative">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.username}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm font-medium">
            {getInitials(user.displayName || user.username)}
          </div>
        )}
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
      </div>
      
      <div className="flex-1">
        <h3 className="font-medium truncate">
          {user.displayName || user.username}
        </h3>
        <p className="text-sm text-gray-400 truncate">
          {user.status || 'Online'}
        </p>
      </div>

      <button
        onClick={() => setShowEditProfile(true)}
        className="p-1 hover:bg-gray-700 rounded-lg"
      >
        <Edit2 size={16} />
      </button>

      {showEditProfile && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditProfile(false)}
        />
      )}
    </div>
  );
};

export default UserProfile; 