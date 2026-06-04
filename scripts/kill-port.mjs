import { execSync } from "child_process";

const port = process.argv[2] || "3003";

if (process.platform === "win32") {
  try {
    const out = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
      encoding: "utf8",
    });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const parts = line.trim().split(/\s+/);
      const listenPid = parts[parts.length - 1];
      if (/^\d+$/.test(listenPid)) pids.add(listenPid);
    }
    for (const listenPid of pids) {
      console.log(`Stopping PID ${listenPid} on port ${port}`);
      execSync(`taskkill /F /PID ${listenPid}`, { stdio: "ignore" });
    }
  } catch {
    /* no listener */
  }
} else {
  try {
    execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: "ignore" });
  } catch {
    /* ignore */
  }
}
