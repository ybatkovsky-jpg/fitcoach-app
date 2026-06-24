import paramiko
import time

HOST = '64.188.56.25'
PORT = 22
USER = 'root'
PASS = 'oh4Y9A+-_iHDaJ'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
    print("Connected!")

    cmds = [
        'cd /root/fitcoach-app && git pull origin main 2>&1 | tail -5',
        'cd /root/fitcoach-app && npm run build 2>&1 | tail -15',
        'pm2 delete fitcoach 2>&1 || true',
        'cd /root/fitcoach-app && pm2 start "npm run start" --name fitcoach 2>&1',
        'pm2 save 2>&1',
    ]
    
    for cmd in cmds:
        print(f"\n> {cmd[:90]}")
        stdin, stdout, stderr = client.exec_command(cmd, timeout=180)
        out = stdout.read().decode(errors='replace').strip()
        err = stderr.read().decode(errors='replace').strip()
        if out: print(out)
        if err: print(f"ERR: {err}")

    time.sleep(3)
    stdin, stdout, stderr = client.exec_command('pm2 list 2>&1', timeout=10)
    print("\n--- Final PM2 Status ---")
    print(stdout.read().decode(errors='replace'))

except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()