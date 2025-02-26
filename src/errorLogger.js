// In-memory storage for error logs
let errorLogs = [];

export function logError(error) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${error.message}\n${error.stack}\n\n`;
  errorLogs.push(logMessage);
  
  // Limit the number of stored logs to prevent memory issues
  if (errorLogs.length > 100) {
    errorLogs.shift(); // Remove the oldest log
  }
  
  // Log to console for debugging
  console.error('Error logged:', logMessage);
}

export function getErrorLogs() {
  return errorLogs.join('\n');
}

export function clearErrorLogs() {
  errorLogs = [];
}