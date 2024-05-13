import requests
from requests.auth import HTTPBasicAuth  # Import for basic authentication

# Telegraf server URL
url = 'https://localhost:8186/telegraf'

# Data you want to send
data = 'weather,location=us-midwest temperature=82 1465839830100400200'
auth = HTTPBasicAuth('test', 'test')  # Basic authentication
# Path to your client certificate and key
client_cert = 'modbus/client_modbus.crt'  # Client certificate file
client_key = 'modbus/client_modbus.key'   # Client private key file
verify='CA/ca.pem'  # Path to your CA certificate that signed the server's cert
# Set up the SSL configuration including the client certificate and key
cert = (client_cert, client_key)

try:
    # Send data using POST request
    response = requests.post(url, data=data, auth=auth, cert=cert, verify=verify)  # Set verify to False if you use self-signed certificates and haven't set up CA verification
    print(f"Response Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except requests.exceptions.RequestException as e:
    print(f"Failed to send data: {e}")
