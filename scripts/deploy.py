import paramiko

HOST = '64.188.56.25'
PORT = 22
USER = 'root'
PASS = 'oh4Y9A+-_iHDaJ'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)

    cmds = [
        'pm2 logs fitcoach --lines 30 --nostream 2>&1',
        'cd /root/fitcoach-app && ls -la .next/standalone/ 2>&1 | head -10',
        'cd /root/fitcoach-app && cat ecosystem.config.js 2>&1 || echo "no ecosystem config"',
    ]
    
    for cmd in cmds:
        print(f"\n> {cmd[:100]}")
        stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
        out = stdout.read().decode(errors='replace').strip()
        if out: print(out)

except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()