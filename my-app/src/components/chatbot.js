import React, { useState } from 'react';
import './chatbot.css';

const Chatbot = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  const sendMessageToAPI = async (userInput) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_message: userInput }),
      });
      const data = await response.json();
      // Assuming data.messageResponse might be an object with a 'content' key
      const messageText = typeof data.messageResponse === 'object' ? data.messageResponse.content : data.messageResponse;
      return messageText; // This ensures you always return a string
    } catch (error) {
      console.error('Error communicating with the API:', error.message);
      return '';
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
  
    // Add the user's message
    const userMessage = { text: input, user: true };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
  
    // Temporary AI message placeholder
    const aiMessagePlaceholder = { text: '...', user: false };
    setMessages((prevMessages) => [...prevMessages, aiMessagePlaceholder]);
  
    // Fetch the AI's response
    const responseText = await sendMessageToAPI(input);
  
    // Replace the placeholder with the actual AI response
    const newAiMessage = { text: responseText, user: false };
    setMessages((prevMessages) => [...prevMessages.slice(0, -1), newAiMessage]);
  
    setInput(''); // Clear input field
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.user ? 'user-message' : 'ai-message'}`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <form className="chatbot-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Chatbot;
