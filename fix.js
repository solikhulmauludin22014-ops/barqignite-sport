const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('app/admin');
files.forEach(file => {
  if (file.includes('jadwal') || file.includes('login')) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/text-white(?!(\/|-[a-z]))/g, 'text-neutral-light');
  content = content.replace(/text-white\//g, 'text-neutral-light/');
  content = content.replace(/bg-white\//g, 'bg-neutral-light/');
  content = content.replace(/border-white\//g, 'border-neutral-light/');
  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
});
