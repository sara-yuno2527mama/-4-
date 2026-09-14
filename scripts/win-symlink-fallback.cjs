"use strict";

const fs = require("node:fs");
const path = require("node:path");

const origSymlink = fs.symlink.bind(fs);
const origSymlinkSync = fs.symlinkSync.bind(fs);
const origPromisesSymlink = fs.promises.symlink.bind(fs.promises);

function copyInstead(target, dest) {
  const absTarget = path.resolve(path.dirname(dest), target);
  if (fs.existsSync(dest)) return;
  try {
    origSymlinkSync(absTarget, dest, "junction");
    return;
  } catch {
    /* fall through to copy */
  }
  const stat = fs.statSync(absTarget);
  if (stat.isDirectory()) {
    fs.cpSync(absTarget, dest, { recursive: true });
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(absTarget, dest);
}

fs.symlinkSync = function symlinkSync(target, dest, type) {
  try {
    return origSymlinkSync(target, dest, type);
  } catch (error) {
    if (error && error.code === "EEXIST") return;
    if (error && error.code === "EPERM") {
      copyInstead(target, dest);
      return;
    }
    throw error;
  }
};

fs.symlink = function symlink(target, dest, type, callback) {
  if (typeof type === "function") {
    callback = type;
    type = undefined;
  }
  origSymlink(target, dest, type, (error) => {
    if (!error) {
      callback?.(null);
      return;
    }
    if (error.code === "EEXIST") {
      callback?.(null);
      return;
    }
    if (error.code === "EPERM") {
      try {
        copyInstead(target, dest);
        callback?.(null);
      } catch (copyError) {
        callback?.(copyError);
      }
      return;
    }
    callback?.(error);
  });
};

fs.promises.symlink = async function symlink(target, dest, type) {
  try {
    return await origPromisesSymlink(target, dest, type);
  } catch (error) {
    if (error && error.code === "EEXIST") return;
    if (error && error.code === "EPERM") {
      copyInstead(target, dest);
      return;
    }
    throw error;
  }
};
