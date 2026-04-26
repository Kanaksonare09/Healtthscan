const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (!dirFile.includes('node_modules') && !dirFile.includes('.next')) {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts') || dirFile.endsWith('.css')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const replacements = [
  { from: /bg-\[#1E40AF\]/g, to: 'bg-[#2C3E3E]' },
  { from: /bg-\[#1E3799\]/g, to: 'bg-[#2C3E3E]' },
  { from: /text-\[#2B59FF\]/g, to: 'text-[#4F6F6F]' },
  { from: /bg-\[#2B4BC4\]/g, to: 'bg-[#4F6F6F]' },
  { from: /text-\[#2B4BC4\]/g, to: 'text-[#4F6F6F]' },
  { from: /border-\[#2B4BC4\]/g, to: 'border-[#4F6F6F]' },
  { from: /bg-\[#F5C842\]/g, to: 'bg-[#8FB9A8]' },
  { from: /text-\[#1a1a2e\]/g, to: 'text-[#1F2933]' },
  { from: /hover:bg-\[#f0c030\]/g, to: 'hover:bg-[#7ba091]' },
  { from: /bg-blue-600/g, to: 'bg-[#4F6F6F]' },
  { from: /text-blue-600/g, to: 'text-[#4F6F6F]' },
  { from: /text-blue-800/g, to: 'text-[#3D5A5A]' },
  { from: /text-blue-700/g, to: 'text-[#4F6F6F]' },
  { from: /text-blue-500/g, to: 'text-[#4F6F6F]' },
  { from: /text-blue-400/g, to: 'text-[#8FB9A8]' },
  { from: /text-blue-300/g, to: 'text-[#8FB9A8]' },
  { from: /text-blue-200/g, to: 'text-[#8FB9A8]' },
  { from: /text-blue-100/g, to: 'text-[#E2E8F0]' },
  { from: /bg-blue-50/g, to: 'bg-[#F6F7F5]' },
  { from: /bg-blue-100/g, to: 'bg-[#8FB9A8]/20' },
  { from: /bg-blue-300/g, to: 'bg-[#8FB9A8]' },
  { from: /border-blue-100/g, to: 'border-[#E2E8F0]' },
  { from: /border-blue-200/g, to: 'border-[#E2E8F0]' },
  { from: /border-blue-300/g, to: 'border-[#8FB9A8]' },
  { from: /border-blue-400/g, to: 'border-[#8FB9A8]' },
  { from: /border-blue-600/g, to: 'border-[#4F6F6F]' },
  { from: /border-blue-50/g, to: 'border-[#F6F7F5]' },
  { from: /ring-blue-100/g, to: 'ring-[#8FB9A8]/20' },
  { from: /ring-blue-300/g, to: 'ring-[#8FB9A8]' },
  { from: /ring-blue-600\/5/g, to: 'ring-[#4F6F6F]/10' },
  { from: /shadow-blue-900\/10/g, to: 'shadow-[#2C3E3E]/10' },
  { from: /shadow-blue-900\/20/g, to: 'shadow-[#2C3E3E]/20' },
  { from: /shadow-blue-900\/30/g, to: 'shadow-[#2C3E3E]/30' },
  { from: /bg-\[#F0F4FF\]/g, to: 'bg-[#F6F7F5]' },
  // Purple (used for admin/pathology logic sometimes)
  { from: /bg-purple-50/g, to: 'bg-[#8FB9A8]/10' },
  { from: /text-purple-600/g, to: 'text-[#8FB9A8]' },
  { from: /bg-purple-300/g, to: 'bg-[#8FB9A8]' }
];

const files = walkSync('src');
let modifiedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  
  // also check globals.css for css variables
  if (file.endsWith('globals.css')) {
      content = content.replace(/--primary: #2B59FF;/g, '--primary: #4F6F6F;');
      content = content.replace(/--sidebar: #1E40AF;/g, '--sidebar: #2C3E3E;');
      content = content.replace(/rgba\(43, 89, 255/g, 'rgba(79, 111, 111');
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedFiles++;
    console.log(`Updated ${file}`);
  }
});

console.log(`Finished updating colors in ${modifiedFiles} files.`);
