#!/usr/bin/env python3
"""Deploy fitcoach-app to server via SSH (paramiko)."""
import paramiko
import os
import sys
import subprocess

HOST = '64.188.56.25'
PORT = 22
USER = 'root'
PASS = 'oh4Y9A+-_iHDaJ'
REMOTE_DIR = '/root/fitcoach-app'
LOCAL_PROJECT = '/home/z/my-project'
STANDALONE_DIR = os.path.join(LOCAL_PROJECT, '.next', 'standalone')
STATIC_DIR = os.path.join(LOCAL_PROJECT, '.next', 'static')
PUBLIC_DIR = os.path.join(LOCAL_PROJECT, 'public')

def run_ssh(cmd, timeout=120):
    """Execute command on remote server."""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
    print(f"  SSH> {cmd[:100]}...")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    ssh.close()
    if code != 0:
        print(f"  ERROR (code {code}): {err[:500]}")
    return out, err, code

def scp_upload(local_path, remote_path):
    """Upload a file/directory via SFTP."""
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
    sftp = ssh.open_sftp()
    
    def upload_dir(local_dir, remote_dir):
        # Ensure remote dir exists
        try:
            sftp.stat(remote_dir)
        except FileNotFoundError:
            sftp.mkdir(remote_dir)
        
        for item in os.listdir(local_dir):
            lp = os.path.join(local_dir, item)
            rp = remote_dir + '/' + item
            if os.path.isdir(lp):
                upload_dir(lp, rp)
            else:
                print(f"  UP> {rp}")
                sftp.put(lp, rp)
    
    upload_dir(local_path, remote_path)
    sftp.close()
    ssh.close()

def main():
    print("=== Deploying fitcoach-app ===")
    
    # 1. Ensure remote directory exists
    print("\n[1/6] Preparing remote directory...")
    run_ssh(f'mkdir -p {REMOTE_DIR}')
    
    # 2. Upload standalone build
    print("\n[2/6] Uploading standalone build...")
    if not os.path.isdir(STANDALONE_DIR):
        print(f"ERROR: {STANDALONE_DIR} not found. Run 'next build' first.")
        sys.exit(1)
    scp_upload(STANDALONE_DIR, REMOTE_DIR)
    
    # 3. Upload static files
    print("\n[3/6] Uploading static files...")
    scp_upload(STATIC_DIR, REMOTE_DIR + '/.next/static')
    
    # 4. Upload public files
    print("\n[4/6] Uploading public files...")
    scp_upload(PUBLIC_DIR, REMOTE_DIR + '/public')
    
    # 5. Restart PM2
    print("\n[5/6] Restarting PM2...")
    run_ssh(f'cd {REMOTE_DIR} && pm2 delete fitcoach 2>/dev/null; PORT=3080 pm2 start server.js --name fitcoach && pm2 save', timeout=30)
    
    # 6. Verify
    print("\n[6/6] Verifying...")
    out, err, code = run_ssh('pm2 status fitcoach 2>/dev/null | head -5', timeout=10)
    print(f"  PM2 status:\n{out}")
    
    print("\n=== Deploy complete! ===")
    print(f"App should be at http://{HOST}:3080/")

if __name__ == '__main__':
    main()
