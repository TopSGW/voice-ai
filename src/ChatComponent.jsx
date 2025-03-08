import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaPhone, FaPhoneSlash, FaMicrophone, FaMicrophoneSlash, FaPaperPlane } from 'react-icons/fa';

const ChatComponent = () => {
  const [userInput, setUserInput] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const chatContainerRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastSpeechRef = useRef(Date.now());

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const currentTranscript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setTranscript(currentTranscript);
        lastSpeechRef.current = Date.now();

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set a new timeout to detect end of speech
        timeoutRef.current = setTimeout(() => {
          if (currentTranscript.trim()) {
            handleSubmit(new Event('submit'));
          }
        }, 2000); // 1 second of silence to trigger submission
      };

      recognitionRef.current.onend = () => {
        if (isCallActive) {
          recognitionRef.current.start();
        }
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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isCallActive]);

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
    const input = transcript || userInput;
    if (!input.trim()) return;

    // Clear the timeout to prevent double submission
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Stop listening temporarily
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    await handleUserInput(input);
    setUserInput('');
    setTranscript('');

    // Resume listening if call is still active
    if (isCallActive) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleUserInput = async (input) => {
    if (!input.trim()) return;

    try {
      setIsLoading(true);
      const newUserMessage = { role: 'user', content: input };
      setConversationHistory(prev => [...prev, newUserMessage]);

      const response = await axios.post('http://3.106.129.114:8000/chat', {
        user_input: input,
        conversation_history: conversationHistory,
      });

      const { ai_response } = response.data;
      const newAiMessage = { role: 'assistant', content: ai_response };
      setConversationHistory(prev => [...prev, newAiMessage]);

      if (isCallActive) {
        speakMessage(ai_response);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { role: 'system', content: 'An error occurred while processing your request. Please try again.' };
      setConversationHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCall = () => {
    if (isCallActive) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
    setIsCallActive(!isCallActive);
  };

  const speakMessage = (message) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (isCallActive) {
          recognitionRef.current.start();
          setIsListening(true);
        }
      };
      speechSynthesis.speak(utterance);
    } else {
      console.log('Speech synthesis not supported');
      const errorMessage = { role: 'system', content: 'Speech synthesis is not supported in your browser.' };
      setConversationHistory(prev => [...prev, errorMessage]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <div className="flex items-center space-x-2 text-sm">
          {isSpeaking && <span className="text-green-300">AI Speaking</span>}
          {isListening && <span className="text-yellow-300">Listening</span>}
        </div>
      </div>
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationHistory.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[75%] rounded-lg p-3 ${
              message.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : message.role === 'system'
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-800'
            } shadow-sm`}>
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-gray-200 text-gray-800 rounded-lg p-3 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>
      {isCallActive && transcript && (
        <div className="bg-yellow-100 p-2 text-sm text-gray-800 border-t border-yellow-200">
          <p><strong>Current transcript:</strong> {transcript}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white p-3 flex items-center space-x-2">
        <input
          type="text"
          value={userInput}
          onChange={handleInputChange}
          placeholder="Type your message here..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          disabled={isLoading || isCallActive}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-1 text-sm"
          disabled={isLoading || (!userInput.trim() && !transcript.trim())}
        >
          <FaPaperPlane className="w-4 h-4" />
          <span>Send</span>
        </button>
        <button
          type="button"
          onClick={toggleCall}
          className={`p-2 rounded-full ${
            isCallActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          } text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          disabled={isSpeaking || isLoading}
        >
          {isCallActive ? <FaPhoneSlash className="w-4 h-4" /> : <FaPhone className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};

export default ChatComponent;