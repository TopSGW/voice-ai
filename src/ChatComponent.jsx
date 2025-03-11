import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaPhone, FaPhoneSlash } from 'react-icons/fa';
import axios from 'axios';

const TypingAnimation = () => (
  <div className="flex items-center space-x-2 animate-pulse">
    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
  </div>
);

const ChatComponent = () => {
  const [userInput, setUserInput] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  
  const messagesContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const utteranceRef = useRef(null);

  // Scroll to bottom whenever conversation history changes
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [conversationHistory, isSpeaking, isAiResponding]);

  // Clean up speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          // Only add to final transcript if result is final
          if (event.results[i].isFinal) {
            setFinalTranscript(prev => prev + ' ' + event.results[i][0].transcript);
          } else {
            currentTranscript += event.results[i][0].transcript;
          }
        }
        
        // Update the live transcript display
        setTranscript(currentTranscript);

        // Reset the silence timer
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        // Set a new silence timer
        silenceTimerRef.current = setTimeout(() => {
          recognitionRef.current.stop();
          setIsListening(false);
          
          // Combine final transcript with any remaining current transcript
          const completeInput = (finalTranscript + ' ' + currentTranscript).trim();
          if (completeInput) {
            handleUserInput(completeInput);
          }
          
          // Reset transcripts
          setTranscript('');
          setFinalTranscript('');
        }, 2500); // 2.5 second of silence triggers send
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [finalTranscript]);

  const handleUserInput = async (input) => {
    if (!input.trim()) return;

    setConversationHistory(prev => [...prev, { role: 'user', content: input }]);
    setIsAiResponding(true);

    try {
      const response = await axios.post('http://3.106.129.114:8000/chat', { user_input: input, conversation_history: conversationHistory });
      const ai_response = response.data.ai_response;

      setConversationHistory(prev => ([...prev, { role: 'assistant', content: ai_response }]));
      setIsAiResponding(false);

      speakMessage(ai_response);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setIsAiResponding(false);
    }

    setTranscript('');
  };

  const speakMessage = (message) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      setIsSpeaking(true);
      utteranceRef.current = new SpeechSynthesisUtterance(message);
      
      utteranceRef.current.onend = () => {
        setIsSpeaking(false);
      };
      
      utteranceRef.current.onerror = () => {
        console.error('Speech synthesis error');
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utteranceRef.current);
    }
  };

  const toggleCall = () => {
    if (isCallActive) {
      // First cancel any ongoing speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      
      // Then stop recognition
      recognitionRef.current.stop();
      setIsListening(false);
      
      // Process any remaining transcript before ending call
      const completeInput = (finalTranscript + ' ' + transcript).trim();
      if (completeInput) {
        handleUserInput(completeInput);
      }
      
      // Reset transcripts
      setTranscript('');
      setFinalTranscript('');
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
    setIsCallActive(!isCallActive);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <div className="flex items-center space-x-2 text-sm">
          {isSpeaking && <span className="text-green-300">AI Speaking</span>}
          {isListening && <span className="text-yellow-300">Listening</span>}
        </div>
      </div>

      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4" 
        style={{ maxHeight: 'calc(100vh - 130px)' }}
      >
        {conversationHistory.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[75%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800'
              } shadow-sm`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isSpeaking && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-gray-200 text-gray-800 rounded-lg p-3 shadow-sm">
              AI is speaking...
            </div>
          </div>
        )}
        {isAiResponding && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-gray-200 text-gray-800 rounded-lg p-3 shadow-sm flex items-center space-x-2">
              <span>AI is typing</span>
              <TypingAnimation />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="bg-white p-3 flex items-center space-x-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message here..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          disabled={isListening || isSpeaking || isAiResponding}
        />

        <button
          onClick={async (e) => {
            e.preventDefault();
            await handleUserInput(userInput);
            setUserInput('');
          }}
          className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-1 text-sm"
          disabled={!userInput.trim() || isAiResponding}
        >
          <FaPaperPlane />
        </button>

        <button
          onClick={toggleCall}
          className={`p-2 rounded-full ${
            isCallActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          } text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          disabled={isAiResponding}
        >
          {isCallActive ? <FaPhoneSlash /> : <FaPhone />}
        </button>
      </form>

      {isListening && (
        <div className="bg-yellow-100 p-2 text-sm text-gray-800 border-t border-yellow-200">
          <div className="font-semibold">Captured: {finalTranscript}</div>
          <div>Listening: {transcript}</div>
        </div>
      )}
    </div>
  );
};

export default ChatComponent;