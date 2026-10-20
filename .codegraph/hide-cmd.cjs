const cp = require('child_process');

// Forzar windowsHide: true en spawn (cubre spawn, exec, execFile y fork)
const originalSpawn = cp.ChildProcess.prototype.spawn;
cp.ChildProcess.prototype.spawn = function (options) {
  if (options && typeof options === 'object') {
    options.windowsHide = true;
  }
  return originalSpawn.call(this, options);
};

// Forzar windowsHide: true en procesos síncronos (spawnSync, execSync, execFileSync)
const originalSpawnSync = cp.spawnSync;
cp.spawnSync = function (command, args, options) {
  if (args && !Array.isArray(args) && typeof args === 'object') {
    args.windowsHide = true;
  } else if (options && typeof options === 'object') {
    options.windowsHide = true;
  } else {
    options = { windowsHide: true };
  }
  return originalSpawnSync.call(this, command, args, options);
};

