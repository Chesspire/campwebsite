document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const scriptForm = document.getElementById('new-script-form');
    const scriptNameInput = document.getElementById('script-name');
    const scriptContentInput = document.getElementById('script-content');
    const scriptsList = document.getElementById('scripts-list');
    const themeSelector = document.getElementById('theme');
    const exportBtn = document.getElementById('export-scripts');
    const importInput = document.getElementById('import-scripts');
    const searchQuery = document.getElementById('search-query');
    const clearSearchBtn = document.getElementById('clear-search');
    const startPracticeBtn = document.getElementById('start-practice');
    const prevLineBtn = document.getElementById('prev-line');
    const nextLineBtn = document.getElementById('next-line');
    const replayLineBtn = document.getElementById('replay-line');
    const resetPracticeBtn = document.getElementById('reset-practice');
    const viewLogBtn = document.getElementById('view-log');
    const downloadLogBtn = document.getElementById('download-log');
    const clearLogBtn = document.getElementById('clear-log');
    const bookmarkLineBtn = document.getElementById('bookmark-line');
    const viewBookmarksBtn = document.getElementById('view-bookmarks');
    const jumpToBookmarkBtn = document.getElementById('jump-to-bookmark');
    const clearBookmarkBtn = document.getElementById('clear-bookmark');
    const toggleFullscreenBtn = document.getElementById('toggle-fullscreen');
    const currentLineEl = document.getElementById('current-line');
    const characterCheckboxes = document.getElementById('character-checkboxes');
    const voiceSelect = document.getElementById('voice-select');
    const ttsToggle = document.getElementById('tts-toggle');
    const pauseTtsToggle = document.getElementById('pause-tts');
    const timerDisplay = document.getElementById('time-remaining');
    const toggleTimerBtn = document.getElementById('toggle-timer');
    const timerLimitInput = document.getElementById('timer-limit');
    const timerLimitDisplay = document.getElementById('timer-limit-display');
    const autoAdvanceToggle = document.getElementById('auto-advance');
    const showLineNumbersToggle = document.getElementById('show-line-numbers');
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
    let practiceCharacters = {}; // stored as lower-case
    let timerInterval;
    let timerActive = false;
    let currentTimeLeft = parseInt(timerLimitInput.value);
    let utterance;
    let voices = [];
    let recognition;
    let recordingTranscript = '';
    let ttsPaused = false;
  
    // --- Theme Preference (default dark mode) ---
    const savedTheme = localStorage.getItem('theme') || 'theme-dark';
    document.body.className = savedTheme;
    themeSelector.value = savedTheme;
    themeSelector.addEventListener('change', function() {
      document.body.className = this.value;
      localStorage.setItem('theme', this.value);
    });
  
    // --- Local Storage for Scripts ---
    function loadScripts() {
      const stored = localStorage.getItem('scripts');
      scripts = stored ? JSON.parse(stored) : [];
      renderScripts();
    }
    function saveScriptsToLocal() {
      localStorage.setItem('scripts', JSON.stringify(scripts));
    }
  
    // --- Export/Import Scripts ---
    exportBtn.addEventListener('click', () => {
      const dataStr = JSON.stringify(scripts, null, 2);
      const blob = new Blob([dataStr], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scripts.txt';
      a.click();
      URL.revokeObjectURL(url);
    });
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(event) {
        try {
          scripts = JSON.parse(event.target.result);
          saveScriptsToLocal();
          renderScripts();
        } catch (error) {
          alert("Failed to import scripts. Make sure the file is valid JSON.");
        }
      };
      reader.readAsText(file);
    });
  
    // --- Script Search ---
    searchQuery.addEventListener('input', function() {
      const query = this.value.toLowerCase();
      const listItems = scriptsList.getElementsByTagName('li');
      Array.from(listItems).forEach(li => {
        li.style.display = li.textContent.toLowerCase().includes(query) ? "" : "none";
      });
    });
    clearSearchBtn.addEventListener('click', function() {
      searchQuery.value = "";
      const listItems = scriptsList.getElementsByTagName('li');
      Array.from(listItems).forEach(li => li.style.display = "");
    });
  
    // --- Script Management Functions ---
    function renderScripts() {
      scriptsList.innerHTML = '';
      scripts.forEach(script => {
        const li = document.createElement('li');
        li.textContent = script.name;
        const loadBtn = document.createElement('button');
        loadBtn.textContent = 'Load';
        loadBtn.addEventListener('click', () => loadScript(script));
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteScript(script.id));
        li.append(loadBtn, deleteBtn);
        scriptsList.appendChild(li);
      });
    }
    function deleteScript(id) {
      scripts = scripts.filter(s => s.id !== id);
      saveScriptsToLocal();
      renderScripts();
    }
    function loadScript(script) {
      currentScript = script;
      scriptLines = script.content.split('\n').filter(line => line.trim() !== '');
      currentLineIndex = 0;
      prepareCharacterSelection();
    }
    scriptForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const newScript = {
        id: Date.now(),
        name: scriptNameInput.value,
        content: scriptContentInput.value,
        difficult: [],
        bookmarks: []
      };
      scripts.push(newScript);
      saveScriptsToLocal();
      renderScripts();
      scriptForm.reset();
    });
  
    // --- Character Selection Setup (case-insensitive) ---
    function prepareCharacterSelection() {
      characterCheckboxes.innerHTML = '';
      practiceCharacters = {};
      const characters = new Set();
      const sceneRegex = /^Scene\s*\d+/i;
      scriptLines.forEach(line => {
        const trimmed = line.trim();
        if (sceneRegex.test(trimmed)) return;
        const parts = trimmed.split(':');
        if (parts.length > 1) {
          const potentialCharacter = parts[0].trim().toLowerCase();
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
  
    // --- Timer Limit Update ---
    timerLimitInput.addEventListener('input', function() {
      timerLimitDisplay.textContent = this.value;
      currentTimeLeft = parseInt(this.value);
      timerDisplay.textContent = currentTimeLeft;
    });
  
    // --- Practice Session Functions ---
    function updateProgress() {
      const progress = (currentLineIndex / scriptLines.length) * 100;
      progressBar.value = progress;
    }
    function showPracticeSummary() {
      alert(`Practice Summary:
  Script: ${currentScript.name}
  Total Lines: ${scriptLines.length}
  Difficult Lines: ${currentScript.difficult ? currentScript.difficult.join(', ') : 'None'}`);
    }
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
    
    // Cancel any active TTS immediately
    function cancelTTS() {
      if (utterance) {
        utterance.onend = null;
      }
      speechSynthesis.cancel();
      utterance = null;
    }
  
    // --- Flag to skip TTS on backward navigation
    let skipTTSForNav = false;
  
    function playLine(index) {
      if (index < 0 || index >= scriptLines.length) return;
      currentLineIndex = index;
      updateProgress();
      const line = scriptLines[currentLineIndex];
      const parts = line.split(':');
      if (parts.length < 2) {
        playLine(currentLineIndex + 1);
        return;
      }
      const character = parts[0].trim().toLowerCase();
      const dialogue = parts.slice(1).join(':').trim();
      currentLineEl.textContent = showLineNumbersToggle.checked ? `Line ${currentLineIndex+1}: ${line}` : line;
      clearInterval(timerInterval);
      timerActive = false;
      currentTimeLeft = parseInt(timerLimitInput.value);
      timerDisplay.textContent = currentTimeLeft;
      toggleTimerBtn.textContent = "Start Timer";
      nextLineBtn.disabled = false;
      cancelTTS();
      if (!skipTTSForNav && ttsToggle.checked && !ttsPaused && !practiceCharacters[character]) {
        utterance = new SpeechSynthesisUtterance(dialogue);
        utterance.rate = document.querySelector('input[type="range"]') ? document.querySelector('input[type="range"]').value : 1;
        let selectedVoice = voices[voiceSelect.value] || voices[0];
        utterance.voice = selectedVoice;
        speechSynthesis.speak(utterance);
        utterance.onend = () => {
          if (!autoAdvanceToggle.checked) nextLineBtn.disabled = false;
        };
      }
      skipTTSForNav = false;
    }
    function playNextLine() {
      if (currentLineIndex >= scriptLines.length - 1) {
        currentLineEl.textContent = "Practice Complete!";
        nextLineBtn.disabled = true;
        clearInterval(timerInterval);
        showPracticeSummary();
        savePracticeLog();
        return;
      }
      playLine(currentLineIndex + 1);
    }
    function playPreviousLine() {
      if (currentLineIndex <= 0) return;
      skipTTSForNav = true;
      playLine(currentLineIndex - 1);
    }
    startPracticeBtn.addEventListener('click', function() {
      if (!currentScript) {
        alert('Please load a script first.');
        return;
      }
      playLine(0);
    });
    nextLineBtn.addEventListener('click', function() {
      nextLineBtn.disabled = true;
      clearInterval(timerInterval);
      cancelTTS();
      playNextLine();
    });
    prevLineBtn.addEventListener('click', function() {
      clearInterval(timerInterval);
      cancelTTS();
      playPreviousLine();
    });
    replayLineBtn.addEventListener('click', function() {
      const line = scriptLines[currentLineIndex];
      const parts = line.split(':');
      if (parts.length < 2) return;
      const character = parts[0].trim().toLowerCase();
      const dialogue = parts.slice(1).join(':').trim();
      cancelTTS();
      if (ttsToggle.checked && !ttsPaused && !practiceCharacters[character]) {
        utterance = new SpeechSynthesisUtterance(dialogue);
        utterance.rate = document.querySelector('input[type="range"]') ? document.querySelector('input[type="range"]').value : 1;
        let selectedVoice = voices[voiceSelect.value] || voices[0];
        utterance.voice = selectedVoice;
        speechSynthesis.speak(utterance);
      }
    });
    resetPracticeBtn.addEventListener('click', function() {
      clearInterval(timerInterval);
      cancelTTS();
      playLine(0);
    });
    viewLogBtn.addEventListener('click', function() {
      const logs = JSON.parse(localStorage.getItem('practiceLogs')) || [];
      if (logs.length === 0) {
        alert("No practice logs available.");
      } else {
        alert(JSON.stringify(logs, null, 2));
      }
    });
    downloadLogBtn.addEventListener('click', function() {
      const logs = JSON.parse(localStorage.getItem('practiceLogs')) || [];
      if (!logs.length) {
        alert("No logs to download.");
        return;
      }
      let csvContent = "data:text/csv;charset=utf-8,Script ID,Timestamp,Progress\n";
      logs.forEach(l => {
        csvContent += `${l.scriptId},${l.timestamp},${l.progress}\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const a = document.createElement('a');
      a.href = encodedUri;
      a.download = "practice_logs.csv";
      a.click();
    });
    clearLogBtn.addEventListener('click', function() {
      localStorage.removeItem('practiceLogs');
      alert("Practice log cleared.");
    });
  
    // --- Bookmark Features ---
    bookmarkLineBtn.addEventListener('click', function() {
      if (!currentScript) return;
      if (!currentScript.bookmarks) currentScript.bookmarks = [];
      if (!currentScript.bookmarks.includes(currentLineIndex)) {
        currentScript.bookmarks.push(currentLineIndex);
        alert(`Bookmarked line ${currentLineIndex + 1}`);
        saveScriptsToLocal();
      } else {
        alert("This line is already bookmarked.");
      }
    });
    viewBookmarksBtn.addEventListener('click', function() {
      if (!currentScript || !currentScript.bookmarks || !currentScript.bookmarks.length) {
        alert("No bookmarks available.");
        return;
      }
      let bmList = currentScript.bookmarks.map(i => `Line ${i + 1}`).join("\n");
      alert(`Bookmarked Lines:\n${bmList}`);
    });
    jumpToBookmarkBtn.addEventListener('click', function() {
      if (!currentScript || !currentScript.bookmarks || !currentScript.bookmarks.length) {
        alert("No bookmarks available.");
        return;
      }
      let bookmarksStr = currentScript.bookmarks.map(i => `Line ${i + 1}`).join("\n");
      let input = prompt(`Enter the line number to jump to:\n${bookmarksStr}`);
      if (input !== null) {
        let lineNum = parseInt(input);
        if (!isNaN(lineNum)) {
          let index = lineNum - 1;
          if (currentScript.bookmarks.includes(index)) {
            playLine(index);
          } else {
            alert("That line is not bookmarked.");
          }
        }
      }
    });
    clearBookmarkBtn.addEventListener('click', function() {
      if (!currentScript || !currentScript.bookmarks) {
        alert("No bookmarks to clear.");
        return;
      }
      let input = prompt(`Enter the line number to clear bookmark (or "all" to clear all):`);
      if (input !== null) {
        if (input.toLowerCase() === "all") {
          currentScript.bookmarks = [];
          alert("All bookmarks cleared.");
        } else {
          let lineNum = parseInt(input);
          if (!isNaN(lineNum)) {
            let index = lineNum - 1;
            currentScript.bookmarks = currentScript.bookmarks.filter(i => i !== index);
            alert(`Bookmark for line ${lineNum} cleared.`);
          }
        }
        saveScriptsToLocal();
      }
    });
  
    // --- Fullscreen Toggle ---
    toggleFullscreenBtn.addEventListener('click', function() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          alert(`Error attempting to enable fullscreen mode: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    });
  
    // --- Timer Toggle ---
    toggleTimerBtn.addEventListener('click', function() {
      if (!timerActive) {
        timerActive = true;
        toggleTimerBtn.textContent = "Pause Timer";
        timerInterval = setInterval(() => {
          currentTimeLeft--;
          timerDisplay.textContent = currentTimeLeft;
          if (currentTimeLeft <= 0) {
            clearInterval(timerInterval);
            timerActive = false;
            toggleTimerBtn.textContent = "Start Timer";
            if (autoAdvanceToggle.checked) {
              playNextLine();
            } else {
              alert("You've exceeded the extra time limit for this line.");
            }
          }
        }, 1000);
      } else {
        timerActive = false;
        clearInterval(timerInterval);
        toggleTimerBtn.textContent = "Start Timer";
      }
    });
  
    // --- Pause/Resume TTS Toggle ---
    pauseTtsToggle.addEventListener('change', function() {
      ttsPaused = this.checked ? false : true;
      if (ttsPaused) {
        cancelTTS();
      } else {
        // If resuming, replay current line's TTS if applicable.
        replayLineBtn.click();
      }
    });
  
    // --- Keyboard Shortcuts ---
    document.addEventListener('keydown', function(e) {
      // For keys other than "j", ignore repeated events.
      if (e.repeat && e.key.toLowerCase() !== "j") return;
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
      if (e.key === " " && !nextLineBtn.disabled) {  // Spacebar for next line
        e.preventDefault();
        cancelTTS();
        playNextLine();
      }
      if (e.key.toLowerCase() === "k" && !nextLineBtn.disabled) {
        e.preventDefault();
        cancelTTS();
        playNextLine();
      }
      if (e.key.toLowerCase() === "j") {
        e.preventDefault();
        // Directly call previous-line function without delay.
        cancelTTS();
        playPreviousLine();
      }
    });
  
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
  
    // --- Additional Feature: TTS Speed Control ---
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
  
    // --- Additional Feature: Mark Difficult Lines ---
    markDifficultBtn.addEventListener('click', () => {
      if (currentScript) {
        currentScript.difficult = currentScript.difficult || [];
        if (!currentScript.difficult.includes(currentLineIndex)) {
          currentScript.difficult.push(currentLineIndex);
          alert("Line marked as difficult.");
          scripts = scripts.map(s => s.id === currentScript.id ? currentScript : s);
          saveScriptsToLocal();
        }
      }
    });
  
    loadScripts();
  });
  