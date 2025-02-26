import React from 'react'
import AudioRecorder from './AudioRecorder'
import './App.css'

function App() {
  return (
    <div className="App">
      <h1>Speech to Text AI</h1>
      <div className="card">
        <AudioRecorder />
      </div>
      <p className="read-the-docs">
        This application uses the Web Speech API for real-time speech-to-text transcription.
      </p>
      <p className="instructions">
        1. Click "Start Recording" to begin recording audio.<br />
        2. Speak into your microphone, and you'll see the transcription in real-time.<br />
        3. Click "Stop Recording" when you're done speaking.
      </p>
    </div>
  )
}

export default App