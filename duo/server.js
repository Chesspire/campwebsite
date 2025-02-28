const express = require('express');
const fs = require('fs').promises; // Using promises for async file operations
const path = require('path');
const app = express();
const DATA_FILE = path.join(__dirname, 'scripts.json');

app.use(express.json());
app.use(express.static('public'));

// Load existing scripts from file (or create file if missing)
async function loadScripts() {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    // File doesn't exist, create it.
    await fs.writeFile(DATA_FILE, JSON.stringify([]));
  }
  const data = await fs.readFile(DATA_FILE);
  return JSON.parse(data);
}

// Save scripts back to file
async function saveScripts(scripts) {
  await fs.writeFile(DATA_FILE, JSON.stringify(scripts, null, 2));
}

// API: Get all scripts
app.get('/api/scripts', async (req, res) => {
  try {
    const scripts = await loadScripts();
    res.json(scripts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Create a new script
app.post('/api/scripts', async (req, res) => {
  try {
    const scripts = await loadScripts();
    const newScript = req.body;
    newScript.id = Date.now(); // simple unique id
    scripts.push(newScript);
    await saveScripts(scripts);
    res.json(newScript);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Update a script (rename/reorder, etc.)
app.put('/api/scripts/:id', async (req, res) => {
  try {
    const scripts = await loadScripts();
    const scriptId = parseInt(req.params.id);
    const index = scripts.findIndex(s => s.id === scriptId);
    if (index !== -1) {
      scripts[index] = { ...scripts[index], ...req.body };
      await saveScripts(scripts);
      res.json(scripts[index]);
    } else {
      res.status(404).json({ error: 'Script not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Delete a script
app.delete('/api/scripts/:id', async (req, res) => {
  try {
    let scripts = await loadScripts();
    const scriptId = parseInt(req.params.id);
    scripts = scripts.filter(s => s.id !== scriptId);
    await saveScripts(scripts);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
