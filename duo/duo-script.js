document.addEventListener('DOMContentLoaded', function() {
  // --- DOM Elements ---
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
  const bookmarkLineBtn = document.getElementById('bookmark-line');
  const viewBookmarksBtn = document.getElementById('view-bookmarks');
  const jumpToBookmarkBtn = document.getElementById('jump-to-bookmark');
  const clearBookmarkBtn = document.getElementById('clear-bookmark');
  const copyLineBtn = document.getElementById('copy-line');
  const toggleOutlineBtn = document.getElementById('toggle-outline');
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
  const fontSizeSlider = document.getElementById('font-size-slider');
  const startRecordingBtn = document.getElementById('start-recording');
  const stopRecordingBtn = document.getElementById('stop-recording');
  const recordingStatusEl = document.getElementById('recording-status');
  const progressBar = document.getElementById('progress-bar');
  const markDifficultBtn = document.getElementById('mark-difficult');
  const outlineView = document.getElementById('outline-view');
  
  // --- Global Variables ---
  let scripts = [];
  let currentScript = null;
  let scriptLines = [];
  let currentLineIndex = 0;
  let practiceCharacters = {}; // keys in lower-case: true if character is practiced
  let mnemonicToggles = {};    // keys in lower-case: true if mnemonic mode is on
  let mnemonicShortcuts = {};  // keys in lower-case: assigned shortcut letter for each character
  let mnemonicCheckboxesRef = {}; // Store references to each mnemonic checkbox, keyed by character.
  let timerInterval;
  let timerActive = false;
  let currentTimeLeft = parseInt(timerLimitInput.value);
  let utterance;
  let voices = [];
  let recognition;
  let recordingTranscript = '';
  
  // --- Theme & Font Size ---
  const savedTheme = localStorage.getItem('theme') || 'theme-dark';
  document.body.className = savedTheme;
  themeSelector.value = savedTheme;
  themeSelector.addEventListener('change', function() {
    document.body.className = this.value;
    localStorage.setItem('theme', this.value);
  });
  fontSizeSlider.addEventListener('input', function() {
    document.getElementById('practice-display').style.fontSize = this.value + "px";
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
    throttledUpdateOutline();
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
  
  // --- Character Selection, Mnemonic Toggle, & Shortcut Input ---
  function prepareCharacterSelection() {
    characterCheckboxes.innerHTML = '';
    practiceCharacters = {};
    mnemonicToggles = {};
    mnemonicShortcuts = {};
    mnemonicCheckboxesRef = {};
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
      const container = document.createElement('div');
      container.className = 'character-option';
      
      // Practice Toggle
      const practiceLabel = document.createElement('label');
      const practiceCheckbox = document.createElement('input');
      practiceCheckbox.type = 'checkbox';
      practiceCheckbox.checked = true;
      practiceCheckbox.dataset.character = char;
      practiceCheckbox.addEventListener('change', () => {
        practiceCharacters[char] = practiceCheckbox.checked;
      });
      practiceCharacters[char] = true;
      practiceLabel.append(practiceCheckbox, ' ' + char);
      
      // Mnemonic Toggle
      const mnemonicLabel = document.createElement('label');
      const mnemonicCheckbox = document.createElement('input');
      mnemonicCheckbox.type = 'checkbox';
      mnemonicCheckbox.dataset.character = char;
      mnemonicCheckbox.addEventListener('change', () => {
        mnemonicToggles[char] = mnemonicCheckbox.checked;
        if (currentScript && scriptLines[currentLineIndex].toLowerCase().startsWith(char + ":")) {
          playLine(currentLineIndex);
        }
      });
      mnemonicToggles[char] = false;
      mnemonicLabel.append(mnemonicCheckbox, ' Mnemonic');
      // Save reference for later toggling via shortcut.
      mnemonicCheckboxesRef[char] = mnemonicCheckbox;
      
      // Shortcut Input
      const shortcutInput = document.createElement('input');
      shortcutInput.type = 'text';
      shortcutInput.placeholder = 'Key';
      shortcutInput.maxLength = 1;
      shortcutInput.style.width = '30px';
      shortcutInput.style.marginLeft = '5px';
      shortcutInput.addEventListener('change', function() {
        let val = this.value.toLowerCase();
        if(val) {
          mnemonicShortcuts[char] = val;
        } else {
          delete mnemonicShortcuts[char];
        }
      });
      shortcutInput.addEventListener('blur', function() {
        let val = this.value.toLowerCase();
        if(!val) {
          delete mnemonicShortcuts[char];
        }
      });
      
      container.appendChild(practiceLabel);
      container.appendChild(mnemonicLabel);
      container.appendChild(shortcutInput);
      
      characterCheckboxes.appendChild(container);
    });
  }
  
  // Helper: Convert text to mnemonic (first letter of each word)
  function toMnemonic(text) {
    return text.split(' ').map(word => word.charAt(0)).join(' ');
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
  
  // --- Throttle for Outline Updates ---
  function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function() {
      const context = this;
      const args = arguments;
      if (!lastRan) {
        func.apply(context, args);
        lastRan = Date.now();
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(function() {
          if ((Date.now() - lastRan) >= limit) {
            func.apply(context, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    }
  }
  const throttledUpdateOutline = throttle(updateOutline, 200);
  
  // --- Outline Update ---
  function updateOutline() {
    if (outlineView.classList.contains('hidden')) return;
    outlineView.innerHTML = "";
    scriptLines.forEach((line, index) => {
      const div = document.createElement('div');
      div.className = "outline-line" + (index === currentLineIndex ? " active" : "");
      div.textContent = `Line ${index + 1}: ${line}`;
      div.addEventListener('click', () => {
        playLine(index);
      });
      outlineView.appendChild(div);
    });
  }
  
  // --- Practice Session Functions ---
  function updateProgress() {
    const progress = (currentLineIndex / scriptLines.length) * 100;
    progressBar.value = progress;
  }
  function cancelTTS() {
    if (utterance) {
      utterance.onend = null;
    }
    speechSynthesis.cancel();
    utterance = null;
  }
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
    let character = parts[0].trim().toLowerCase();
    let dialogue = parts.slice(1).join(':').trim();
    let displayText = mnemonicToggles[character] ? toMnemonic(dialogue) : dialogue;
    currentLineEl.textContent = showLineNumbersToggle.checked ? `Line ${currentLineIndex+1}: ${character}: ${displayText}` : `${character}: ${displayText}`;
    clearInterval(timerInterval);
    timerActive = false;
    currentTimeLeft = parseInt(timerLimitInput.value);
    timerDisplay.textContent = currentTimeLeft;
    toggleTimerBtn.textContent = "Start Timer";
    nextLineBtn.disabled = false;
    cancelTTS();
    if (!pauseTtsToggle.checked && ttsToggle.checked && !practiceCharacters[character]) {
      utterance = new SpeechSynthesisUtterance(parts.slice(1).join(':').trim());
      utterance.rate = speedControl.value;
      let selectedVoice = voices[voiceSelect.value] || voices[0];
      utterance.voice = selectedVoice;
      speechSynthesis.speak(utterance);
      utterance.onend = () => {
        if (!autoAdvanceToggle.checked) nextLineBtn.disabled = false;
      };
    }
    throttledUpdateOutline();
  }
  function playNextLine() {
    if (currentLineIndex >= scriptLines.length - 1) {
      currentLineEl.textContent = "Practice Complete!";
      nextLineBtn.disabled = true;
      clearInterval(timerInterval);
      return;
    }
    playLine(currentLineIndex + 1);
  }
  function playPreviousLine() {
    if (currentLineIndex <= 0) return;
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
    let character = parts[0].trim().toLowerCase();
    cancelTTS();
    if (ttsToggle.checked && !pauseTtsToggle.checked && !practiceCharacters[character]) {
      utterance = new SpeechSynthesisUtterance(parts.slice(1).join(':').trim());
      utterance.rate = speedControl.value;
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
  
  // --- Bookmark Features ---
  bookmarkLineBtn.addEventListener('click', function() {
    if (!currentScript) return;
    if (!currentScript.bookmarks) currentScript.bookmarks = [];
    if (!currentScript.bookmarks.includes(currentLineIndex)) {
      currentScript.bookmarks.push(currentLineIndex);
      alert(`Bookmarked line ${currentLineIndex + 1}`);
      saveScriptsToLocal();
      throttledUpdateOutline();
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
      throttledUpdateOutline();
    }
  });
  
  // --- Fullscreen Toggle ---
  toggleFullscreenBtn.addEventListener('click', function() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        alert(`Error enabling fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  });
  
  // --- Toggle Outline with Smooth Animation ---
  toggleOutlineBtn.addEventListener('click', function() {
    if (outlineView.classList.contains('visible')) {
      outlineView.classList.remove('visible');
      outlineView.classList.add('hidden');
    } else {
      outlineView.classList.remove('hidden');
      outlineView.classList.add('visible');
      throttledUpdateOutline();
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
            alert("Time limit exceeded for this line.");
          }
        }
      }, 1000);
    } else {
      timerActive = false;
      clearInterval(timerInterval);
      toggleTimerBtn.textContent = "Start Timer";
    }
  });
  
  // --- Pause/Resume TTS ---
  pauseTtsToggle.addEventListener('change', function() {
    if (this.checked) {
      replayLineBtn.click();
    } else {
      cancelTTS();
    }
  });
  
  // --- Copy Current Line ---
  copyLineBtn.addEventListener('click', function() {
    const text = currentLineEl.textContent;
    navigator.clipboard.writeText(text).then(() => {
      alert("Current line copied to clipboard!");
    }).catch(err => {
      alert("Failed to copy: " + err);
    });
  });
  
  // --- Keyboard Shortcuts ---
  document.addEventListener('keydown', function(e) {
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    
    // First, check if pressed key matches any mnemonic shortcut.
    for (let char in mnemonicShortcuts) {
      if (mnemonicShortcuts[char] === e.key.toLowerCase()) {
        let checkbox = mnemonicCheckboxesRef[char];
        if (checkbox) {
          checkbox.checked = !checkbox.checked;
          mnemonicToggles[char] = checkbox.checked;
          if (currentScript && scriptLines[currentLineIndex].toLowerCase().startsWith(char + ":")) {
            playLine(currentLineIndex);
          }
          e.preventDefault();
          return;
        }
      }
    }
    // Then handle standard keys.
    if (e.repeat && e.key.toLowerCase() !== "j") return;
    if (e.key === " " && !nextLineBtn.disabled) {
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
      cancelTTS();
      playPreviousLine();
    }
  });
  
  // --- Recording Feature (Optional) ---
  startRecordingBtn.addEventListener('click', () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported.');
      return;
    }
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recordingTranscript = '';
    recognition.onresult = function(event) {
      recordingTranscript = event.results[0][0].transcript;
      const expected = scriptLines[currentLineIndex].toLowerCase();
      recordingStatusEl.textContent = expected.includes(recordingTranscript.toLowerCase())
        ? "Matched!"
        : "Did not match. Try again.";
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
    if (recognition) recognition.stop();
    startRecordingBtn.disabled = false;
    stopRecordingBtn.disabled = true;
  });
  
  // --- TTS Speed Control ---
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
  
  // --- Mark Difficult Lines ---
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
