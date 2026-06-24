#!/usr/bin/env python3
"""Deploy standalone Next.js correctly."""
import paramiko, os, subprocess, sys, tempfile, shutil, time

HOST, PORT, USER, PASS = '64.188.56.25', 22, 'root', 'oh4Y9A+-_iHDaJ'
REMOTE_DIR = '/root/fitcoach-app'
SRC = '/tmp/fitcoach-checkout'

def ssh_exec(ssh, cmd, timeout=120):
    print(f'  SSH> {cmd[:150]}')
    i, o, e = ssh.exec_command(cmd, timeout=timeout)
    out, err, code = o.read().decode(), e.read().decode(), o.channel.recv_exit_status()
    if code != 0 and err.strip(): print(f'  ERR({code}): {err[:300]}')
    return out, err, code

def main():
    print('=== 1. Archive ===')
    tmpdir = tempfile.mkdtemp()
    sa = os.path.join(SRC, '.next', 'standalone')
    subprocess.run(f'cp -r {sa}/* {tmpdir}/', shell=True, timeout=120)
    subprocess.run(f'cp -r {sa}/.next {tmpdir}/.next/', shell=True, timeout=60)
    os.makedirs(os.path.join(tmpdir, '.next', 'static'), exist_ok=True)
    subprocess.run(f'cp -r {os.path.join(SRC, ".next", "static")}/* {tmpdir}/.next/static/', shell=True, timeout=60)
    pub = os.path.join(SRC, 'public')
    if os.path.isdir(pub):
        subprocess.run(f'cp -r {pub} {tmpdir}/public', shell=True, timeout=60)
    archive = '/tmp/fitcoach-deploy.tar.gz'
    r = subprocess.run(f'cd {tmpdir} && tar czf {archive} .', shell=True, capture_output=True, text=True, timeout=120)
    shutil.rmtree(tmpdir)
    if r.returncode != 0:
        print(f'tar err: {r.stderr}'); sys.exit(1)
    sz = os.path.getsize(archive)
    print(f'  {sz//1024} KB')

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=30)

    print('=== 2. Upload ===')
    sftp = ssh.open_sftp()
    ra = '/tmp/fitcoach-deploy.tar.gz'  # upload to /tmp first!
    sftp.put(archive, ra)
    print(f'  Uploaded {sz//1024} KB')
    sftp.close()

    print('=== 3. Clean remote dir ===')
    ssh_exec(ssh, f'rm -rf {REMOTE_DIR}/* {REMOTE_DIR}/.[!.]* 2>/dev/null; mkdir -p {REMOTE_DIR}', timeout=30)

    print('=== 4. Extract ===')
    ssh_exec(ssh, f'tar xzf /tmp/fitcoach-deploy.tar.gz -C {REMOTE_DIR} && rm /tmp/fitcoach-deploy.tar.gz', timeout=60)

    print('=== 5. Verify structure ===')
    out, _, _ = ssh_exec(ssh, f'ls {REMOTE_DIR}/server.js {REMOTE_DIR}/.next/static/ {REMOTE_DIR}/node_modules/next 2>&1 | head -5', timeout=10)
    print(f'  {out.strip()}')
    nm_count, _, _ = ssh_exec(ssh, f'ls {REMOTE_DIR}/node_modules/ 2>/dev/null | wc -l', timeout=10)
    print(f'  node_modules: {nm_count.strip()} packages')

    print('=== 6. PM2 restart ===')
    ssh_exec(ssh, f'pm2 delete fitcoach 2>/dev/null; cd {REMOTE_DIR} && PORT=3080 NODE_ENV=production pm2 start server.js --name fitcoach && pm2 save', timeout=30)

    print('=== 7. Wait & verify ===')
    time.sleep(3)
    out, _, _ = ssh_exec(ssh, 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3080/', timeout=15)
    print(f'  HTTP: {out.strip()}')
    ssh_exec(ssh, 'pm2 logs fitcoach --lines 15 --nostream 2>&1', timeout=10)

    ssh.close()
    print(f'\n=== DONE === http://{HOST}:3080/')

if __name__ == '__main__':
    main()