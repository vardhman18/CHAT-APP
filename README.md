<<<<<<< HEAD
# Chatify - Real-time Chat Application

A modern real-time chat application built with React, Node.js, and Socket.IO.

## Features

- Real-time messaging
- Room-based chat system
- User authentication
- Dark/Light theme support
- Message history
- Online user status
- Responsive design

## Tech Stack

### Frontend
- React
- React Router
- Socket.IO Client
- TailwindCSS
- Lucide Icons
- Framer Motion

### Backend
- Node.js
- Express
- Socket.IO
- JWT Authentication
- In-memory data storage (can be extended to use a database)

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd chat-app
```

2. Install dependencies for both frontend and backend:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Create a .env file in the server directory:
```bash
JWT_SECRET=your-secret-key
PORT=5001
```

4. Start the development servers:

For backend:
```bash
cd server
npm run dev
```

For frontend:
```bash
cd client
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:5001`.

## Project Structure

```
chat-app/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/        # Page components
│   │   └── config/       # Configuration files
│   └── public/           # Static files
└── server/               # Backend Node.js application
    ├── routes/          # API routes
    ├── middleware/      # Express middleware
    └── config/         # Server configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 
=======
# 💬 Real-Time Chat App

A full-stack real-time chat application built with **Vite + React + Tailwind CSS** on the frontend, and **Node.js + Express + Socket.IO** on the backend.

---

## ⚙️ Tech Stack

**Frontend**
- React (via Vite)
- Tailwind CSS
- Socket.IO Client

**Backend**
- Node.js
- Express.js
- Socket.IO Server

---

## 📁 Project Structure
chat-app/ 
   ├── client/ # Frontend (Vite + React + Tailwind) 
   └── server/ # Backend (Node.js + Express + Socket.IO)


---

## 🚀 Features

- Real-time messaging using WebSockets
- Simple and responsive UI with Tailwind
- Cross-browser compatible
- Easily extendable to include auth, room chat, etc.

---

>>>>>>> 9046c2aa6092ccf3ccf07fb91be8f52c38cd9903
