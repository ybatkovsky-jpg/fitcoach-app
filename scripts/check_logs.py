#!/usr/bin/env python3
import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('64.188.56.25', 22, 'root', 'oh4Y9A+-_iHDaJ', timeout=15)
def run(cmd):
    i, o, e = ssh.exec_command(cmd, timeout=15)
    print(f'>> {cmd}')
    print(o.read().decode()[:2000])
    err = e.read().decode()
    if err.strip(): print(f'ERR: {err[:1000]}')

run('pm2 status fitcoach 2>&1')
print('--- ERROR LOG ---')
run('tail -50 /root/.pm2/logs/fitcoach-error.log 2>&1')
print('--- OUT LOG (last 20) ---')
run('tail -20 /root/.pm2/logs/fitcoach-out.log 2>&1')
print('--- node_modules check ---')
run('ls /root/fitcoach-app/node_modules/ 2>&1')
ssh.close()