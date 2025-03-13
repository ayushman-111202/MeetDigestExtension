// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    // Initialize extension state
    chrome.storage.local.set({ enabled: false });
    console.log('Google Meet Summary Assistant installed');
  });
  
  // Listen for tab URL changes to update icon state
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
      updateIconState(tabId, changeInfo.url);
    }
  });
  
  // Listen for tab activation to update icon state
  chrome.tabs.onActivated.addListener(({ tabId }) => {
    chrome.tabs.get(tabId, (tab) => {
      if (tab.url) {
        updateIconState(tabId, tab.url);
      }
    });
  });
  
  // Function to update the extension icon based on whether we're on Google Meet
  function updateIconState(tabId, url) {
    const isMeetPage = url && url.includes('meet.google.com/');
    const isMeeting = isMeetPage && !url.endsWith('meet.google.com/');
    
    if (isMeeting) {
      chrome.action.setIcon({
        tabId: tabId,
        path: {
          16: '/assets/icon-16.png',
          48: '/assets/icon-48.png',
          128: '/assets/icon-128.png'
        }
      });
      chrome.action.setBadgeText({ tabId: tabId, text: '' });
    } else if (isMeetPage) {
      chrome.action.setIcon({
        tabId: tabId,
        path: {
          16: '/assets/icon-16_grayscale.png',
          48: '/assets/icon-48_grayscale.png',
          128: '/assets/icon-128_grayscale.png'
        }
      });
      chrome.action.setBadgeText({ tabId: tabId, text: '' });
    } else {
      chrome.action.setIcon({
        tabId: tabId,
        path: {
          16: '/assets/icon-16_grayscale.png',
          48: '/assets/icon-48_grayscale.png',
          128: '/assets/icon-128_grayscale.png'
        }
      });
      chrome.action.setBadgeText({ tabId: tabId, text: 'OFF' });
      chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: '#5f6368' });
    }
  }