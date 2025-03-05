import React from 'react'
import ChatComponent from './ChatComponent'
import './App.css'
import './styles.css'

function App() {
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col">
      <div className="max-w-5xl mx-auto w-full flex-grow">
        <header className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              SSG-WSG CALL ME BACK
            </h1>
          </div>
        </header>
        
        <main className="bg-gray-900 rounded-xl shadow-2xl p-6 md:p-8 mb-12 transition-all duration-300 hover:shadow-gray-700/20">
          <ChatComponent />
        </main>
        
        <footer className="bg-gray-900 rounded-xl p-6 md:p-8 animate-fade-in">
          <h2 className="text-2xl font-semibold mb-4">
            How to Use:
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-300">
            <li className="transition-all duration-300 hover:text-white">Type your message in the chat box to start a conversation with the AI assistant.</li>
            <li className="transition-all duration-300 hover:text-white">Ask any question about SkillsFuture credits, courses, or schedule a call back appointment.</li>
            <li className="transition-all duration-300 hover:text-white">The AI will respond promptly after you send a message.</li>
            <li className="transition-all duration-300 hover:text-white">Continue the conversation as long as you need!</li>
          </ol>
        </footer>
      </div>
    </div>
  )
}

export default App