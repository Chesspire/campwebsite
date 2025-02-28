const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const DATA_FILE = path.join(__dirname, 'scripts.json');

app.use(express.json());
app.use(express.static('public'));

// Load existing scripts from file (or create file if missing)
function loadScripts() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
  }
  const data = fs.readFileSync(DATA_FILE);
  return JSON.parse(data);
}

// Save scripts back to file
function saveScripts(scripts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(scripts, null, 2));
}

// API: Get all scripts
app.get('/api/scripts', (req, res) => {
  const scripts = loadScripts();
  res.json(scripts);
});

// API: Create a new script
app.post('/api/scripts', (req, res) => {
  const scripts = loadScripts();
  const newScript = req.body;
  newScript.id = Date.now(); // simple unique id
  scripts.push(newScript);
  saveScripts(scripts);
  res.json(newScript);
});

// API: Update a script (rename/reorder/difficult marks, etc.)
app.put('/api/scripts/:id', (req, res) => {
  const scripts = loadScripts();
  const scriptId = parseInt(req.params.id);
  const index = scripts.findIndex(s => s.id === scriptId);
  if (index !== -1) {
    scripts[index] = { ...scripts[index], ...req.body };
    saveScripts(scripts);
    res.json(scripts[index]);
  } else {
    res.status(404).json({ error: 'Script not found' });
  }
});

// API: Delete a script
app.delete('/api/scripts/:id', (req, res) => {
  let scripts = loadScripts();
  const scriptId = parseInt(req.params.id);
  scripts = scripts.filter(s => s.id !== scriptId);
  saveScripts(scripts);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
