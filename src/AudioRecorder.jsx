import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { logError } from './errorLogger';

const AudioRecorder = ({ onTranscript, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
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
            onTranscript(finalTranscript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        setInterimTranscript(interimTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        const errorMessage = `Speech recognition error: ${event.error}`;
        setError(errorMessage);
        logError(new Error(errorMessage));
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone access to use this feature.');
        }
      };
    } else {
      setError('Speech recognition is not supported in this browser.');
      logError(new Error('Speech recognition not supported'));
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript]);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    setError('');
    setIsRecording(true);
    setInterimTranscript('');
    recognitionRef.current.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    recognitionRef.current.stop();
  };

  return (
    <div className="audio-recorder">
      <button 
        onClick={toggleRecording} 
        disabled={disabled}
        className={`record-button ${isRecording ? 'recording' : ''}`}
        aria-label={isRecording ? 'Stop speaking' : 'Start speaking'}
        aria-pressed={isRecording}
      >
        {isRecording ? 'Stop Speaking' : 'Start Speaking'}
      </button>
      {interimTranscript && (
        <div className="interim-transcript" aria-live="polite">
          <p>{interimTranscript}</p>
        </div>
      )}
      {error && (
        <div className="error-message" role="alert">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

AudioRecorder.propTypes = {
  onTranscript: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

AudioRecorder.defaultProps = {
  disabled: false,
};

export default AudioRecorder;