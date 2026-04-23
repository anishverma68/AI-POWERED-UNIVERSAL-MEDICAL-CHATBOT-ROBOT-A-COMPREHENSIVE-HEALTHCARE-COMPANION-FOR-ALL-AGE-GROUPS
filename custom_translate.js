// State
let currentLang = 'en';

window.changeLanguage = function (lang) {
    currentLang = lang;
    translateUI();
    
    // Alert user
    const langs = {
        'en': 'Switched to English',
        'ta': 'தமிழுக்கு மாற்றப்பட்டது (Switched to Tamil)',
        'hi': 'हिंदी में बदल دیا गया (Switched to Hindi)',
        'te': 'తెలుగుకు మార్చబడింది (Switched to Telugu)'
    };
    
    // Add a simple bot message to confirm
    addBotMessage(null, langs[lang] || 'Language changed');
}

async function translateUI() {
    for (const [id, val] of Object.entries(staticUI)) {
        const el = document.getElementById(id);
        if(!el) continue;
        
        let textToTranslate = typeof val === 'string' ? val : val.text;
        let translated = await translateText(textToTranslate, currentLang);
        
        if (typeof val === 'string') {
            // Text node replacement, keeping badges intact if any
            if(id === 'tab-reminders') {
                const badge = el.querySelector('#reminder-badge');
                el.innerText = translated + ' ';
                if(badge) el.appendChild(badge);
            } else {
                el.innerText = translated;
            }
        } else {
            el.setAttribute(val.attr, translated);
        }
    }
    
    // Translate panel headers
    const headers = document.querySelectorAll('.panel-header h1');
    for(const h of headers) {
        if(!h.dataset.orig) h.dataset.orig = h.innerText;
        h.innerText = await translateText(h.dataset.orig, currentLang);
    }
}