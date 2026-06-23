#!/usr/bin/env python3
"""Deploy FitCoach to remote server via SSH."""

import paramiko
import sys
import time

HOST = "64.188.56.25"
USER = "root"
PASS = "oh4Y9A+-_iHDaJ"
REPO_URL = "https://github.com/ybatkovsky-jpg/fitcoach-app.git"

def run_cmd(ssh, cmd, timeout=120):
    print(f"  > {cmd[:100]}...")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    if out.strip():
        for line in out.strip().split('\n')[-20:]:
            print(f"    {line}")
    if code != 0 and err.strip():
        for line in err.strip().split('\n')[-10:]:
            print(f"    [ERR] {line}")
    return code, out, err

def main():
    print(f"Connecting to {HOST}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=15)
    print("Connected!")

    # Check environment
    code, out, _ = run_cmd(ssh, "node -v 2>/dev/null || echo 'NO_NODE'")
    if "NO_NODE" in out:
        print("\n=== Installing Node.js 22 ===")
        run_cmd(ssh, "curl -fsSL https://deb.nodesource.com/setup_22.x | bash -", timeout=120)
        run_cmd(ssh, "apt-get install -y nodejs 2>&1 | tail -5", timeout=120)

    code, out, _ = run_cmd(ssh, "node -v && npm -v")
    print(f"  Node: {out.strip().split(chr(10))[0]}")

    # Check if repo already exists
    code, _, _ = run_cmd(ssh, "ls /root/fitcoach-app/package.json 2>/dev/null")
    if code == 0:
        print("\n=== Updating existing repo ===")
        run_cmd(ssh, "cd /root/fitcoach-app && git pull", timeout=30)
    else:
        print("\n=== Cloning repo ===")
        run_cmd(ssh, f"git clone {REPO_URL} /root/fitcoach-app", timeout=60)

    # Install deps
    print("\n=== Installing dependencies ===")
    run_cmd(ssh, "cd /root/fitcoach-app && npm install 2>&1 | tail -5", timeout=180)

    # Build
    print("\n=== Building ===")
    run_cmd(ssh, "cd /root/fitcoach-app && npm run build 2>&1 | tail -10", timeout=180)

    PORT = "3080"

    # Kill old fitcoach process
    run_cmd(ssh, f"pkill -f 'next.*{PORT}' 2>/dev/null; sleep 1")

    # Start with nohup
    print(f"\n=== Starting app on port {PORT} ===")
    run_cmd(ssh, f"cd /root/fitcoach-app && nohup npx next start -p {PORT} > /tmp/fitcoach.log 2>&1 &")
    time.sleep(5)

    # Verify
    code, out, _ = run_cmd(ssh, f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:{PORT}")
    print(f"\n=== Status: HTTP {out.strip()} ===")

    # Check port
    code2, out2, _ = run_cmd(ssh, f"ss -tlnp | grep {PORT}")
    print(f"  Port {PORT}: {out2.strip()}")

    # Check firewall
    run_cmd(ssh, f"ufw allow {PORT}/tcp 2>/dev/null; iptables -I INPUT -p tcp --dport {PORT} -j ACCEPT 2>/dev/null; echo 'Firewall updated'")

    ssh.close()
    print(f"\n✅ FitCoach запущен!")
    print(f"👉 Открой в браузере: http://{HOST}:{PORT}")

if __name__ == "__main__":
    main()