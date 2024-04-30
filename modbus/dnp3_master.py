import time
import random
from pydnp3 import DNP3Master, DNP3Exception

# Define function to generate random data
def generate_random_data():
    return random.randint(0, 100)

# Define function to handle data received by the master
def master_data_handler(data):
    print("Master received data:", data)

# Define function to simulate the master
def simulate_master(master):
    while True:
        data = generate_random_data()
        try:
            master.send_data(data)
            print("Master sent data:", data)
        except DNP3Exception as e:
            print("Error:", e)
        time.sleep(2)  # Simulate a delay between sending data

if __name__ == "__main__":
    try:
        master = DNP3Master("127.0.0.1", 20000, data_handler=master_data_handler)

        master.start()

        # Start simulating master sending data
        simulate_master(master)

        # Keep the main thread running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Exiting...")
    finally:
        master.stop()
