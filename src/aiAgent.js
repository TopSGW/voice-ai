// Function to call the backend API
async function callBackendAPI(endpoint, data) {
  try {
    const response = await fetch(`http://localhost:8000${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling backend API:', error);
    throw error;
  }
}

export async function getAIResponse(userInput, conversationHistory) {
  try {
    const response = await callBackendAPI('/chat', { userInput, conversationHistory });
    return response.aiResponse;
  } catch (error) {
    console.error('Error getting AI response:', error);
    return "I'm sorry, I'm having trouble processing your request right now. Could you please try again?";
  }
}

// Function to extract case details from the conversation
export function extractCaseDetails(conversationHistory) {
  const caseDetails = {
    inquiry: '',
    name: '',
    mobileNumber: '',
    emailAddress: '',
    appointmentDateTime: ''
  };

  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const phoneRegex = /\b\d{8,}\b/; // Assumes Singapore phone numbers (8 digits)

  conversationHistory.forEach(message => {
    if (message.role === 'user') {
      const content = message.content.toLowerCase();

      // Extract inquiry
      if (content.includes('inquiry') || content.includes('question') || content.includes('help')) {
        caseDetails.inquiry = message.content;
      }

      // Extract name
      const nameMatch = content.match(/my name is (\w+)/i);
      if (nameMatch) {
        caseDetails.name = nameMatch[1];
      }

      // Extract email
      const emailMatch = message.content.match(emailRegex);
      if (emailMatch) {
        caseDetails.emailAddress = emailMatch[0];
      }

      // Extract phone number
      const phoneMatch = message.content.match(phoneRegex);
      if (phoneMatch) {
        caseDetails.mobileNumber = phoneMatch[0];
      }

      // Extract appointment date and time
      if (content.includes('appointment') || content.includes('schedule') || content.includes('call back')) {
        const dateTimeMatch = content.match(/(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{4}\s+(?:\d{1,2}:\d{2}(?:\s*[ap]m)?|\d{1,2}\s*[ap]m))/i);
        if (dateTimeMatch) {
          caseDetails.appointmentDateTime = dateTimeMatch[0];
        }
      }
    }
  });

  return caseDetails;
}

// Main function to handle the conversation flow
export async function handleConversation(userInput, conversationHistory) {
  const aiResponse = await getAIResponse(userInput, conversationHistory);
  const updatedHistory = [...conversationHistory, { role: 'user', content: userInput }, { role: 'assistant', content: aiResponse }];
  
  const caseDetails = extractCaseDetails(updatedHistory);
  
  if (caseDetails.appointmentDateTime) {
    try {
      await callBackendAPI('/schedule-callback', { 
        appointmentDateTime: caseDetails.appointmentDateTime,
        emailAddress: caseDetails.emailAddress
      });
    } catch (error) {
      console.error('Error scheduling callback:', error);
    }
  }

  return {
    aiResponse,
    updatedHistory,
    caseDetails
  };
}