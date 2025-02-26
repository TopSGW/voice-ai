import React from 'react'
import AudioRecorder from './AudioRecorder'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  return (
    <div className="App">
      <header>
        <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </header>
      <h1>Speech to Text AI with Vite + React</h1>
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