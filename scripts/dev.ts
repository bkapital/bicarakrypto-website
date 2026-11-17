import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const children: ChildProcess[] = [];
const launch = (args: string[]) => {
  const child = spawn(process.execPath, args, { cwd: root, stdio: 'inherit', env: process.env });
  children.push(child);
  child.once('exit', code => {
    for (const other of children) if (other !== child && !other.killed) other.kill('SIGTERM');
    process.exit(code ?? 1);
  });
};

launch(['--import', 'tsx', 'server.ts']);
launch([path.join(root, 'node_modules/vite/bin/vite.js'), '--port=3000', '--host=0.0.0.0']);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    for (const child of children) child.kill(signal);
  });
}
