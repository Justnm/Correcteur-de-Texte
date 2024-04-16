/*
document.addEventListener('contextmenu', function(event) {
    var selection = window.getSelection().toString().trim();
    if (selection.length > 0) {  // Si du texte est sélectionné
        chrome.runtime.sendMessage({action: "correctText", text: selection});
    }
}, false);
*/

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "correctText") {
        document.activeElement.value = request.newText;
    }
});
