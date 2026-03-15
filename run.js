const fs = require('fs');
const content = fs.readFileSync('__tests__/programLifecycle.test.ts', 'utf8');
console.log(content.includes('enrollmentStatus'));
