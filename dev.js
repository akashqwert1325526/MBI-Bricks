const { spawn } = require('child_process');

function runService(name, command, args, cwd) {
  const process = spawn(command, args, { cwd, shell: true, stdio: 'inherit' });
  process.on('close', (code) => {
    console.log(`[${name}] process exited with code ${code}`);
  });
  return process;
}

console.log('🚀 Starting MBI Bricks Backend & Frontend...');
runService('Backend', 'npm', ['run', 'dev'], './backend');
runService('Frontend', 'npm', ['run', 'dev'], './frontend');
