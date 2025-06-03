import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Hash, Lock, Users } from 'lucide-react';

const CreateRoomModal = ({ onClose, onCreateRoom }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('public'); // 'public' | 'private' | 'group'
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('type', type);
    if (avatar) {
      formData.append('avatar', avatar);
    }

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const room = await response.json();
      onCreateRoom(room);
    } catch (error) {
      console.error('Error creating room:', error);
      // TODO: Show error message to user
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const roomTypes = [
    {
      id: 'public',
      label: 'Public',
      description: 'Anyone can join',
      icon: Hash
    },
    {
      id: 'private',
      label: 'Private',
      description: 'Invite only',
      icon: Lock
    },
    {
      id: 'group',
      label: 'Group',
      description: 'For small teams',
      icon: Users
    }
  ];

  return (
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
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold">Create New Room</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Room avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Upload className="w-8 h-8" />
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-white" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">Upload room avatar</p>
          </div>

          {/* Room Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Room Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              required
            />
          </div>

          {/* Room Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 resize-none"
              rows={3}
            />
          </div>

          {/* Room Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Room Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {roomTypes.map((roomType) => (
                <button
                  key={roomType.id}
                  type="button"
                  onClick={() => setType(roomType.id)}
                  className={`
                    p-3 rounded-lg border dark:border-gray-700 flex flex-col items-center gap-1
                    ${type === roomType.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <roomType.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{roomType.label}</span>
                  <span className="text-xs text-gray-500">{roomType.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Room
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CreateRoomModal; 