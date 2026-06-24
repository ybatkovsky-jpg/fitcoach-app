import paramiko

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
        'cd /root/fitcoach-app && git pull origin main 2>&1 | tail -3',
        'cd /root/fitcoach-app && npm run build 2>&1 | tail -10',
        'pm2 restart fitcoach 2>&1',
    ]

    for cmd in cmds:
        print(f"\n> {cmd[:90]}")
        stdin, stdout, stderr = client.exec_command(cmd, timeout=180)
        out = stdout.read().decode(errors='replace').strip()
        err = stderr.read().decode(errors='replace').strip()
        if out: print(out)
        if err: print(f"ERR: {err}")

    import time; time.sleep(2)
    stdin, stdout, _ = client.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:3080/', timeout=10)
    print(f"\nHTTP status: {stdout.read().decode()}")

except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()