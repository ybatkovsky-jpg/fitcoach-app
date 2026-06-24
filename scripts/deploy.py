#!/usr/bin/env python3
"""Deploy fitcoach-app to server using tar pipe (fast)."""

import paramiko
import os
import sys
import io

def main():
    HOST = "64.188.56.25"
    PORT = 22
    USER = "root"
    PASS = "oh4Y9A+-_iHDaJ"
    REMOTE_PATH = "/root/fitcoach-app"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {HOST}:{PORT}...")
    ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
    print("Connected!")

    def run(cmd, check=True):
        print(f"  $ {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=300)
        out = stdout.read().decode()
        err = stderr.read().decode()
        if err:
            print(f"  > {err.strip()[:500]}")
        return out, err

    # 1. Create tar of standalone + static + public locally, pipe to server
    print("\nPackaging and uploading...")

    # Create local tar
    tar_path = "/tmp/fitcoach-deploy.tar.gz"
    os.system(f"cd /home/z/my-project && tar czf {tar_path} -C .next/standalone . && tar czf /tmp/fitcoach-static.tar.gz -C .next/static . && tar czf /tmp/fitcoach-public.tar.gz -C public .")

    sftp = ssh.open_sftp()
    print(f"Uploading standalone ({os.path.getsize(tar_path)//1024}KB)...")
    sftp.put(tar_path, f"/tmp/fitcoach-deploy.tar.gz")
    print(f"Uploading static ({os.path.getsize('/tmp/fitcoach-static.tar.gz')//1024}KB)...")
    sftp.put('/tmp/fitcoach-static.tar.gz', '/tmp/fitcoach-static.tar.gz')
    print(f"Uploading public ({os.path.getsize('/tmp/fitcoach-public.tar.gz')//1024}KB)...")
    sftp.put('/tmp/fitcoach-public.tar.gz', '/tmp/fitcoach-public.tar.gz')
    sftp.close()
    print("Upload complete!")

    # 2. Extract on server
    print("\nExtracting on server...")
    run(f"mkdir -p {REMOTE_PATH}/standalone {REMOTE_PATH}/standalone/.next/static {REMOTE_PATH}/public")
    run(f"tar xzf /tmp/fitcoach-deploy.tar.gz -C {REMOTE_PATH}/standalone --overwrite")
    run(f"tar xzf /tmp/fitcoach-static.tar.gz -C {REMOTE_PATH}/standalone/.next/static --overwrite")
    run(f"tar xzf /tmp/fitcoach-public.tar.gz -C {REMOTE_PATH}/public --overwrite")

    # 3. Restart PM2
    print("\nRestarting app with PM2...")
    run("npm install -g pm2 2>/dev/null || true", check=False)
    run(f"cd {REMOTE_PATH}/standalone && pm2 delete fitcoach 2>/dev/null || true", check=False)
    run(f"cd {REMOTE_PATH}/standalone && PORT=3080 pm2 start server.js --name fitcoach")
    run("pm2 save")

    # 4. Verify
    import time
    time.sleep(3)
    out, _ = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3080/", check=False)
    print(f"\nServer response: HTTP {out.strip()}")
    if '200' in out:
        print("SUCCESS: App is running on http://64.188.56.25:3080/")
    else:
        print("WARNING: Check PM2 logs:")
        run("pm2 logs fitcoach --lines 20 --nostream", check=False)

    # Cleanup
    run("rm -f /tmp/fitcoach-deploy.tar.gz /tmp/fitcoach-static.tar.gz /tmp/fitcoach-public.tar.gz", check=False)

    ssh.close()
    print("Done!")

if __name__ == "__main__":
    main()
