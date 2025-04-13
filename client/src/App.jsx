import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  useEffect(() => {
    socket.on("chat message", (msg) => {
      setChat((prev) => [...prev, msg]);
    });
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    socket.emit("chat message", message);
    setMessage("");
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded shadow mt-10">
      <h1 className="text-2xl font-bold mb-4">Vite Chat App</h1>
      <form onSubmit={sendMessage} className="flex gap-2 mb-4">
        <input
          className="border p-2 flex-1 rounded"
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message"
        />
        <button className="bg-blue-500 text-white px-4 rounded" type="submit">
          Send
        </button>
      </form>
      <ul className="space-y-2">
        {chat.map((msg, i) => (
          <li key={i} className="bg-gray-100 p-2 rounded">{msg}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
