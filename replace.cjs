const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walk(dirPath);
    } else if (dirPath.endsWith('.ts') || dirPath.endsWith('.tsx')) {
      let content = fs.readFileSync(dirPath, 'utf8');
      if (content.includes('dexie-react-hooks')) {
        content = content.replace(/import\s*\{\s*useLiveQuery\s*\}\s*from\s*['"]dexie-react-hooks['"]/g, "import { useLiveQuery } from '@/shared/hooks/use-live-query'");
        fs.writeFileSync(dirPath, content);
      }
    }
  });
}

walk('./src');
console.log('done');
