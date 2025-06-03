import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Key, Bell, Moon, Sun, Upload,
  Volume2, Mic, Camera, Monitor, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const UserSettings = ({ onClose }) => {
  const { user, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'notifications' | 'devices'
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    if (name !== user.name) formData.append('name', name);
    if (email !== user.email) formData.append('email', email);
    if (avatar) formData.append('avatar', avatar);

    try {
      await updateProfile(formData);
      // Show success message
    } catch (error) {
      console.error('Error updating profile:', error);
      // Show error message
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      // Show error message
      return;
    }

    try {
      await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      // Show success message
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      // Show error message
    }
  };

  const tabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell
    },
    {
      id: 'devices',
      label: 'Devices',
      icon: Monitor
    }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-semibold">Settings</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex">
        {/* Tabs */}
        <div className="w-48 border-r dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                w-full p-3 flex items-center gap-3
                ${activeTab === tab.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 border-r-2 border-blue-500'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden">
                    <img
                      src={avatarPreview}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
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
                <p className="mt-2 text-sm text-gray-500">Change profile photo</p>
              </div>

              {/* Profile Form */}
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full p-2 bg-blue-500 text-white rounded-lg"
                >
                  Save Changes
                </button>
              </form>

              {/* Password Form */}
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <h3 className="text-lg font-medium">Change Password</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!currentPassword || !newPassword || !confirmPassword}
                  className="w-full p-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                >
                  Change Password
                </button>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Notification Settings</h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span>Message Notifications</span>
                  <input type="checkbox" className="toggle" />
                </label>

                <label className="flex items-center justify-between">
                  <span>Sound Effects</span>
                  <input type="checkbox" className="toggle" />
                </label>

                <label className="flex items-center justify-between">
                  <span>Email Notifications</span>
                  <input type="checkbox" className="toggle" />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Connected Devices</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Chrome - Windows</p>
                      <p className="text-sm text-gray-500">Current Session</p>
                    </div>
                  </div>
                  <span className="text-green-500">Active</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Firefox - MacOS</p>
                      <p className="text-sm text-gray-500">Last active: 2 days ago</p>
                    </div>
                  </div>
                  <button className="text-red-500">Remove</button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Media Devices</h4>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    <span>Camera</span>
                  </div>
                  <select className="p-1 rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <option>Default Camera</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    <span>Microphone</span>
                  </div>
                  <select className="p-1 rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <option>Default Microphone</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5" />
                    <span>Speakers</span>
                  </div>
                  <select className="p-1 rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <option>Default Speakers</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSettings; 