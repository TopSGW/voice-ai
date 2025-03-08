import React from 'react'
import ChatComponent from './ChatComponent'
import './App.css'
import './styles.css'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 text-gray-800 p-4 md:p-8 flex flex-col">
      <div className="max-w-5xl mx-auto w-full flex-grow flex flex-col">
        <header className="text-center mb-6 animate-fade-in">
          <div className="flex items-center justify-center mb-4 bg-white rounded-lg p-4 shadow-md">
            <img src="/logo.jpg" alt="SSG-WSG Logo" className="h-12 mr-4" />
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600">
              SSG-WSG CALL ME BACK
            </span>
          </div>
        </header>
        
        <main className="flex-grow bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-lg">
          <ChatComponent />
        </main>
        
        <footer className="mt-6 bg-white rounded-xl p-4 md:p-6 animate-fade-in shadow-md text-sm">
          <h2 className="text-xl font-semibold mb-3 text-blue-600">
            How to Use:
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li className="transition-all duration-300 hover:text-blue-600">Type your message or use voice input to start a conversation with the AI assistant.</li>
            <li className="transition-all duration-300 hover:text-blue-600">Ask about SkillsFuture credits, courses, or schedule a call back appointment.</li>
            <li className="transition-all duration-300 hover:text-blue-600">The AI will respond promptly after you send a message.</li>
            <li className="transition-all duration-300 hover:text-blue-600">Use the call button to toggle voice input on/off.</li>
          </ol>
        </footer>
      </div>
    </div>
  )
}

export default App