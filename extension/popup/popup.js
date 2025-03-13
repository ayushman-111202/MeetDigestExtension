document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggle-btn');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const messageElement = document.getElementById('message');
    
    // Check if we're in a Google Meet
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      const isMeetPage = currentTab.url.includes('meet.google.com/');
      const isMeeting = isMeetPage && !currentTab.url.endsWith('meet.google.com/');
      
      // Get current extension status
      chrome.storage.local.get(['enabled'], function(result) {
        const isEnabled = result.enabled || false;
        
        updateUI(isEnabled, isMeeting);
        
        // Add event listener to toggle button
        toggleBtn.addEventListener('click', function() {
          if (!isMeeting) {
            messageElement.style.display = 'block';
            return;
          }
          
          const newStatus = !isEnabled;
          
          // Save the new status
          chrome.storage.local.set({enabled: newStatus}, function() {
            updateUI(newStatus, isMeeting);
            
            // Send message to content script to update its state
            chrome.tabs.sendMessage(currentTab.id, {
              action: 'toggleSummarizer',
              enabled: newStatus
            });
          });
        });
      });
    });
    
    function updateUI(isEnabled, isMeeting) {
      // Update button text
      toggleBtn.textContent = isEnabled ? 'Disable' : 'Enable';
      
      // Update button style
      if (!isMeeting) {
        toggleBtn.classList.add('disabled');
      } else {
        toggleBtn.classList.remove('disabled');
      }
      
      // Update status indicator
      if (isEnabled && isMeeting) {
        statusIndicator.className = 'status-indicator active';
        statusText.textContent = 'Active';
      } else {
        statusIndicator.className = 'status-indicator inactive';
        statusText.textContent = isMeeting ? 'Inactive' : 'Not in a meeting';
      }
      
      // Show/hide message
      messageElement.style.display = !isMeeting ? 'block' : 'none';
    }
  });