import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiPlus, FiLogOut, FiSettings } from 'react-icons/fi';

const Sidebar = () => {
  const [rooms, setRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch rooms from your backend
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/rooms');
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const createNewRoom = async () => {
    const roomName = prompt('Enter room name:');
    if (roomName) {
      try {
        const response = await fetch('http://localhost:5000/api/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: roomName, createdBy: user.uid }),
        });
        const newRoom = await response.json();
        setRooms([...rooms, newRoom]);
      } catch (error) {
        console.error('Error creating room:', error);
      }
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="sidebar bg-gray-800 text-white w-64 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Chatify</h1>
      </div>

      <div className="p-4">
        <div className="flex items-center mb-4">
          <input
            type="text"
            placeholder="Search rooms..."
            className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          onClick={createNewRoom}
          className="flex items-center gap-2 w-full px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus /> Create New Room
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase mb-2">Rooms</h2>
          {filteredRooms.map((room) => (
            <Link
              key={room.id}
              to={`/room/${room.id}`}
              className="block px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mb-1"
            >
              # {room.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={user?.photoURL || 'https://via.placeholder.com/32'}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm font-medium">{user?.displayName || user?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiSettings />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiLogOut />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 