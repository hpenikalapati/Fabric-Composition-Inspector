// Listen for tab updates to trigger badge resets or tab changes
chrome.runtime.onInstalled.addListener(() => {
  console.log('Fabric Composition Inspector installed.');
});

// Message listener from content script to update action badge
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FABRIC_DETECTED' && sender.tab) {
    const tabId = sender.tab.id;
    const count = message.count || 0;
    
    if (count > 0) {
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#10b981' }); // Emerald Green
      chrome.action.setBadgeText({ tabId, text: `${count}%` }); // Shows main fiber percentage
    } else {
      chrome.action.setBadgeText({ tabId, text: '' });
    }
  } else if (message.type === 'FABRIC_NOT_FOUND' && sender.tab) {
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: '' });
  }
});
