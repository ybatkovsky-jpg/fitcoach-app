#!/usr/bin/env python3
import paramiko

HOST, PORT, USER, PASS = '64.188.56.25', 22, 'root', 'oh4Y9A+-_iHDaJ'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

def run(cmd):
    i, o, e = ssh.exec_command(cmd, timeout=30)
    print(f'>> {cmd}')
    print(o.read().decode()[:2000])
    err = e.read().decode()
    if err.strip(): print(f'ERR: {err[:1000]}')

# Check what PM2 is actually running
run('pm2 describe fitcoach 2>&1 | head -30')
print('='*60)
# Check if .next/standalone exists (old structure)
run('ls /root/fitcoach-app/.next/standalone/ 2>&1 | head -10')
# Check server.js location
run('ls -la /root/fitcoach-app/server.js 2>&1')
# Check package.json
run('cat /root/fitcoach-app/package.json 2>&1')

ssh.close()