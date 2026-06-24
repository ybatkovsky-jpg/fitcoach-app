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
        # Kill old next-server on port 3080
        'kill 172885 2>&1 && echo "Killed old process on 3080" || echo "Already dead"',
        
        # Wait and verify
        'sleep 1 && ss -tlnp | grep 3080 2>&1 || echo "Port 3080 is free now"',
        
        # Make the NEW process listen on 3080 instead of 3000
        # Option: restart pm2 with PORT=3080 env var
        'pm2 delete fitcoach 2>&1',
        'cd /root/fitcoach-app && PORT=3080 pm2 start "npm run start" --name fitcoach 2>&1',
        'pm2 save 2>&1',
        
        # Verify
        'sleep 2 && ss -tlnp | grep -E "3000|3080" 2>&1',
        'curl -s -o /dev/null -w "%{http_code}" http://localhost:3080/ 2>&1',
    ]
    
    for cmd in cmds:
        print(f"\n> {cmd[:100]}")
        stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
        out = stdout.read().decode(errors='replace').strip()
        err = stderr.read().decode(errors='replace').strip()
        if out: print(out)
        if err: print(f"ERR: {err}")

except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()