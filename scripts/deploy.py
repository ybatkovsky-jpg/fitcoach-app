#!/usr/bin/env python3
"""Deploy fitcoach-app: archive all needed dirs, upload, extract, PM2 restart."""
import paramiko, os, subprocess, sys, tempfile, shutil

HOST, PORT, USER, PASS = '64.188.56.25', 22, 'root', 'oh4Y9A+-_iHDaJ'
REMOTE_DIR = '/root/fitcoach-app'
LOCAL = '/home/z/my-project'

def ssh_exec(ssh, cmd, timeout=120):
    print(f'  SSH> {cmd[:140]}')
    i, o, e = ssh.exec_command(cmd, timeout=timeout)
    out, err, code = o.read().decode(), e.read().decode(), o.channel.recv_exit_status()
    if code != 0 and err.strip(): print(f'  ERR({code}): {err[:300]}')
    return out, err, code

def main():
    print('=== 1. Build archive ===')
    tmpdir = tempfile.mkdtemp()
    # Copy standalone into tmpdir
    standalone_src = os.path.join(LOCAL, '.next', 'standalone')
    subprocess.run(f'cp -r {standalone_src}/* {tmpdir}/', shell=True, timeout=120)
    # Ensure .next/static exists
    os.makedirs(os.path.join(tmpdir, '.next', 'static'), exist_ok=True)
    static_src = os.path.join(LOCAL, '.next', 'static')
    subprocess.run(f'cp -r {static_src}/* {tmpdir}/.next/static/', shell=True, timeout=60)
    # Copy public
    pub_src = os.path.join(LOCAL, 'public')
    if os.path.isdir(pub_src):
        subprocess.run(f'cp -r {pub_src} {tmpdir}/public', shell=True, timeout=60)
    # Archive
    archive = '/tmp/fitcoach-deploy.tar.gz'
    r = subprocess.run(f'cd {tmpdir} && tar czf {archive} .', shell=True, capture_output=True, text=True, timeout=120)
    if r.returncode != 0:
        print(f'tar failed: {r.stderr[:300]}'); shutil.rmtree(tmpdir); sys.exit(1)
    sz = os.path.getsize(archive)
    print(f'  Archive: {sz//1024} KB')
    shutil.rmtree(tmpdir)

    print('=== 2. Connect + Upload ===')
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=30)
    sftp = ssh.open_sftp()
    ra = f'{REMOTE_DIR}/deploy.tar.gz'
    sftp.put(archive, ra)
    print(f'  Uploaded {sz//1024} KB')
    sftp.close()

    print('=== 3. Extract ===')
    ssh_exec(ssh, f'cd {REMOTE_DIR} && rm -rf .next public server.js node_modules package.json && tar xzf deploy.tar.gz && rm deploy.tar.gz', timeout=60)

    print('=== 4. PM2 restart ===')
    ssh_exec(ssh, f'cd {REMOTE_DIR} && pm2 delete fitcoach 2>/dev/null; PORT=3080 pm2 start server.js --name fitcoach && pm2 save', timeout=30)

    print('=== 5. Verify ===')
    out, _, _ = ssh_exec(ssh, 'sleep 2 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3080/', timeout=15)
    print(f'  HTTP: {out.strip()}')
    out2, _, _ = ssh_exec(ssh, f'ls {REMOTE_DIR}/public/exercises/ 2>/dev/null | wc -l', timeout=10)
    print(f'  Exercise images: {out2.strip()} files')
    ssh.close()
    print(f'=== DONE === http://{HOST}:3080/')

if __name__ == '__main__':
    main()
