import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaMicrophone, FaMicrophoneSlash, FaPaperPlane } from 'react-icons/fa';

const ChatComponent = () => {
  const [userInput, setUserInput] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef(null);
  const chatContainerRef = useRef(null);

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

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversationHistory]);

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

      const response = await axios.post('http://3.27.124.165:8000/chat', {
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
    <div className="flex flex-col h-[600px] bg-slate-800 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-purple-500/20">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 chat-container">
        {conversationHistory.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[80%] rounded-lg p-4 ${
              message.role === 'user' 
                ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white' 
                : 'bg-slate-700 text-purple-200'
            } shadow-md`}>
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-slate-700 text-purple-200 rounded-lg p-4 shadow-md">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center p-4 bg-slate-900">
        <input
          type="text"
          value={userInput}
          onChange={handleInputChange}
          placeholder="Type your message here..."
          className="flex-1 bg-slate-800 text-white rounded-l-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-6 py-3 rounded-r-lg hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={isLoading}
        >
          <FaPaperPlane className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={toggleListening}
          className={`ml-2 p-3 rounded-full ${
            isListening ? 'bg-red-500' : 'bg-green-500'
          } text-white hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500`}
          disabled={isSpeaking || isLoading}
          aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        >
          {isListening ? <FaMicrophoneSlash className="w-5 h-5" /> : <FaMicrophone className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
};

export default ChatComponent;