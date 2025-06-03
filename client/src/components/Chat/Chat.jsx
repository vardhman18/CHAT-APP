import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import RoomHeader from './RoomHeader';

const Chat = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    activeRoom,
    setActiveRoom,
    rooms,
    messages,
    loading,
    error,
    sendMessage,
    loadRooms,
    setError
  } = useChat();
  const messagesEndRef = useRef(null);

  // Load rooms when component mounts
  useEffect(() => {
    if (user) {
      const loadInitialData = async () => {
        try {
          await loadRooms();
          if (roomId) {
            const parsedRoomId = parseInt(roomId);
            const room = rooms.find(r => r.id === parsedRoomId);
            if (room) {
              setActiveRoom(room);
            } else {
              console.log('Room not found:', parsedRoomId);
              navigate('/');
            }
          }
        } catch (error) {
          console.error('Failed to load initial data:', error);
          setError('Failed to load chat data. Please try refreshing the page.');
        }
      };
      
      loadInitialData();
    }
  }, [user]);

  // Set active room when roomId changes
  useEffect(() => {
    if (roomId && rooms.length > 0) {
      const parsedRoomId = parseInt(roomId);
      const room = rooms.find(r => r.id === parsedRoomId);
      if (room) {
        console.log('Setting active room:', room);
        setActiveRoom(room);
      } else {
        console.log('Room not found:', parsedRoomId);
        navigate('/');
      }
    } else if (!roomId && rooms.length > 0) {
      // If no roomId is provided, set the first room as active
      console.log('No room selected, setting first room as active');
      setActiveRoom(rooms[0]);
      navigate(`/room/${rooms[0].id}`);
    }
  }, [roomId, rooms, navigate, setActiveRoom]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content) => {
    if (!content.trim() || !activeRoom) return;

    try {
      await sendMessage(content, activeRoom.id);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!activeRoom && rooms.length > 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <p className="text-gray-500">Select a room to start chatting</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-900">
      {activeRoom && (
        <>
          <RoomHeader room={activeRoom} />
          
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <MessageList 
              messages={messages}
              currentUser={user}
            />
            <div ref={messagesEndRef} />
          </div>

          <div className="flex-shrink-0">
            <MessageInput onSendMessage={handleSendMessage} />
          </div>
        </>
      )}
    </div>
  );
};

export default Chat; 