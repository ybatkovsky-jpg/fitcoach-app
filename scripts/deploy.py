import paramiko
import sys

HOST = '64.188.56.25'
PORT = 3080
USER = 'root'
PASS = 'oh4Y9A+-_iHDaJ'

def deploy():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"Connecting to {HOST}:{PORT}...")
        client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=30)
        print("Connected!")
        
        commands = [
            'cd /root/fitcoach-app && git pull origin main',
            'cd /root/fitcoach-app && npm run build 2>&1 | tail -5',
            'pm2 stop fitcoach 2>/dev/null; cd /root/fitcoach-app && pm2 start npm --name fitcoach -- start',
        ]
        
        for cmd in commands:
            print(f"\n>>> {cmd}")
            stdin, stdout, stderr = client.exec_command(cmd, timeout=300)
            out = stdout.read().decode()
            err = stderr.read().decode()
            if out:
                print(out[-500:] if len(out) > 500 else out)
            if err and 'error' in err.lower():
                print(f"STDERR: {err[-300:]}")
                
        print("\nDeploy completed!")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == '__main__':
    deploy()