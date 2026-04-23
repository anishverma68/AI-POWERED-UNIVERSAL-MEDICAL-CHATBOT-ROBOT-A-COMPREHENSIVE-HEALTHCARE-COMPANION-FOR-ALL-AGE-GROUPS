let chatHistory = [];
let isTyping = false;

// Greeting
function initChatbot() {
  addBotMessage(
    null,
    `👋 Hello! I'm **MedBot**, your personal health assistant.\n\nI can provide detailed information about diseases including their **causes**, **symptoms**, **precautions**, and **treatment** options.\n\nTry asking me things like:\n• "Tell me about diabetes"\n• "What causes pneumonia?"\n• "How to treat malaria?"\n• "Symptoms of dengue fever"`
  );
}

// Handle sending a message from the user
function sendMessage() {
  if (isTyping) return;
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  autoResizeInput(input);
  addUserMessage(text);

  // Show typing indicator
  showTypingIndicator();

  // simulated timing for loading before chat gives answers (0.5 to 0.8 seconds)
  const delay = Math.floor(Math.random() * (800 - 500 + 1)) + 500;

  setTimeout(() => {
    hideTypingIndicator();
    processQuery(text);
  }, delay);
}

// Handle Enter key for submission (Shift+Enter for newline)
function handleInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// Route the query to appropriate response
function processQuery(query) {
  const q = query.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|howdy|greetings|good morning|good afternoon|good evening)/.test(q)) {
    addBotMessage(null, `Hello! 👋 I'm MedBot. Ask me about any disease, I'll explain its causes, symptoms, precautions, and treatment. What would you like to know?`);
    return;
  }

  // Help
  if (/^(help|what can you do|what do you know|capabilities)/.test(q)) {
    addBotMessage(null, `I can help you with information about various diseases.\n\nHere are some topics I know about:\n${DISEASE_DATABASE.map(d => `• ${d.name}`).join('\n')}\n\nJust ask naturally — e.g. "Tell me about TB" or "What are diabetes symptoms?"`);
    return;
  }

  // List diseases
  if (/what diseases|list (of )?diseases|what (do you know|can you tell me)/.test(q)) {
    addBotMessage(null, `I have information on the following **${DISEASE_DATABASE.length} diseases**:\n\n${DISEASE_DATABASE.map((d, i) => `${i + 1}. ${d.name}`).join('\n')}\n\nAsk me about any of them!`);
    return;
  }

  // Search the disease database
  const results = searchDiseases(query);

  if (results.length === 0) {
    addBotMessage(null, `🔍 I couldn't find specific information about **"${escapeHtml(query)}"** in my database.\n\nPlease try rephrasing or use the disease name directly. I currently have information on ${DISEASE_DATABASE.length} diseases.\n\nType **"list diseases"** to see all available topics.`, 'warning');
    return;
  }

  if (results.length === 1) {
    renderDiseaseInfo(results[0], query);
  } else {
    // Multiple matches — show the best one and mention others
    renderDiseaseInfo(results[0], query, results.slice(1));
  }
}

// Helper to async translate HTML content safely
async function getTranslatedDiseaseHTML(disease, relatedDiseases) {
  if (typeof currentLang !== 'undefined' && currentLang !== 'en') {
    const dName = await translateText(disease.name, currentLang);
    const dOverview = await translateText(disease.overview, currentLang);
    const hCauses = await translateText('Causes', currentLang);
    const hSymptoms = await translateText('Symptoms', currentLang);
    const hPrecautions = await translateText('Precautions', currentLang);
    const hTreatment = await translateText('Treatment', currentLang);
    const dDisclaimer = await translateText('For educational purposes only. Consult a doctor for actual medical advice.', currentLang);
    
    // Arrays
    const tCauses = await Promise.all(disease.causes.map(c => translateText(c, currentLang)));
    const tSymptoms = await Promise.all(disease.symptoms.map(s => translateText(s, currentLang)));
    const tPrecautions = await Promise.all(disease.precautions.map(p => translateText(p, currentLang)));
    const tTreatment = await Promise.all(disease.treatment.map(t => translateText(t, currentLang)));

    const relatedHtml = relatedDiseases.length > 0
      ? `<div class="related-diseases" style="margin-top:16px;">
          <span class="related-label" style="font-size:12px; color:var(--text-muted); font-weight:600;">${await translateText('Related:', currentLang)}</span>
          ${relatedDiseases.map(d => `<button class="action-chip" style="display:inline-block; margin:4px;" onclick="quickSearch('${d.name}')">${d.name}</button>`).join('')}
        </div>`
      : '';

    return `
      <div class="disease-card">
        <div class="disease-header">
          <div class="disease-title">
            <span class="disease-emoji">${getDiseaseEmoji(disease.name)}</span>
            <h2>${dName}</h2>
          </div>
          <div class="disease-overview" style="font-size:14px; color:var(--text-muted);">${dOverview}</div>
        </div>

        <div class="disease-sections" style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:16px;">
          <div class="disease-section causes">
            <div class="section-header"><span class="section-icon">🔬</span><h3>${hCauses}</h3></div>
            <ul>${tCauses.map(c => `<li>${c}</li>`).join('')}</ul>
          </div>
          <div class="disease-section symptoms">
            <div class="section-header"><span class="section-icon">🩺</span><h3>${hSymptoms}</h3></div>
            <ul>${tSymptoms.map(s => `<li>${s}</li>`).join('')}</ul>
          </div>
          <div class="disease-section precautions">
            <div class="section-header"><span class="section-icon">🛡️</span><h3>${hPrecautions}</h3></div>
            <ul>${tPrecautions.map(p => `<li>${p}</li>`).join('')}</ul>
          </div>
          <div class="disease-section treatment">
            <div class="section-header"><span class="section-icon">💉</span><h3>${hTreatment}</h3></div>
            <ul>${tTreatment.map(t => `<li>${t}</li>`).join('')}</ul>
          </div>
        </div>

        <div class="disease-footer" style="margin-top:20px; font-size:12px; color:var(--text-light); border-top:1px solid var(--border); padding-top:12px;">
          <span class="disclaimer-icon">⚠️</span> <span>${dDisclaimer}</span>
        </div>
        ${relatedHtml}
      </div>
    `;
  }


  chatMessages.appendChild(msgDiv);

  // Animate sections in
  requestAnimationFrame(() => {
    msgDiv.classList.add('visible');
    const sections = msgDiv.querySelectorAll('.disease-section');
    sections.forEach((s, i) => {
      setTimeout(() => s.classList.add('section-visible'), i * 120);
    });
  });


  const chatMessages = document.getElementById('chat-messages');
  const msgDiv = document.createElement('div');
  msgDiv.className = `message bot ${type === 'warning' ? 'warning-message' : ''}`;

  msgDiv.innerHTML = `
    <div class="msg-avatar">🤖</div>
    <div class="msg-content">
      <div class="msg-bubble">${contentText}</div>
    </div>
  `;

  chatMessages.appendChild(msgDiv);
  requestAnimationFrame(() => msgDiv.classList.add('visible'));
  scrollToBottom();
  chatHistory.push({ role: 'bot', text: markdown || html });
}



// Get a relevant emoji for a disease
function getDiseaseEmoji(name) {
  const map = {
    'diabetes': '🩸', 'hypertension': '❤️', 'malaria': '🦟', 'tuberculosis': '🫁',
    'covid': '🦠', 'asthma': '💨', 'dengue': '🦟', 'typhoid': '🌡️',
    'pneumonia': '🫁', 'cholera': '💧', 'hepatitis': '🟡', 'anemia': '🩺',
    'arthritis': '🦴', 'migraine': '🧠', 'depression': '🧠', 'kidney': '🫘',
    'flu': '🤧', 'obesity': '⚖️', 'skin': '🌸', 'gastroenteritis': '🤢', 'vitiligo': '⚪'
  };
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(map)) {
    if (lower.includes(key)) return emoji;
  }
  return '🏥';
}