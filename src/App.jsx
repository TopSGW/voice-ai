import React, { useState, useEffect } from 'react'
import AudioRecorder from './AudioRecorder'
import { getAIResponse, validateApiKey } from './aiAgent'
import './App.css'

function App() {
  const [conversation, setConversation] = useState([])
  const [aiResponse, setAiResponse] = useState('')
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [textInput, setTextInput] = useState('')
  const [isApiKeyValid, setIsApiKeyValid] = useState(false)

  useEffect(() => {
    async function checkApiKey() {
      const isValid = await validateApiKey()
      setIsApiKeyValid(isValid)
      if (!isValid) {
        setError('Invalid OpenAI API key. Please check your environment variables.')
      }
    }
    checkApiKey()
  }, [])

  const handleUserInput = async (input) => {
    setIsLoading(true)
    setError(null)
    const userMessage = { role: 'user', content: input }
    setConversation(prev => [...prev, userMessage])

    try {
      const aiMessage = await getAIResponse(input, conversation)
      setAiResponse(aiMessage)
    } catch (err) {
      setError('Failed to get AI response. Please try again.')
      console.error('Error getting AI response:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTextSubmit = (e) => {
    e.preventDefault()
    if (textInput.trim()) {
      handleUserInput(textInput)
      setTextInput('')
    }
  }

  useEffect(() => {
    if (aiResponse && !isAiSpeaking) {
      speakAiResponse(aiResponse)
    }
  }, [aiResponse, isAiSpeaking])

  const speakAiResponse = (text) => {
    setIsAiSpeaking(true)
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onend = () => {
      setIsAiSpeaking(false)
      setConversation(prev => [...prev, { role: 'assistant', content: text }])
    }
    window.speechSynthesis.speak(utterance)
  }

  if (!isApiKeyValid) {
    return <div className="App">
      <h1>Voice AI Assistant</h1>
      <p className="error">{error}</p>
    </div>
  }

  return (
    <div className="App">
      <h1>Voice AI Assistant</h1>
      <div className="conversation" aria-live="polite">
        {conversation.map((entry, index) => (
          <p key={index} className={entry.role}>
            <strong>{entry.role === 'user' ? 'You' : 'AI'}:</strong> {entry.content}
          </p>
        ))}
        {isLoading && <p className="loading">AI is thinking...</p>}
        {error && <p className="error">{error}</p>}
      </div>
      <div className="card">
        <AudioRecorder onTranscript={handleUserInput} disabled={isAiSpeaking || isLoading} />
        <form onSubmit={handleTextSubmit} className="text-input-form">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your message here"
            disabled={isAiSpeaking || isLoading}
            aria-label="Type your message"
          />
          <button type="submit" disabled={isAiSpeaking || isLoading} aria-label="Send message">
            Send
          </button>
        </form>
      </div>
      <p className="instructions">
        1. Click "Start Speaking" or type in the text box to begin your conversation with the AI assistant.<br />
        2. Ask any question or start any topic you'd like to discuss.<br />
        3. The AI will respond to you verbally after you finish speaking or sending a message.<br />
        4. Click "Stop Speaking" when you're done speaking, or just send your text message.<br />
        5. Continue the conversation as long as you like!
      </p>
    </div>
  )
}

export default App