import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

const ChatComponent = () => {
  const [userInput, setUserInput] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setUserInput(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    } else {
      console.log('Speech recognition not supported');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    await sendMessage(userInput);
  };

  const sendMessage = async (message) => {
    try {
      setIsLoading(true);
      const newUserMessage = { role: 'user', content: message };
      setConversationHistory(prev => [...prev, newUserMessage]);

      const response = await axios.post('http://localhost:8000/chat', {
        user_input: message,
        conversation_history: conversationHistory,
      });

      const { ai_response } = response.data;
      const newAiMessage = { role: 'assistant', content: ai_response };
      setConversationHistory(prev => [...prev, newAiMessage]);
      setUserInput('');

      speakMessage(ai_response);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  const speakMessage = (message) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    } else {
      console.log('Speech synthesis not supported');
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
        {isLoading && (
          <div className="message assistant">
            <div className="message-content loading">
              <div className="loading-dots">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={userInput}
          onChange={handleInputChange}
          placeholder="Type your message here..."
          className="chat-input"
          disabled={isLoading}
        />
        <button type="submit" className="chat-submit-button" disabled={isLoading}>
          Send
        </button>
        <button
          type="button"
          onClick={toggleListening}
          className={`voice-button ${isListening ? 'listening' : ''}`}
          disabled={isSpeaking || isLoading}
          aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        >
          {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>
      </form>
    </div>
  );
};

export default ChatComponent;