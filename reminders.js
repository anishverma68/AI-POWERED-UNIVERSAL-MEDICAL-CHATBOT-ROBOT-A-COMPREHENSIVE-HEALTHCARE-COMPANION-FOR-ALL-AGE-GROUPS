// =============================================
//  MEDICINE REMINDER MODULE
//  Storage: localStorage
//  Notifications: Browser Notification API
// =============================================

const REMINDERS_KEY = 'medproject_reminders';
let reminders = [];
let reminderCheckInterval = null;
let notifiedToday = new Set();


// Save reminders to localStorage
function saveReminders() {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

// Add a new reminder
function addReminder(name, dosage, times) {
    const reminder = {
        id: Date.now().toString(),
        name: name.trim(),
        dosage: dosage.trim(),
        times: times.filter(t => t.trim() !== '')
    };
    reminders.push(reminder);
    saveReminders();
    renderReminderList();
    return reminder;
}

// Delete a reminder
function deleteReminder(id) {
    reminders = reminders.filter(r => r.id !== id);
    saveReminders();
    renderReminderList();
}


    list.innerHTML = reminders.map(r => `
    <div class="reminder-card" data-id="${r.id}">
      <div class="reminder-icon">💊</div>
      <div class="reminder-info">
        <div class="reminder-name">${escapeHtml(r.name)}</div>
        ${r.dosage ? `<div class="reminder-dosage">${escapeHtml(r.dosage)}</div>` : ''}
        <div class="reminder-times">
          ${r.times.map(t => `<span class="time-badge">${formatTime(t)}</span>`).join('')}
        </div>
      </div>
      <button class="delete-btn" onclick="deleteReminder('${r.id}')" title="Delete reminder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3,6 5,6 21,6"></polyline>
          <path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"></path>
          <path d="M10,11v6M14,11v6"></path>
          <path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1V6"></path>
        </svg>
      </button>
    </div>
  `).join('');
}


// Check if any reminder should fire right now
function checkReminders() {
    const now = new Date();
    const currentHH = String(now.getHours()).padStart(2, '0');
    const currentMM = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHH}:${currentMM}`;
    const todayKey = now.toDateString();

    reminders.forEach(r => {
        r.times.forEach(t => {
            const key = `${r.id}_${t}_${todayKey}`;
            if (t === currentTime && !notifiedToday.has(key)) {
                notifiedToday.add(key);
                fireNotification(r.name, r.dosage, t);
                showInAppAlert(r.name, r.dosage);
            }
        });
    });

    // Clean up notifiedToday keys from previous days
    const keysToDelete = [...notifiedToday].filter(k => !k.endsWith(todayKey));
    keysToDelete.forEach(k => notifiedToday.delete(k));
}

// Fire a browser notification
function fireNotification(name, dosage, time) {
    if (Notification.permission !== 'granted') return;
    const title = `💊 Medicine Reminder`;
    const body = dosage
        ? `Time to take your medicine: ${name} — ${dosage} at ${formatTime(time)}`
        : `Time to take your medicine: ${name} at ${formatTime(time)}`;

    try {
        new Notification(title, {
            body,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💊</text></svg>',
            badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💊</text></svg>',
            tag: `medreminder_${Date.now()}`,
            requireInteraction: true
        });
    } catch (e) {
        console.warn('Notification error:', e);
    }
}

// Add a new time input row
function addTimeInput() {
    const container = document.getElementById('times-container');
    const input = document.createElement('div');
    input.className = 'time-input-row';
    input.innerHTML = `
    <input type="text" class="time-input" readonly required placeholder="Select specific time" onclick="openTimePicker(this)" style="width:100%; border:1px solid #e5e7eb; border-radius:8px; padding:10px; cursor:pointer;" autocomplete="off">
    <button type="button" class="remove-time-btn" onclick="this.parentElement.remove()">✕</button>
  `;
    container.appendChild(input);
}

// ==================== TIME PICKER LOGIC ====================
let currentActiveTimeInput = null;
let tpSelectedHour = "10";
let tpSelectedMinute = "30";
let tpSelectedPeriod = "AM";
const TP_ITEM_HEIGHT = 54;

function openTimePicker(inputEl) {
    currentActiveTimeInput = inputEl;
    const modal = document.getElementById('time-picker-modal');
    modal.style.display = 'flex';

    if (inputEl.dataset.time) {
        const [h24, m] = inputEl.dataset.time.split(':').map(Number);
        tpSelectedPeriod = h24 >= 12 ? 'PM' : 'AM';
        const h12 = h24 % 12 || 12;
        tpSelectedHour = String(h12).padStart(2, '0');
        tpSelectedMinute = String(m).padStart(2, '0');
        const radio = document.getElementById(tpSelectedPeriod.toLowerCase());
        if (radio) radio.checked = true;
    } else {
        const now = new Date();
        const h24 = now.getHours();
        tpSelectedPeriod = h24 >= 12 ? 'PM' : 'AM';
        const h12 = h24 % 12 || 12;
        tpSelectedHour = String(h12).padStart(2, '0');
        tpSelectedMinute = String(now.getMinutes()).padStart(2, '0');
        const radio = document.getElementById(tpSelectedPeriod.toLowerCase());
        if (radio) radio.checked = true;
    }

    updateTpDisplay();
    setInitialTime(tpSelectedHour, tpSelectedMinute);
}

function closeTimePicker() {
    document.getElementById('time-picker-modal').style.display = 'none';
}


function updateTpDisplay() {
    const display = document.getElementById('tp-display');
    if (display) display.textContent = `${tpSelectedHour}:${tpSelectedMinute} ${tpSelectedPeriod}`;
}

function setInitialTime(hourStr, minStr) {
    const hw = document.getElementById('hours-wheel');
    const mw = document.getElementById('minutes-wheel');
    setTimeout(() => {
        const hIndex = parseInt(hourStr) - 1;
        const mIndex = parseInt(minStr);
        if (hw) { hw.scrollTop = hIndex * TP_ITEM_HEIGHT; handleTpScroll(hw, 'hour'); }
        if (mw) { mw.scrollTop = mIndex * TP_ITEM_HEIGHT; handleTpScroll(mw, 'minute'); }
    }, 10);
}

function saveSelectedTime() {
    if (currentActiveTimeInput) {
        let h24 = parseInt(tpSelectedHour);
        if (tpSelectedPeriod === 'PM' && h24 !== 12) h24 += 12;
        if (tpSelectedPeriod === 'AM' && h24 === 12) h24 = 0;

        const time24 = `${String(h24).padStart(2, '0')}:${tpSelectedMinute}`;
        currentActiveTimeInput.dataset.time = time24;
        currentActiveTimeInput.value = `${tpSelectedHour}:${tpSelectedMinute} ${tpSelectedPeriod}`;
    }

    const btn = document.querySelector('.btn-save');
    if (btn) {
        const originalText = btn.textContent;
        btn.textContent = "Saved ✓";
        btn.style.background = "#555555";
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = "";
            closeTimePicker();
        }, 300);
    } else {
        closeTimePicker();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    generateWheelItems('hours-wheel', 12, true);
    generateWheelItems('minutes-wheel', 59, false);

    document.getElementById('hours-wheel')?.addEventListener('scroll', function () { handleTpScroll(this, 'hour'); });
    document.getElementById('minutes-wheel')?.addEventListener('scroll', function () { handleTpScroll(this, 'minute'); });

    document.querySelectorAll('input[name="ampm"]').forEach(input => {
        input.addEventListener('change', (e) => {
            tpSelectedPeriod = e.target.value;
            updateTpDisplay();
        });
    });
});
