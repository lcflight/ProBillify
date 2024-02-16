import fs from 'fs';
import path from 'path';

const nodeModulesPath = path.join(__dirname, 'node_modules');
const modules = fs.readdirSync(nodeModulesPath);

const asarUnpack = modules.map((module) => `**/node_modules/${module}/**/*`);

console.log(asarUnpack);
