#!/usr/bin/env python3
"""Deploy from repo clone to server."""
import paramiko, os, subprocess, sys, tempfile, shutil

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
    print('=== 1. Build archive from repo clone ===')
    tmpdir = tempfile.mkdtemp()
    # Copy standalone
    sa = os.path.join(SRC, '.next', 'standalone')
    subprocess.run(f'cp -r {sa}/* {tmpdir}/', shell=True, timeout=120)
    # .next/static
    os.makedirs(os.path.join(tmpdir, '.next', 'static'), exist_ok=True)
    subprocess.run(f'cp -r {os.path.join(SRC, ".next", "static")}/* {tmpdir}/.next/static/', shell=True, timeout=60)
    # public
    pub = os.path.join(SRC, 'public')
    if os.path.isdir(pub):
        subprocess.run(f'cp -r {pub} {tmpdir}/public', shell=True, timeout=60)
    # archive
    archive = '/tmp/fitcoach-deploy.tar.gz'
    r = subprocess.run(f'cd {tmpdir} && tar czf {archive} .', shell=True, capture_output=True, text=True, timeout=120)
    shutil.rmtree(tmpdir)
    if r.returncode != 0:
        print(f'tar err: {r.stderr[:300]}'); sys.exit(1)
    sz = os.path.getsize(archive)
    print(f'  {sz//1024} KB')

    print('=== 2. Connect + Upload ===')
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=30)
    sftp = ssh.open_sftp()
    sftp.put(archive, f'{REMOTE_DIR}/deploy.tar.gz')
    print(f'  Uploaded {sz//1024} KB')
    sftp.close()

    print('=== 3. Extract on server ===')
    ssh_exec(ssh, f'cd {REMOTE_DIR} && rm -rf .next public server.js node_modules package.json && tar xzf deploy.tar.gz && rm deploy.tar.gz', timeout=60)

    print('=== 4. PM2 restart ===')
    ssh_exec(ssh, f'cd {REMOTE_DIR} && pm2 delete fitcoach 2>/dev/null; PORT=3080 pm2 start server.js --name fitcoach && pm2 save', timeout=30)

    print('=== 5. Verify ===')
    out, _, _ = ssh_exec(ssh, 'sleep 2 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3080/', timeout=15)
    print(f'  HTTP: {out.strip()}')
    out2, _, _ = ssh_exec(ssh, f'ls {REMOTE_DIR}/public/exercises/ 2>/dev/null | wc -l', timeout=10)
    print(f'  Exercise images: {out2.strip()} files')
    out3, _, _ = ssh_exec(ssh, 'pm2 jlist | python3 -c "import sys,json;[print(p[\"pm2_env\"][\"status\"],\"port:\",p[\"pm2_env\"].get(\"port\",\"?\")) for p in json.load(sys.stdin) if p[\"name\"]==\"fitcoach\"]"', timeout=10)
    print(f'  PM2: {out3.strip()}')
    ssh.close()
    print(f'\n=== DONE === http://{HOST}:3080/')

if __name__ == '__main__':
    main()