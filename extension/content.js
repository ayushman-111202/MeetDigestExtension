// // Global variables
// let isEnabled = false;
// let isInMeeting = false;
// let transcriptData = [];
// let observer = null;
// let processingInterval = null;

// // Initialize on load
// initialize();

// function initialize() {
//   // Check if extension is enabled
//   chrome.storage.local.get(['enabled'], function(result) {
//     isEnabled = result.enabled || false;
//     checkIfInMeeting();
//     setupMeetingDetection();
//     setupMessageListener();
    
//     if (isEnabled && isInMeeting) {
//       startSummarizer();
//     }
//   });
// }

// function checkIfInMeeting() {
//   // Simple check: if URL contains meet.google.com/ and has more characters after that
//   const url = window.location.href;
//   isInMeeting = url.includes('meet.google.com/') && !url.endsWith('meet.google.com/');
// }

// function setupMeetingDetection() {
//   // Listen for URL changes (for single-page apps like Google Meet)
//   let lastUrl = window.location.href;
  
//   // Check for URL changes every second
//   setInterval(() => {
//     const currentUrl = window.location.href;
//     if (currentUrl !== lastUrl) {
//       lastUrl = currentUrl;
//       checkIfInMeeting();
      
//       if (isEnabled && isInMeeting) {
//         startSummarizer();
//       } else if (!isInMeeting) {
//         stopSummarizer();
//       }
//     }
//   }, 1000);
// }

// function setupMessageListener() {
//   // Listen for messages from popup
//   chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//     if (request.action === 'toggleSummarizer') {
//       isEnabled = request.enabled;
      
//       if (isEnabled && isInMeeting) {
//         startSummarizer();
//       } else {
//         stopSummarizer();
//       }
      
//       sendResponse({success: true});
//     }
//     return true;
//   });
// }

// function startSummarizer() {
//   console.log('Starting Meet summarizer...');
//   setupTranscriptObserver();
//   startProcessingInterval();
//   showStatusIndicator();
// }

// function stopSummarizer() {
//   console.log('Stopping Meet summarizer...');
//   if (observer) {
//     observer.disconnect();
//     observer = null;
//   }
  
//   if (processingInterval) {
//     clearInterval(processingInterval);
//     processingInterval = null;
//   }
  
//   hideStatusIndicator();
// }

// function setupTranscriptObserver() {
//   // Disconnect existing observer if any
//   if (observer) {
//     observer.disconnect();
//   }
  
//   // Create a new observer to watch for transcript elements
//   observer = new MutationObserver(mutations => {
//     mutations.forEach(mutation => {
//       if (mutation.type === 'childList') {
//         const transcriptNodes = document.querySelectorAll('[data-message-text]');
//         if (transcriptNodes.length > 0) {
//           processTranscriptNodes(transcriptNodes);
//         }
//       }
//     });
//   });
  
//   // Start observing the document for captions/transcript
//   observer.observe(document.body, {
//     childList: true,
//     subtree: true
//   });
// }

// function processTranscriptNodes(nodes) {
//   nodes.forEach(node => {
//     const speaker = node.closest('[data-sender-name]')?.getAttribute('data-sender-name') || 'Unknown';
//     const text = node.getAttribute('data-message-text');
//     const timestamp = new Date().toISOString();
    
//     // Check if this is a new transcript entry
//     const isDuplicate = transcriptData.some(entry => 
//       entry.speaker === speaker && 
//       entry.text === text
//     );
    
//     if (text && !isDuplicate) {
//       transcriptData.push({
//         speaker,
//         text,
//         timestamp
//       });
//     }
//   });
// }

// function startProcessingInterval() {
//   // Process and send data every minute
//   processingInterval = setInterval(() => {
//     if (transcriptData.length > 0) {
//       analyzeAndSendData();
//     }
//   }, 60000); // 1 minute
// }

// function analyzeAndSendData() {
//   // Extract key information from transcript
//   const keyInfo = extractKeyInformation(transcriptData);
  
//   // Send to backend
//   sendToBackend(keyInfo);
// }

// function extractKeyInformation(transcriptData) {
//   // Join all transcript text
//   const fullText = transcriptData.map(entry => entry.text).join(' ');
  
//   // Extract dates (basic regex for date formats)
//   const dateRegex = /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,\s*\d{4})?\b|\b\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}\b|\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;
//   const dates = fullText.match(dateRegex) || [];
  
//   // Extract times
//   const timeRegex = /\b(?:1[0-2]|0?[1-9])(?::[0-5][0-9])?\s*(?:am|pm)\b|\b(?:[01]?[0-9]|2[0-3]):[0-5][0-9]\b/gi;
//   const times = fullText.match(timeRegex) || [];
  
//   // Extract potential next meeting mentions
//   const nextMeetingRegex = /\bnext\s+meeting\b|\bfollow(?:\s*-\s*)?up\s+meeting\b|\bschedule(?:\s*d)?\s+(?:a\s+)?meeting\b|\bmeeting\s+(?:on|at)\b/gi;
//   const nextMeetings = fullText.match(nextMeetingRegex) || [];
  
//   // Extract potential action items
//   const actionItemRegex = /\baction\s+item\b|\btask\b|\btodo\b|\b(?:will|should|must|need\s+to)\s+(?:\w+\s+){0,3}(?:do|prepare|create|make|send|review|update|check|research|investigate|follow\s+up|get|find|contact|call|schedule)\b/gi;
//   const actionItems = fullText.match(actionItemRegex) || [];
  
//   // Extract potential important topics (capitalized phrases)
//   const topicRegex = /\b[A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*)+\b|\b[A-Z]{2,}\b/g;
//   const potentialTopics = fullText.match(topicRegex) || [];
  
//   // Filter out common false positives from topics
//   const commonFalsePositives = ['I', 'I\'m', 'I\'ll', 'I\'ve', 'Google Meet', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
//   const topics = potentialTopics.filter(topic => !commonFalsePositives.includes(topic));
  
//   return {
//     meetingId: window.location.pathname.split('/').pop(),
//     timestamp: new Date().toISOString(),
//     participants: [...new Set(transcriptData.map(entry => entry.speaker))],
//     extractedInfo: {
//       dates,
//       times,
//       nextMeetings,
//       actionItems,
//       topics
//     },
//     transcriptSnippet: transcriptData.slice(-10) // Keep only the last 10 entries for context
//   };
// }

// function sendToBackend(data) {
//   // Send data to your backend
//   // Replace the URL with your actual backend endpoint
//   const backendUrl = 'https://your-backend-url.com/api/meeting-summary';
  
//   fetch(backendUrl, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify(data)
//   })
//   .then(response => {
//     if (!response.ok) {
//       throw new Error('Network response was not ok');
//     }
//     return response.json();
//   })
//   .then(data => {
//     console.log('Summary sent successfully:', data);
//   })
//   .catch(error => {
//     console.error('Error sending summary:', error);
//   });
// }

// function showStatusIndicator() {
//   // Create or show status indicator in the Meet UI
//   let statusIndicator = document.getElementById('meet-summarizer-status');
  
//   if (!statusIndicator) {
//     statusIndicator = document.createElement('div');
//     statusIndicator.id = 'meet-summarizer-status';
//     statusIndicator.className = 'meet-summarizer-status';
//     statusIndicator.innerHTML = `
//       <div class="meet-summarizer-status-icon"></div>
//       <div class="meet-summarizer-status-text">Summarizer active</div>
//     `;
//     document.body.appendChild(statusIndicator);
//   } else {
//     statusIndicator.style.display = 'flex';
//   }
// }

// function hideStatusIndicator() {
//   const statusIndicator = document.getElementById('meet-summarizer-status');
//   if (statusIndicator) {
//     statusIndicator.style.display = 'none';
//   }
// }










// // Global variables
// let isEnabled = false;
// let isInMeeting = false;
// let transcriptData = [];
// let observer = null;
// let processingInterval = null;

// // Initialize on load
// initialize();

// function initialize() {
//   // Check if extension is enabled
//   chrome.storage.local.get(['enabled'], function(result) {
//     isEnabled = result.enabled || false;
//     checkIfInMeeting();
//     setupMeetingDetection();
//     setupMessageListener();
    
//     if (isEnabled && isInMeeting) {
//       startSummarizer();
//     }
//   });
// }

// function checkIfInMeeting() {
//   // Simple check: if URL contains meet.google.com/ and has more characters after that
//   const url = window.location.href;
//   isInMeeting = url.includes('meet.google.com/') && !url.endsWith('meet.google.com/');
// }

// function setupMeetingDetection() {
//   // Listen for URL changes (for single-page apps like Google Meet)
//   let lastUrl = window.location.href;
  
//   // Check for URL changes every second
//   setInterval(() => {
//     const currentUrl = window.location.href;
//     if (currentUrl !== lastUrl) {
//       lastUrl = currentUrl;
//       checkIfInMeeting();
      
//       if (isEnabled && isInMeeting) {
//         startSummarizer();
//       } else if (!isInMeeting) {
//         stopSummarizer();
//       }
//     }
//   }, 1000);
// }

// function setupMessageListener() {
//   // Listen for messages from popup
//   chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//     if (request.action === 'toggleSummarizer') {
//       isEnabled = request.enabled;
      
//       if (isEnabled && isInMeeting) {
//         startSummarizer();
//       } else {
//         stopSummarizer();
//       }
      
//       sendResponse({success: true});
//     }
//     return true;
//   });
// }

// function startSummarizer() {
//   console.log('Starting Meet summarizer...');
//   // Reset transcript data
//   transcriptData = [];
//   setupTranscriptObserver();
//   startProcessingInterval();
//   showStatusIndicator();
// }

// function stopSummarizer() {
//   console.log('Stopping Meet summarizer...');
//   if (observer) {
//     observer.disconnect();
//     observer = null;
//   }
  
//   if (processingInterval) {
//     clearInterval(processingInterval);
//     processingInterval = null;
//   }
  
//   // Send final transcript if any
//   if (transcriptData.length > 0) {
//     sendFullTranscriptToBackend();
//   }
  
//   hideStatusIndicator();
// }

// function setupTranscriptObserver() {
//   // Disconnect existing observer if any
//   if (observer) {
//     observer.disconnect();
//   }
  
//   // Create a new observer to watch for transcript elements
//   observer = new MutationObserver(mutations => {
//     mutations.forEach(mutation => {
//       if (mutation.type === 'childList') {
//         const transcriptNodes = document.querySelectorAll('[data-message-text]');
//         if (transcriptNodes.length > 0) {
//           processTranscriptNodes(transcriptNodes);
//         }
//       }
//     });
//   });
  
//   // Start observing the document for captions/transcript
//   observer.observe(document.body, {
//     childList: true,
//     subtree: true
//   });
// }

// function processTranscriptNodes(nodes) {
//   nodes.forEach(node => {
//     const speaker = node.closest('[data-sender-name]')?.getAttribute('data-sender-name') || 'Unknown';
//     const text = node.getAttribute('data-message-text');
//     const timestamp = new Date().toISOString();
    
//     // Check if this is a new transcript entry
//     const isDuplicate = transcriptData.some(entry => 
//       entry.speaker === speaker && 
//       entry.text === text
//     );
    
//     if (text && !isDuplicate) {
//       transcriptData.push({
//         speaker,
//         text,
//         timestamp
//       });
//     }
//   });
// }

// function startProcessingInterval() {
//   // Process and send data every 5 minutes or when transcript grows significantly
//   processingInterval = setInterval(() => {
//     if (transcriptData.length > 0) {
//       sendFullTranscriptToBackend();
//     }
//   }, 5 * 60 * 1000); // 5 minutes
// }

// function sendFullTranscriptToBackend() {
//   // Collect meeting metadata
//   const meetingMetadata = {
//     meetingId: window.location.pathname.split('/').pop(),
//     startTime: transcriptData[0]?.timestamp,
//     endTime: new Date().toISOString(),
//     participants: [...new Set(transcriptData.map(entry => entry.speaker))]
//   };

//   // Prepare payload
//   const payload = {
//     metadata: meetingMetadata,
//     transcript: transcriptData.map(entry => `${entry.speaker}: ${entry.text}`).join('\n')
//   };
  
//   // Send to backend for Gemini-powered processing
//   const backendUrl = 'https://your-backend-url.com/api/process-meeting';
  
//   fetch(backendUrl, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify(payload)
//   })
//   .then(response => {
//     if (!response.ok) {
//       throw new Error('Network response was not ok');
//     }
//     return response.json();
//   })
//   .then(processedData => {
//     console.log('Meeting processed successfully:', processedData);
    
//     // Optionally, you can handle the processed data here
//     // Such as showing a notification or updating local storage
//   })
//   .catch(error => {
//     console.error('Error processing meeting:', error);
//   });

//   // Clear processed transcripts
//   transcriptData = [];
// }

// function showStatusIndicator() {
//   // Create or show status indicator in the Meet UI
//   let statusIndicator = document.getElementById('meet-summarizer-status');
  
//   if (!statusIndicator) {
//     statusIndicator = document.createElement('div');
//     statusIndicator.id = 'meet-summarizer-status';
//     statusIndicator.className = 'meet-summarizer-status';
//     statusIndicator.innerHTML = `
//       <div class="meet-summarizer-status-icon"></div>
//       <div class="meet-summarizer-status-text">Summarizer active</div>
//     `;
//     document.body.appendChild(statusIndicator);
//   } else {
//     statusIndicator.style.display = 'flex';
//   }
// }

// function hideStatusIndicator() {
//   const statusIndicator = document.getElementById('meet-summarizer-status');
//   if (statusIndicator) {
//     statusIndicator.style.display = 'none';
//   }
// }

// // Add event listener for page unload to send final transcript
// window.addEventListener('beforeunload', () => {
//   if (isEnabled && isInMeeting && transcriptData.length > 0) {
//     sendFullTranscriptToBackend();
//   }
// });






// // Global variables
// let isEnabled = false;
// let isInMeeting = false;
// let transcriptData = [];
// let observer = null;
// let processingInterval = null;

// // Initialize on load
// initialize();

// function initialize() {
//   // Check if extension is enabled
//   chrome.storage.local.get(['enabled'], function(result) {
//     isEnabled = result.enabled || false;
//     checkIfInMeeting();
//     setupMeetingDetection();
//     setupMessageListener();
    
//     if (isEnabled && isInMeeting) {
//       startSummarizer();
//     }
//   });
// }

// function checkIfInMeeting() {
//   // Simple check: if URL contains meet.google.com/ and has more characters after that
//   const url = window.location.href;
//   isInMeeting = url.includes('meet.google.com/') && !url.endsWith('meet.google.com/');
// }

// function setupMeetingDetection() {
//   // Listen for URL changes (for single-page apps like Google Meet)
//   let lastUrl = window.location.href;
  
//   // Check for URL changes every second
//   setInterval(() => {
//     const currentUrl = window.location.href;
//     if (currentUrl !== lastUrl) {
//       lastUrl = currentUrl;
//       checkIfInMeeting();
      
//       if (isEnabled && isInMeeting) {
//         startSummarizer();
//       } else if (!isInMeeting) {
//         stopSummarizer();
//       }
//     }
//   }, 1000);
// }

// function setupMessageListener() {
//   // Listen for messages from popup
//   chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//     if (request.action === 'toggleSummarizer') {
//       isEnabled = request.enabled;
      
//       if (isEnabled && isInMeeting) {
//         startSummarizer();
//       } else {
//         stopSummarizer();
//       }
      
//       sendResponse({success: true});
//     }
//     return true;
//   });
// }

// function startSummarizer() {
//   console.log('Starting Meet summarizer...');
//   // Reset transcript data when starting
//   transcriptData = [];
//   setupTranscriptObserver();
//   startProcessingInterval();
//   showStatusIndicator();
// }

// function stopSummarizer() {
//   console.log('Stopping Meet summarizer...');
//   if (observer) {
//     observer.disconnect();
//     observer = null;
//   }
  
//   if (processingInterval) {
//     clearInterval(processingInterval);
//     processingInterval = null;
//   }
  
//   // Send final transcript when meeting ends
//   if (transcriptData.length > 0) {
//     sendFullTranscriptToBackend();
//   }
  
//   hideStatusIndicator();
// }

// function setupTranscriptObserver() {
//   // Disconnect existing observer if any
//   if (observer) {
//     observer.disconnect();
//   }
  
//   // Create a new observer to watch for transcript elements
//   observer = new MutationObserver(mutations => {
//     mutations.forEach(mutation => {
//       if (mutation.type === 'childList') {
//         const transcriptNodes = document.querySelectorAll('[data-message-text]');
//         if (transcriptNodes.length > 0) {
//           processTranscriptNodes(transcriptNodes);
//         }
//       }
//     });
//   });
  
//   // Start observing the document for captions/transcript
//   observer.observe(document.body, {
//     childList: true,
//     subtree: true
//   });
// }

// function processTranscriptNodes(nodes) {
//   nodes.forEach(node => {
//     const speaker = node.closest('[data-sender-name]')?.getAttribute('data-sender-name') || 'Unknown';
//     const text = node.getAttribute('data-message-text');
//     const timestamp = new Date().toISOString();
    
//     // Check if this is a new transcript entry
//     const isDuplicate = transcriptData.some(entry => 
//       entry.speaker === speaker && 
//       entry.text === text
//     );
    
//     if (text && !isDuplicate) {
//       transcriptData.push({
//         speaker,
//         text,
//         timestamp
//       });
//     }
//   });
// }

// function startProcessingInterval() {
//   // Process and send data every 5 minutes, and keep a running summary
//   processingInterval = setInterval(() => {
//     if (transcriptData.length > 0) {
//       sendFullTranscriptToBackend();
//       console.log(transcriptData);
//     }
//   }, 3000); // 5 minutes
// }

// function sendFullTranscriptToBackend() {
//   // Send full transcript to backend for Gemini-powered summarization
//   const fullTranscriptData = {
//     meetingId: window.location.pathname.split('/').pop(),
//     meetingStart: transcriptData[0]?.timestamp,
//     meetingEnd: new Date().toISOString(),
//     participants: [...new Set(transcriptData.map(entry => entry.speaker))],
//     fullTranscript: transcriptData,
//     extractedInfo: extractKeyInformation(transcriptData)
//   };
//   // Send to backend for Gemini summarization
//   sendToBackend(fullTranscriptData);
  
// }

// function extractKeyInformation(transcriptData) {
//   // Join all transcript text
//   const fullText = transcriptData.map(entry => entry.text).join(' ');
  
//   // Extract dates (basic regex for date formats)
//   const dateRegex = /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,\s*\d{4})?\b|\b\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}\b|\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;
//   const dates = fullText.match(dateRegex) || [];
  
//   // Extract times
//   const timeRegex = /\b(?:1[0-2]|0?[1-9])(?::[0-5][0-9])?\s*(?:am|pm)\b|\b(?:[01]?[0-9]|2[0-3]):[0-5][0-9]\b/gi;
//   const times = fullText.match(timeRegex) || [];
  
//   // Extract potential next meeting mentions
//   const nextMeetingRegex = /\bnext\s+meeting\b|\bfollow(?:\s*-\s*)?up\s+meeting\b|\bschedule(?:\s*d)?\s+(?:a\s+)?meeting\b|\bmeeting\s+(?:on|at)\b/gi;
//   const nextMeetings = fullText.match(nextMeetingRegex) || [];
  
//   // Extract potential action items
//   const actionItemRegex = /\baction\s+item\b|\btask\b|\btodo\b|\b(?:will|should|must|need\s+to)\s+(?:\w+\s+){0,3}(?:do|prepare|create|make|send|review|update|check|research|investigate|follow\s+up|get|find|contact|call|schedule)\b/gi;
//   const actionItems = fullText.match(actionItemRegex) || [];
  
//   // Extract potential important topics (capitalized phrases)
//   const topicRegex = /\b[A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*)+\b|\b[A-Z]{2,}\b/g;
//   const potentialTopics = fullText.match(topicRegex) || [];
  
//   // Filter out common false positives from topics
//   const commonFalsePositives = ['I', 'I\'m', 'I\'ll', 'I\'ve', 'Google Meet', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
//   const topics = potentialTopics.filter(topic => !commonFalsePositives.includes(topic));
  
//   return {
//     dates,
//     times,
//     nextMeetings,
//     actionItems,
//     topics
//   };
// }

// function sendToBackend(data) {
//   // Send data to your backend for Gemini API summarization
//   const backendUrl = 'http://localhost:5000';
  
//   fetch(backendUrl, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify(data)
//   })
//   .then(response => {
//     if (!response.ok) {
//       throw new Error('Network response was not ok');
//     }
//     return response.json();
//   })
//   .then(responseData => {
//     console.log('Full meeting summary processed:', responseData);
//     // Optionally, you could show a notification or store the summary
//   })
//   .catch(error => {
//     console.error('Error sending full meeting summary:', error);
//   });
// }

// function showStatusIndicator() {
//   // Create or show status indicator in the Meet UI
//   let statusIndicator = document.getElementById('meet-summarizer-status');
  
//   if (!statusIndicator) {
//     statusIndicator = document.createElement('div');
//     statusIndicator.id = 'meet-summarizer-status';
//     statusIndicator.className = 'meet-summarizer-status';
//     statusIndicator.innerHTML = `
//       <div class="meet-summarizer-status-icon"></div>
//       <div class="meet-summarizer-status-text">Summarizer active</div>
//     `;
//     document.body.appendChild(statusIndicator);
//   } else {
//     statusIndicator.style.display = 'flex';
//   }
// }

// function hideStatusIndicator() {
//   const statusIndicator = document.getElementById('meet-summarizer-status');
//   if (statusIndicator) {
//     statusIndicator.style.display = 'none';
//   }
// }


// Global variables
let isEnabled = false;
let isInMeeting = false;
let transcriptData = [];
let observer = null;
let processingInterval = null;

// Initialize on load
initialize();

function initialize() {
  // Check if extension is enabled
  chrome.storage.local.get(['enabled'], function(result) {
    isEnabled = result.enabled || false;
    checkIfInMeeting();
    setupMeetingDetection();
    setupMessageListener();
    
    if (isEnabled && isInMeeting) {
      startSummarizer();
    }
  });
}

function checkIfInMeeting() {
  // Simple check: if URL contains meet.google.com/ and has more characters after that
  const url = window.location.href;
  isInMeeting = url.includes('meet.google.com/') && !url.endsWith('meet.google.com/');
}

function setupMeetingDetection() {
  // Listen for URL changes (for single-page apps like Google Meet)
  let lastUrl = window.location.href;
  
  // Check for URL changes every second
  setInterval(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      checkIfInMeeting();
      
      if (isEnabled && isInMeeting) {
        startSummarizer();
      } else if (!isInMeeting) {
        stopSummarizer();
      }
    }
  }, 1000);
}

function setupMessageListener() {
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'toggleSummarizer') {
      isEnabled = request.enabled;
      
      if (isEnabled && isInMeeting) {
        startSummarizer();
      } else {
        stopSummarizer();
      }
      
      sendResponse({success: true});
    }
    return true;
  });
}

function startSummarizer() {
  console.log('Starting Meet summarizer...');
  // Reset transcript data when starting
  transcriptData = [];
  setupTranscriptObserver();
  startProcessingInterval();
  showStatusIndicator();
}

function stopSummarizer() {
  console.log('Stopping Meet summarizer...');
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  
  if (processingInterval) {
    clearInterval(processingInterval);
    processingInterval = null;
  }
  
  // Send final transcript when meeting ends if there's data
  if (transcriptData.length > 0) {
    sendFullTranscriptToBackend();
  }
  
  hideStatusIndicator();
}

function setupTranscriptObserver() {
  // Disconnect existing observer if any
  if (observer) {
    observer.disconnect();
  }
  
  // Create a new observer to watch for caption elements
  observer = new MutationObserver(mutations => {
    // Look for both live captions and transcript panels
    const captionsContainer = document.querySelector('.bh44bd');
    console.log(captionsContainer);
    
    const transcriptContainer = document.querySelector('.TBMuR');
    
    if (captionsContainer) {
      // Process live captions
      processCaptionElements(captionsContainer);
    }
    
    if (transcriptContainer) {
      // Process transcript panel if available
      processTranscriptElements(transcriptContainer);
    }
  });
  
  // Start observing the document with configuration
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

function processCaptionElements(container) {
  // Get all caption text elements
  const captionTexts = container.querySelectorAll('.CNusmb');
  if (!captionTexts || captionTexts.length === 0) return;
  
  // Get the latest caption element
  const latestCaption = captionTexts[captionTexts.length - 1];
  if (!latestCaption) return;
  
  // Try to find the speaker name from DOM structure
  let speaker = 'Unknown';
  const nameElement = container.querySelector('.zs7s8d');
  if (nameElement) {
    speaker = nameElement.textContent.trim();
  }
  
  // Get the caption text
  const text = latestCaption.textContent.trim();
  
  // Only add if not duplicate and not empty
  if (text && text.length > 0) {
    const isDuplicate = transcriptData.some(entry => 
      entry.speaker === speaker && 
      entry.text === text
    );
    
    if (!isDuplicate) {
      transcriptData.push({
        speaker,
        text,
        timestamp: new Date().toISOString()
      });
      console.log(`Captured caption: ${speaker}: ${text}`);
    }
  }
}

function processTranscriptElements(container) {
  // Get all transcript entries
  const transcriptEntries = container.querySelectorAll('.GDPwec');
  if (!transcriptEntries || transcriptEntries.length === 0) return;
  
  transcriptEntries.forEach(entry => {
    // Extract speaker name
    const nameElement = entry.querySelector('.JeByi');
    const speaker = nameElement ? nameElement.textContent.trim() : 'Unknown';
    
    // Extract text content
    const textElement = entry.querySelector('.mYXPze');
    if (!textElement) return;
    
    const text = textElement.textContent.trim();
    
    // Only add if not duplicate and not empty
    if (text && text.length > 0) {
      const isDuplicate = transcriptData.some(existingEntry => 
        existingEntry.speaker === speaker && 
        existingEntry.text === text
      );
      
      if (!isDuplicate) {
        transcriptData.push({
          speaker,
          text,
          timestamp: new Date().toISOString()
        });
        console.log(`Captured transcript entry: ${speaker}: ${text}`);
      }
    }
  });
}

function startProcessingInterval() {
  // Process and send data regularly (every 30 seconds)
  processingInterval = setInterval(() => {
    if (transcriptData.length > 0) {
      sendFullTranscriptToBackend();
    }
  }, 30000); // 30 seconds
}

function sendFullTranscriptToBackend() {
  // Prepare meeting data with transcript and metadata
  const meetingData = {
    meetingId: window.location.pathname.split('/').pop(),
    timestamp: new Date().toISOString(),
    participants: [...new Set(transcriptData.map(entry => entry.speaker))],
    transcript: transcriptData,
    extractedInfo: extractKeyInformation(transcriptData)
  };
  
  // Send to backend
  const backendUrl = 'http://localhost:5000/transcript/add';
  
  fetch(backendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(meetingData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log('Transcript successfully sent to backend:', data);
  })
  .catch(error => {
    console.error('Error sending transcript to backend:', error);
    // Keep the transcript data if sending fails
    // so we can try again in the next interval
  });
}

function extractKeyInformation(transcriptData) {
  // Join all transcript text
  const fullText = transcriptData.map(entry => entry.text).join(' ');
  
  // Extract dates (basic regex for date formats)
  const dateRegex = /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,\s*\d{4})?\b|\b\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}\b|\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;
  const dates = fullText.match(dateRegex) || [];
  
  // Extract times
  const timeRegex = /\b(?:1[0-2]|0?[1-9])(?::[0-5][0-9])?\s*(?:am|pm)\b|\b(?:[01]?[0-9]|2[0-3]):[0-5][0-9]\b/gi;
  const times = fullText.match(timeRegex) || [];
  
  // Extract potential next meeting mentions
  const nextMeetingRegex = /\bnext\s+meeting\b|\bfollow(?:\s*-\s*)?up\s+meeting\b|\bschedule(?:\s*d)?\s+(?:a\s+)?meeting\b|\bmeeting\s+(?:on|at)\b/gi;
  const nextMeetings = fullText.match(nextMeetingRegex) || [];
  
  // Extract potential action items
  const actionItemRegex = /\baction\s+item\b|\btask\b|\btodo\b|\b(?:will|should|must|need\s+to)\s+(?:\w+\s+){0,3}(?:do|prepare|create|make|send|review|update|check|research|investigate|follow\s+up|get|find|contact|call|schedule)\b/gi;
  const actionItems = fullText.match(actionItemRegex) || [];
  
  // Extract potential important topics (capitalized phrases)
  const topicRegex = /\b[A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*)+\b|\b[A-Z]{2,}\b/g;
  const potentialTopics = fullText.match(topicRegex) || [];
  
  // Filter out common false positives from topics
  const commonFalsePositives = ['I', 'I\'m', 'I\'ll', 'I\'ve', 'Google Meet', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const topics = potentialTopics.filter(topic => !commonFalsePositives.includes(topic));
  
  return {
    dates,
    times,
    nextMeetings,
    actionItems,
    topics
  };
}

function showStatusIndicator() {
  // Create or show status indicator in the Meet UI
  let statusIndicator = document.getElementById('meet-summarizer-status');
  
  if (!statusIndicator) {
    statusIndicator = document.createElement('div');
    statusIndicator.id = 'meet-summarizer-status';
    statusIndicator.className = 'meet-summarizer-status';
    statusIndicator.innerHTML = `
      <div class="meet-summarizer-status-icon"></div>
      <div class="meet-summarizer-status-text">Summarizer active</div>
    `;
    document.body.appendChild(statusIndicator);
  } else {
    statusIndicator.style.display = 'flex';
  }
}

function hideStatusIndicator() {
  const statusIndicator = document.getElementById('meet-summarizer-status');
  if (statusIndicator) {
    statusIndicator.style.display = 'none';
  }
}

// Add event listener for page unload to send final transcript
window.addEventListener('beforeunload', () => {
  if (isEnabled && isInMeeting && transcriptData.length > 0) {
    // Using synchronous XHR since we're in beforeunload context
    // Not ideal, but ensures the data gets sent
    const xhr = new XMLHttpRequest();
    const backendUrl = 'http://localhost:5000/api/meeting-transcript/final';
    xhr.open('POST', backendUrl, false); // Synchronous
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    const meetingData = {
      meetingId: window.location.pathname.split('/').pop(),
      timestamp: new Date().toISOString(),
      participants: [...new Set(transcriptData.map(entry => entry.speaker))],
      transcript: transcriptData,
      isFinal: true
    };
    
    try {
      xhr.send(JSON.stringify(meetingData));
      console.log('Final transcript sent before page unload');
    } catch (error) {
      console.error('Error sending final transcript:', error);
    }
  }
});