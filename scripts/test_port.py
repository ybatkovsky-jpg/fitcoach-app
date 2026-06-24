import socket

HOST = '64.188.56.25'
PORT = 3080

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.settimeout(10)
sock.connect((HOST, PORT))
# Try reading whatever comes back
try:
    data = sock.recv(4096)
    print(f"Received {len(data)} bytes:")
    print(repr(data[:500]))
except socket.timeout:
    print("No data received (timeout)")
except Exception as e:
    print(f"Error: {e}")
finally:
    sock.close()

# Also try standard SSH port 22
print("\n--- Trying port 22 ---")
sock2 = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock2.settimeout(10)
try:
    sock2.connect((HOST, 22))
    data2 = sock2.recv(4096)
    print(f"Received {len(data2)} bytes:")
    print(repr(data2[:500]))
except socket.timeout:
    print("No data received (timeout)")
except ConnectionRefusedError:
    print("Connection refused on port 22")
except Exception as e:
    print(f"Error: {e}")
finally:
    sock2.close()