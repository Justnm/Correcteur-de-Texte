var history = [];

// Listener pour les messages provenant des scripts de contenu

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "correctText") {
        correctText(request.text).then(correctedText => {
            // Assurez-vous que correctedText est une chaîne
            correctedText = typeof correctedText === 'string' ? correctedText : request.text;

            // Enregistre l'original et le corrigé dans l'historique
            history.push({original: request.text, corrected: correctedText});

            // Envoie le texte corrigé à content.js pour remplacement
            chrome.tabs.sendMessage(sender.tab.id, {action: "replaceText", newText: correctedText});
            sendResponse({correctedText: correctedText});
        });
        return true;  // Indique que la réponse sera envoyée de manière asynchrone
    } else if (request.action === "clearHistory") {
        history = [];  // Efface l'historique
    } else if (request.action === "getHistory") {
        sendResponse({history: history});
    }
});


// Création d'un menu contextuel pour la sélection de texte
chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        id: "correctText",
        title: "Corriger ce texte",
        contexts: ["selection"]
    });
});

// Gestion du clic sur l'option du menu contextuel
chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === "correctText" && info.selectionText) {
        correctText(info.selectionText).then(correctedText => {
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                function: updateTextOnPage,
                args: [info.selectionText, correctedText]
            });
        });
    }
});

// Fonction pour corriger le texte via l'API
async function correctText(textToTranslate) {
    const apiURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=AIzaSyD2R_qaM6e6mBQuuucF4Ex6F-aUsq9tN-c';

    try {
        const response = await fetch(apiURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "contents": [{
                    "parts": [
                        {"text": ` Corriger les fautes d'orthographe et améliorer la structure de la langue sans ajouter de contenu supplémentaire. Si jamais le texte ne peut être corrigé pour une raison quelconque, retourne le texte original Dans aucun cas tu ne dois ajouter d'autre information. Voici le texte pour la Corriger < : "${textToTranslate} " > `}
                    ]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(` La réponse du réseau n'était pas correcte ${response.statusText} `);
        }

        const data = await response.json();
        
        console.log( data.candidates[0].content.parts[0].text );

        const text = data.candidates[0].content.parts[0].text.trim().replace(/"/g, '');

        console.log("Texte corrigé : ", text);
        return text;

    } catch (error) {
        console.error('Erreur lors de la récupération du texte corrigé :', error);
        return textToTranslate;  // Retourner le texte original en cas d'erreur
    }
}

// Fonction pour mettre à jour le texte sur la page
/*
function updateTextOnPage(originalText, correctedText) {
    document.body.innerHTML = document.body.innerHTML.replace(originalText, correctedText);
}
*/

// Fonction pour mettre à jour le texte sur la page
// Fonction pour mettre à jour le texte sur la page en ciblant uniquement l'élément sélectionné
function updateTextOnPage(originalText, correctedText) {
    const selection = window.getSelection(); 
    if (!selection.rangeCount) return; // S'il n'y a pas de sélection, ne rien faire

    let range = selection.getRangeAt(0); // Prend la première sélection
    let textNode = range.startContainer;

    // Assurez-vous que le nœud de texte est un élément ou descend jusqu'à trouver un nœud de texte
    while (textNode.nodeType !== Node.TEXT_NODE) {
        if (textNode.nodeType === Node.ELEMENT_NODE && textNode.childNodes.length) {
            textNode = textNode.childNodes[0];
        } else {
            return; // S'il n'y a pas de nœud de texte, sortir
        }
    }

    // Crée un nouveau nœud de texte avec le texte corrigé et remplace l'ancien nœud de texte
    const newTextNode = document.createTextNode(textNode.textContent.replace(originalText, correctedText));
    textNode.parentNode.replaceChild(newTextNode, textNode);


}
