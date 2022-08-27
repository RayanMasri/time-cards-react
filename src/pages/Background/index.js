chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  const { type } = request;

  console.log(type);
  switch (type) {
    case 'download':
      chrome.storage.sync.set({ unsaved: false });
      chrome.action.setBadgeBackgroundColor({
        color: '#88CD7A',
      });
      break;
    case 'save':
      chrome.storage.sync.set({ items: request.items });

      if (request.register) {
        chrome.storage.sync.set({ unsaved: true });
        chrome.action.setBadgeBackgroundColor({
          color: '#F7665E',
        });
      }
      break;
    case 'load':
      chrome.storage.sync.get(['items'], function (result) {
        sendResponse(result.items);
      });
      break;
  }

  return true;
});

chrome.action.setBadgeText({ text: '​' });
chrome.storage.sync.get(['unsaved'], function (result) {
  chrome.action.setBadgeBackgroundColor({
    color: result.unsaved ? '#F7665E' : '#88CD7A',
  });
});
