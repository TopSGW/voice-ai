import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaPhone, FaPhoneSlash } from 'react-icons/fa';
import axios from 'axios';

// Professional Typing Animation Component
const TypingAnimation = () => {
  return (
    <>
      <style jsx>{`
        @keyframes typingPulse {
          0%, 100% { transform: scale(0.8); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        
        .typing-dot {
          animation: typingPulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      <div className="flex items-center space-x-1.5">
        <div className="typing-dot w-2.5 h-2.5 bg-blue-400 rounded-full shadow-sm" style={{ animationDelay: '0ms' }}></div>
        <div className="typing-dot w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm" style={{ animationDelay: '300ms' }}></div>
        <div className="typing-dot w-2.5 h-2.5 bg-blue-600 rounded-full shadow-sm" style={{ animationDelay: '600ms' }}></div>
      </div>
    </>
  );
};

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
  const processingRef = useRef(false);

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
      recognitionRef.current.lang = 'en-US'; // Set language explicitly
      recognitionRef.current.maxAlternatives = 1; // Limit alternatives for faster processing

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        let isFinal = false;
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setFinalTranscript(prev => {
              const newFinal = prev + ' ' + event.results[i][0].transcript;
              return newFinal.trim();
            });
            isFinal = true;
          } else {
            currentTranscript += event.results[i][0].transcript;
          }
        }
        
        // Update the live transcript display
        setTranscript(currentTranscript.trim());
        
        // Reset the silence timer
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        
        // If we got a final result, process it immediately for quicker response
        if (isFinal && !processingRef.current) {
          const finalText = finalTranscript.trim();
          // Process final results that are substantial enough (not just filler words)
          if (finalText && finalText.split(' ').length > 2) {
            processingRef.current = true;
            handleUserInput(finalText);
            setFinalTranscript('');
            processingRef.current = false;
          }
        }
        
        // Set a new silence timer (shorter duration for better responsiveness)
        silenceTimerRef.current = setTimeout(() => {
          if (processingRef.current) return;
          
          const completeInput = (finalTranscript + ' ' + currentTranscript).trim();
          if (completeInput) {
            processingRef.current = true;
            handleUserInput(completeInput);
            // Reset transcripts
            setTranscript('');
            setFinalTranscript('');
            processingRef.current = false;
          }
        }, 800); // 800ms of silence triggers send - more responsive than 2.5s
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        // Restart recognition after common errors
        if (event.error === 'network' || event.error === 'no-speech') {
          setTimeout(() => {
            if (isCallActive && !processingRef.current) {
              recognitionRef.current.start();
              setIsListening(true);
            }
          }, 300);
        }
      };

      recognitionRef.current.onend = () => {
        // Only restart if we're still in active call mode and not processing
        if (isCallActive && !isSpeaking && !processingRef.current) {
          recognitionRef.current.start();
        } else {
          setIsListening(false);
        }
      };
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [finalTranscript, isCallActive, isSpeaking]);

  const handleUserInput = async (input) => {
    if (!input.trim()) return;

    // Prevent duplicate processing
    if (processingRef.current) return;
    processingRef.current = true;

    // Temporarily stop listening to prevent overlapping recognitions
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    setConversationHistory(prev => [...prev, { role: 'user', content: input }]);
    setIsAiResponding(true);

    try {
      const response = await axios.post('http://3.106.129.114:8000/chat', { 
        user_input: input, 
        conversation_history: conversationHistory 
      });
      const ai_response = response.data.ai_response;

      setConversationHistory(prev => ([...prev, { role: 'assistant', content: ai_response }]));
      setIsAiResponding(false);

      // Only speak if call is still active
      if (isCallActive) {
        speakMessage(ai_response);
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setIsAiResponding(false);
    }

    setTranscript('');
    processingRef.current = false;

    // Resume listening if call is still active
    if (isCallActive && !isSpeaking) {
      setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.start();
          setIsListening(true);
        }
      }, 100);
    }
  };

  const speakMessage = (message) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      setIsSpeaking(true);
      utteranceRef.current = new SpeechSynthesisUtterance(message);
      
      // Optimize speech settings for better performance
      utteranceRef.current.rate = 1.0;  // Normal speed
      utteranceRef.current.pitch = 1.0; // Normal pitch
      utteranceRef.current.volume = 1.0; // Full volume
      
      utteranceRef.current.onend = () => {
        setIsSpeaking(false);
        // Resume listening after AI finishes speaking
        if (isCallActive && recognitionRef.current) {
          setTimeout(() => {
            recognitionRef.current.start();
            setIsListening(true);
          }, 100);
        }
      };
      
      utteranceRef.current.onerror = () => {
        console.error('Speech synthesis error');
        setIsSpeaking(false);
        // Also try to resume listening if speech fails
        if (isCallActive && recognitionRef.current) {
          setTimeout(() => {
            recognitionRef.current.start();
            setIsListening(true);
          }, 100);
        }
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
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
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
      // Start with a clean slate
      setTranscript('');
      setFinalTranscript('');
      processingRef.current = false;
      
      // Short timeout to ensure clean start
      setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.start();
          setIsListening(true);
        }
      }, 100);
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
            <div className="bg-gray-200 text-gray-800 rounded-lg p-3 shadow-sm flex items-center space-x-2">
              <div className="flex-shrink-0 w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
              <span>AI is speaking</span>
            </div>
          </div>
        )}
        {isAiResponding && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-gray-200 text-gray-800 rounded-lg p-3 shadow-sm flex items-center space-x-2">
              <span>AI is thinking</span>
              <TypingAnimation />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="bg-white p-3 flex items-center space-x-2 shadow-md">
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
          <div className="font-semibold flex items-center">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-yellow-500 animate-pulse mr-2"></div>
            Captured: {finalTranscript}
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-yellow-400 animate-pulse mr-2"></div>
            Listening: {transcript}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatComponent;