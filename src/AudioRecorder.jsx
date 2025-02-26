import React, { useState, useEffect, useRef } from 'react';
import { logError } from './errorLogger';

const AudioRecorder = () => {
  const [transcription, setTranscription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        setTranscription(finalTranscript + interimTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        const errorMessage = `Speech recognition error: ${event.error}`;
        setError(errorMessage);
        logError(new Error(errorMessage));
      };
    } else {
      setError('Speech recognition is not supported in this browser.');
      logError(new Error('Speech recognition not supported'));
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = () => {
    setError('');
    setTranscription('');
    setIsRecording(true);
    recognitionRef.current.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    recognitionRef.current.stop();
  };

  return (
    <div>
      <h2>Real-time Speech-to-Text</h2>
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
      <div>
        <h3>Transcription:</h3>
        <p>{transcription || 'No transcription yet'}</p>
      </div>
      {error && (
        <div style={{ color: 'red' }}>
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;