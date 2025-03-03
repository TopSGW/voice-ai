import React, { useState } from 'react';
import axios from 'axios';

const ChatComponent = () => {
  const [userInput, setUserInput] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    try {
      const newUserMessage = { role: 'user', content: userInput };
      setConversationHistory(prev => [...prev, newUserMessage]);

      const response = await axios.post('http://localhost:8000/chat', {
        user_input: userInput,
        conversation_history: conversationHistory,
      });

      const { ai_response } = response.data;
      const newAiMessage = { role: 'assistant', content: ai_response };
      setConversationHistory(prev => [...prev, newAiMessage]);
      setUserInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="chat-container">
      <div className="conversation-history">
        {conversationHistory.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-content">{message.content}</div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={userInput}
          onChange={handleInputChange}
          placeholder="Type your message here..."
          className="chat-input"
        />
        <button type="submit" className="chat-submit-button">Send</button>
      </form>
    </div>
  );
};

export default ChatComponent;