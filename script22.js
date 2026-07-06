const fs = require('fs');
let css = fs.readFileSync('frontend/src/components/Sidebar.css', 'utf8');

css += `\n
.sidebar.narrow .sidebar-label {
  display: none;
}
.sidebar:not(.narrow) .sidebar-label {
  display: block;
}
`;

fs.writeFileSync('frontend/src/components/Sidebar.css', css);
console.log('Added CSS for labels');
