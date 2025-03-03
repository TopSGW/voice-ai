import React from 'react'
import ChatComponent from './ChatComponent'
import './App.css'

function App() {
  return (
    <div className="App">
      <h1>SkillsFuture and Workforce Singapore AI Assistant</h1>
      <ChatComponent />
      <p className="instructions">
        1. Type your message in the text box to begin your conversation with the AI assistant.<br />
        2. Ask any question about SkillsFuture credits, courses, or schedule a call back appointment.<br />
        3. The AI will respond to you after you send a message.<br />
        4. Continue the conversation as long as you like!
      </p>
    </div>
  )
}

export default App