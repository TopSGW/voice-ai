import React, { useState, useEffect, useRef, useCallback } from 'react';
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
        <div
          className="typing-dot w-2.5 h-2.5 bg-blue-400 rounded-full shadow-sm"
          style={{ animationDelay: '0ms' }}
        ></div>
        <div
          className="typing-dot w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm"
          style={{ animationDelay: '300ms' }}
        ></div>
        <div
          className="typing-dot w-2.5 h-2.5 bg-blue-600 rounded-full shadow-sm"
          style={{ animationDelay: '600ms' }}
        ></div>
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
  // We will use only one transcript for clarity.
  const [currentTranscript, setCurrentTranscript] = useState('');

  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);
  const messagesContainerRef = useRef(null);
  // This ref helps us avoid duplicate calls.
  const processingRef = useRef(false);
  // We use a timer to detect short silences.
  const silenceTimerRef = useRef(null);

  // Scroll to bottom whenever conversation history changes
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [conversationHistory, isSpeaking, isAiResponding, currentTranscript]);

  // Clean up speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      console.warn('SpeechRecognition not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = '';
      let finalDetected = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptSegment = result[0].transcript;
        if (result.isFinal) {
          finalDetected += transcriptSegment;
        } else {
          interim += transcriptSegment;
        }
      }

      // Update the UI with interim transcript
      setCurrentTranscript(interim);

      // If we got a final result, handle it immediately.
      if (finalDetected) {
        handleFinalSpeech(finalDetected);
      }

      // Reset any existing silence timer.
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // Set a shorter silence timer to be more responsive.
      silenceTimerRef.current = setTimeout(() => {
        if (!processingRef.current && (interim || finalDetected)) {
          const combined = (finalDetected + ' ' + interim).trim();
          if (combined) {
            handleFinalSpeech(combined);
          }
        }
      }, 1700);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      // For certain errors, attempt to restart if call is still active.
      if (isCallActive && (event.error === 'no-speech' || event.error === 'network')) {
        setTimeout(() => {
          if (recognitionRef.current && !processingRef.current && !isSpeaking) {
            recognitionRef.current.start();
            setIsListening(true);
          }
        }, 300);
      }
    };

    recognition.onend = () => {
      if (isCallActive && !isSpeaking && !processingRef.current) {
        recognition.start();
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [isCallActive, isSpeaking]);

  // Helper to handle final recognized speech
  const handleFinalSpeech = (finalText) => {
    if (!finalText.trim()) return;
    // Prevent multiple parallel processes.
    if (processingRef.current) return;
    processingRef.current = true;

    // Stop recognition briefly to avoid overlaps.
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    setCurrentTranscript(''); // Clear interim display.

    handleUserInput(finalText);
  };

  const handleUserInput = async (input) => {
    if (!input.trim()) {
      processingRef.current = false;
      return;
    }

    setConversationHistory((prev) => [...prev, { role: 'user', content: input }]);
    setIsAiResponding(true);

    try {
      // Send entire conversation + new input
      const response = await axios.post('http://3.106.129.114:8000/chat', {
        user_input: input,
        conversation_history: conversationHistory,
      });
      const ai_response = response.data.ai_response;

      setConversationHistory((prev) => [...prev, { role: 'assistant', content: ai_response }]);
      setIsAiResponding(false);

      // If call is active, speak the AI response.
      if (isCallActive) {
        speakMessage(ai_response);
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setIsAiResponding(false);
    }

    // Mark done.
    processingRef.current = false;

    // If call is active and not speaking, restart recognition.
    if (isCallActive && !isSpeaking && recognitionRef.current) {
      setTimeout(() => {
        recognitionRef.current.start();
        setIsListening(true);
      }, 100);
    }
  };

  const speakMessage = useCallback((message) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      utteranceRef.current = new SpeechSynthesisUtterance(message);

      utteranceRef.current.rate = 1.0;
      utteranceRef.current.pitch = 1.0;
      utteranceRef.current.volume = 1.0;

      utteranceRef.current.onstart = () => {
        setIsSpeaking(true);
      };

      utteranceRef.current.onend = () => {
        setIsSpeaking(false);
        // Resume listening if call is active.
        if (isCallActive && recognitionRef.current) {
          setTimeout(() => {
            recognitionRef.current.start();
            setIsListening(true);
          }, 100);
        }
      };

      utteranceRef.current.onerror = () => {
        console.error('Speech synthesis error.');
        setIsSpeaking(false);
        // Attempt to resume recognition.
        if (isCallActive && recognitionRef.current) {
          setTimeout(() => {
            recognitionRef.current.start();
            setIsListening(true);
          }, 100);
        }
      };

      window.speechSynthesis.speak(utteranceRef.current);
    }
  }, [isCallActive]);

  const toggleCall = () => {
    if (isCallActive) {
      // Cancel ongoing speech.
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }

      // Stop recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);

      // Process any leftover partial transcript
      const leftover = currentTranscript.trim();
      if (leftover) {
        handleFinalSpeech(leftover);
      }

    } else {
      // Start with a clean slate
      setCurrentTranscript('');
      processingRef.current = false;

      // Start recognition
      setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.start();
          setIsListening(true);
        }
      }, 100);
    }

    setIsCallActive((prev) => !prev);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <div className="flex items-center space-x-2 text-sm">
          {isSpeaking && <span className="text-green-300">AI Speaking</span>}
          {isListening && <span className="text-yellow-300">Listening</span>}
        </div>
      </div>

      {/* Messages */}
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
              className={`max-w-[75%] rounded-lg p-3 shadow-sm ${
                message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {/* AI speaking status */}
        {isSpeaking && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-gray-200 text-gray-800 rounded-lg p-3 shadow-sm flex items-center space-x-2">
              <div className="flex-shrink-0 w-4 h-4 rounded-full bg-green-500 animate-pulse" />
              <span>AI is speaking</span>
            </div>
          </div>
        )}

        {/* AI responding status */}
        {isAiResponding && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-gray-200 text-gray-800 rounded-lg p-3 shadow-sm flex items-center space-x-2">
              <span>AI is thinking</span>
              <TypingAnimation />
            </div>
          </div>
        )}
      </div>

      {/* Input & Controls */}
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
            if (userInput.trim()) {
              handleUserInput(userInput);
              setUserInput('');
            }
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

      {/* Listening status */}
      {isListening && (
        <div className="bg-yellow-100 p-2 text-sm text-gray-800 border-t border-yellow-200">
          <div className="font-semibold flex items-center">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-yellow-500 animate-pulse mr-2" />
            Captured/Finalizing...
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-yellow-400 animate-pulse mr-2" />
            Listening: {currentTranscript}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatComponent;
