document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const scriptForm = document.getElementById('new-script-form');
    const scriptNameInput = document.getElementById('script-name');
    const scriptContentInput = document.getElementById('script-content');
    const scriptsList = document.getElementById('scripts-list');
    const themeSelector = document.getElementById('theme');
    const startPracticeBtn = document.getElementById('start-practice');
    const nextLineBtn = document.getElementById('next-line');
    const currentLineEl = document.getElementById('current-line');
    const characterCheckboxes = document.getElementById('character-checkboxes');
    const voiceSelect = document.getElementById('voice-select');
    const timerDisplay = document.getElementById('time-remaining');
    const startRecordingBtn = document.getElementById('start-recording');
    const stopRecordingBtn = document.getElementById('stop-recording');
    const recordingStatusEl = document.getElementById('recording-status');
    const progressBar = document.getElementById('progress-bar');
    const markDifficultBtn = document.getElementById('mark-difficult');
  
    // Global Variables
    let scripts = [];
    let currentScript = null;
    let scriptLines = [];
    let currentLineIndex = 0;
    let practiceCharacters = {};
    let timerInterval;
    let utterance;
    let voices = [];
    let recognition;
    let recordingTranscript = '';
  
    // --- TTS Voice Setup ---
    function loadVoices() {
      voices = speechSynthesis.getVoices();
      voiceSelect.innerHTML = '';
      voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
      });
    }
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  
    // --- Theme Selector ---
    themeSelector.addEventListener('change', function() {
      document.body.className = this.value;
    });
  
    // --- Script Management Functions ---
    function loadScripts() {
      fetch('/api/scripts')
        .then(res => res.json())
        .then(data => {
          scripts = data;
          renderScripts();
        });
    }
  
    function renderScripts() {
      scriptsList.innerHTML = '';
      scripts.forEach(script => {
        const li = document.createElement('li');
        li.textContent = script.name;
        // Load button
        const loadBtn = document.createElement('button');
        loadBtn.textContent = 'Load';
        loadBtn.addEventListener('click', () => loadScript(script));
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteScript(script.id));
        li.append(loadBtn, deleteBtn);
        scriptsList.appendChild(li);
      });
    }
  
    function deleteScript(id) {
      fetch('/api/scripts/' + id, { method: 'DELETE' })
        .then(() => {
          scripts = scripts.filter(s => s.id !== id);
          renderScripts();
        });
    }
  
    function loadScript(script) {
      currentScript = script;
      // Split the content into lines. Lines that are empty are skipped.
      scriptLines = script.content.split('\n').filter(line => line.trim() !== '');
      currentLineIndex = 0;
      prepareCharacterSelection();
    }
  
    scriptForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const newScript = {
        name: scriptNameInput.value,
        content: scriptContentInput.value
      };
      fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newScript)
      })
        .then(res => res.json())
        .then(script => {
          scripts.push(script);
          renderScripts();
          scriptForm.reset();
        });
    });
  
    // --- Character Selection Setup ---
    function prepareCharacterSelection() {
      characterCheckboxes.innerHTML = '';
      practiceCharacters = {}; // reset
      const characters = new Set();
      const sceneRegex = /^Scene\s*\d+/i; // matches "Scene 1", "Scene 2:" etc.
      scriptLines.forEach(line => {
        const trimmed = line.trim();
        // Skip lines that look like scene headings
        if (sceneRegex.test(trimmed)) return;
        const parts = trimmed.split(':');
        if (parts.length > 1) {
          const potentialCharacter = parts[0].trim();
          characters.add(potentialCharacter);
        }
      });
      characters.forEach(char => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.dataset.character = char;
        checkbox.addEventListener('change', () => {
          practiceCharacters[char] = checkbox.checked;
        });
        practiceCharacters[char] = true;
        label.append(checkbox, ' ' + char);
        characterCheckboxes.appendChild(label);
      });
    }
  
    // --- Practice Session Functions ---
    startPracticeBtn.addEventListener('click', function() {
      if (!currentScript) {
        alert('Please load a script first.');
        return;
      }
      currentLineIndex = 0;
      playNextLine();
    });
  
    function playNextLine() {
      // End of session: show summary and log practice
      if (currentLineIndex >= scriptLines.length) {
        currentLineEl.textContent = "Practice Complete!";
        nextLineBtn.disabled = true;
        clearInterval(timerInterval);
        showPracticeSummary();
        savePracticeLog();
        return;
      }
      updateProgress();
      const line = scriptLines[currentLineIndex];
      const parts = line.split(':');
      if (parts.length < 2) {
        // If the line doesn't have a colon, skip it.
        currentLineIndex++;
        playNextLine();
        return;
      }
      const character = parts[0].trim();
      const dialogue = parts.slice(1).join(':').trim();
      currentLineEl.textContent = line;
      // For unchecked (non-practice) characters, use TTS to speak the dialogue.
      if (!practiceCharacters[character]) {
        utterance = new SpeechSynthesisUtterance(dialogue);
        utterance.rate = document.querySelector('input[type="range"]') ? document.querySelector('input[type="range"]').value : 1;
        let selectedVoice = voices[voiceSelect.value] || voices[0];
        utterance.voice = selectedVoice;
        speechSynthesis.speak(utterance);
        utterance.onend = () => {
          nextLineBtn.disabled = false;
          startTimer();
        };
      } else {
        nextLineBtn.disabled = false;
        startTimer();
      }
    }
  
    // Timer: allow up to 5 extra seconds per line
    function startTimer() {
      clearInterval(timerInterval);
      let timeLeft = 5;
      timerDisplay.textContent = timeLeft;
      timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          alert("You've exceeded the extra time limit for this line.");
        }
      }, 1000);
    }
  
    // Next line handling (click or spacebar)
    nextLineBtn.addEventListener('click', nextLineHandler);
    document.addEventListener('keydown', function(e) {
      if (e.code === 'Space' && !nextLineBtn.disabled) {
        e.preventDefault();
        nextLineHandler();
      }
    });
    function nextLineHandler() {
      clearInterval(timerInterval);
      nextLineBtn.disabled = true;
      // If recording is active, stop it.
      if (recognition) {
        recognition.stop();
      }
      currentLineIndex++;
      playNextLine();
    }
  
    // --- Recording Feature (Optional) ---
    startRecordingBtn.addEventListener('click', () => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Speech recognition not supported in this browser.');
        return;
      }
      recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recordingTranscript = '';
      recognition.onresult = function(event) {
        recordingTranscript = event.results[0][0].transcript;
        // Simple verbatim check: case-insensitive inclusion
        const currentExpected = scriptLines[currentLineIndex].toLowerCase();
        if (currentExpected.includes(recordingTranscript.toLowerCase())) {
          recordingStatusEl.textContent = "Matched!";
        } else {
          recordingStatusEl.textContent = "Did not match. Try again.";
        }
      };
      recognition.onerror = function(e) {
        recordingStatusEl.textContent = "Error: " + e.error;
      };
      recognition.start();
      recordingStatusEl.textContent = "Recording...";
      startRecordingBtn.disabled = true;
      stopRecordingBtn.disabled = false;
    });
    stopRecordingBtn.addEventListener('click', () => {
      if (recognition) {
        recognition.stop();
      }
      startRecordingBtn.disabled = false;
      stopRecordingBtn.disabled = true;
    });
  
    // --- Additional Features ---
    // Feature: TTS Speed Control
    const speedControl = document.createElement('input');
    speedControl.type = 'range';
    speedControl.min = 0.5;
    speedControl.max = 2;
    speedControl.step = 0.1;
    speedControl.value = 1;
    speedControl.addEventListener('input', () => {
      if (utterance) {
        utterance.rate = speedControl.value;
      }
    });
    const speedLabel = document.createElement('label');
    speedLabel.textContent = 'TTS Speed: ';
    speedLabel.appendChild(speedControl);
    document.getElementById('tts-controls').appendChild(speedLabel);
  
    // Feature: Progress Bar update
    function updateProgress() {
      const progress = (currentLineIndex / scriptLines.length) * 100;
      progressBar.value = progress;
    }
  
    // Feature: Mark Difficult Lines for later review
    markDifficultBtn.addEventListener('click', () => {
      if (currentScript) {
        currentScript.difficult = currentScript.difficult || [];
        if (!currentScript.difficult.includes(currentLineIndex)) {
          currentScript.difficult.push(currentLineIndex);
          alert("Line marked as difficult.");
          // Save the update
          fetch('/api/scripts/' + currentScript.id, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(currentScript)
          });
        }
      }
    });
  
    // Feature: Save practice log (using localStorage)
    function savePracticeLog() {
      const log = {
        scriptId: currentScript.id,
        timestamp: new Date().toISOString(),
        progress: currentLineIndex
      };
      let logs = JSON.parse(localStorage.getItem('practiceLogs')) || [];
      logs.push(log);
      localStorage.setItem('practiceLogs', JSON.stringify(logs));
    }
  
    // Feature: Show a summary of the practice session at the end.
    function showPracticeSummary() {
      alert(`Practice Summary:
  Script: ${currentScript.name}
  Total Lines: ${scriptLines.length}
  Difficult Lines: ${currentScript.difficult ? currentScript.difficult.join(', ') : 'None'}`);
    }
  
    // Load stored scripts on startup
    loadScripts();
  });
  