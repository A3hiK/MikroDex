const fs = require('fs');
const path = require('path');

const replacements = {
  'bg-win95-teal': 'bg-primary',
  'bg-win95-navy': 'bg-primaryHover',
  'bg-win95-silver': 'bg-surface',
  'bg-win95-window': 'bg-surface',
  'bg-win95-gray': 'bg-border',
  'text-win95-teal': 'text-primary',
  'text-win95-navy': 'text-primaryHover',
  'text-win95-captiontext': 'text-text',
  'text-win95-windowtext': 'text-text',
  'text-win95-gray': 'text-textMuted',
  'border-win95-gray': 'border-border',
  'border-win95-darkgray': 'border-border',
  'border-l-win95-teal': 'border-l-primary',
  'border-l-win95-navy': 'border-l-primaryHover',
  'win95-desktop': 'bg-background text-text',
  'win95-window': 'card-glass',
  'win95-titlebar-button': 'btn-icon',
  'win95-titlebar': 'flex items-center justify-between px-4 py-2 bg-surfaceHover border-b border-border font-medium',
  'win95-statusbar': 'flex items-center justify-between bg-surface border-t border-border px-4 py-2 text-xs text-textMuted',
  'text-win95-white': 'text-text',
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace keys
    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(key, 'g');
      content = content.replace(regex, value);
    }
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
