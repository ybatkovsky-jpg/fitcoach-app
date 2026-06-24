#!/usr/bin/env python3
import paramiko, time

HOST, PORT, USER, PASS = '64.188.56.25', 22, 'root', 'oh4Y9A+-_iHDaJ'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

def run(cmd, t=30):
    i, o, e = ssh.exec_command(cmd, timeout=t)
    out, err, code = o.read().decode(), e.read().decode(), o.channel.recv_exit_status()
    print(f'>> {cmd[:140]}')
    if out.strip(): print(out[:2000])
    if code != 0 and err.strip(): print(f'ERR: {err[:500]}')
    return code

# Kill ALL pm2 processes
run('pm2 delete all 2>/dev/null; pm2 save')

# Kill anything on port 3080
run('fuser -k 3080/tcp 2>/dev/null; sleep 1')

# Clear old logs
run('rm -f /root/.pm2/logs/fitcoach-*')

# Start fresh
run('cd /root/fitcoach-app && PORT=3080 NODE_ENV=production pm2 start server.js --name fitcoach')

time.sleep(3)

# Check
run('pm2 status')
run('tail -20 /root/.pm2/logs/fitcoach-error.log 2>&1')
out = run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3080/')
print(f'\nHTTP: {out}')

ssh.close()