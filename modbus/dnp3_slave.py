import time
import random
from pyDNP3 import DNP3Client, DNP3Exception

# Define function to generate random data
def generate_random_data():
    return random.randint(0, 100)

# Define function to handle data received by the client
def client_data_handler(data):
    print("Client received data:", data)

# Define function to simulate the client
def simulate_client(client):
    while True:
        data = generate_random_data()
        try:
            client.send_data(data)
            print("Client sent data:", data)
        except DNP3Exception as e:
            print("Error:", e)
        time.sleep(3)  # Simulate a delay between sending data

if __name__ == "__main__":
    try:
        client = DNP3Client("127.0.0.1", 20001, data_handler=client_data_handler)

        client.start()

        # Start simulating client sending data
        simulate_client(client)

        # Keep the main thread running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Exiting...")
    finally:
        client.stop()
