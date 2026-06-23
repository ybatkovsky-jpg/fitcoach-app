#!/usr/bin/env python3
import paramiko, time, sys

HOST = "64.188.56.25"
USER = "root"
PASS = "oh4Y9A+-_iHDaJ"
PORT = "3080"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=15)
print("Connected!")

def q(cmd):
    _, out, _ = ssh.exec_command(cmd, timeout=15)
    try:
        r = out.read(4096).decode().strip()
        print(f"  {cmd[:80]}")
        if r: print(f"    {r[:200]}")
    except:
        print(f"  {cmd[:80]} [timeout-ok]")

q(f"fuser -k {PORT}/tcp 2>/dev/null; echo done")
time.sleep(2)
q(f"cd /root/fitcoach-app && nohup npx next start -p {PORT} >/tmp/fitcoach.log 2>&1 & echo bg_started")
time.sleep(6)
q(f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:{PORT}")
q(f"ss -tlnp | grep {PORT}")
q(f"iptables -I INPUT -p tcp --dport {PORT} -j ACCEPT 2>/dev/null; echo ok")

ssh.close()
print(f"\n👉 http://{HOST}:{PORT}")