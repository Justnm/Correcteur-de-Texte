document.getElementById('clearHistory').addEventListener('click', function() {
    chrome.runtime.sendMessage({action: "clearHistory"});
    document.getElementById('correctionList').innerHTML = '';
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "updateHistory") {
        let newList = request.history.map(item => `<li>${item.original} -> ${item.corrected}</li>`).join('');
        document.getElementById('correctionList').innerHTML = newList;
    }
});

// Demander l'historique actuel à l'ouverture
chrome.runtime.sendMessage({action: "getHistory"});
