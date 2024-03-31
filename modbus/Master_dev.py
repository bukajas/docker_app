import requests
import random
import time

# Function to authenticate and obtain token
def get_token(url, username, password):
    response = requests.post(url, data={"username": username, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        raise Exception("Authentication failed")

# Main function to send Modbus data
def send_modbus_data():
    token_url = "http://127.0.0.1:8000/token"  # Update with your FastAPI server token URL
    modbus_url = "http://127.0.0.1:8000/modbus"  # Update with your FastAPI server URL
    username = "test"  # Update with your actual username
    password = "test"  # Update with your actual password

    # Authenticate and obtain token
    token = get_token(token_url, username, password)
    print("Authenticated successfully")

    # ! modbus type: 1 for RTU, 2 for TCP
    while True:
        new_coil = 100
        new_temperature = random.uniform(0, 100)
        new_slaveID = random.randint(4,10)
        new_masterID = random.randint(1,3)
        new_modbusType = random.randint(1,2)
        # print(new_temperature)

        # data = {
        #     "coils": [new_coil],  # Example coils data
        #     "temperature_data": [new_temperature],  # Example temperature data
        #     "slaveID": str(new_slaveID),
        #     "masterID": str(new_masterID),
        #     "modbusType": str(new_modbusType)  # Updated to string to match Pydantic model expectations
        # }

        data1 = {
            "lalalal": [new_coil],  # Example coils data
            "temperature_data": [new_temperature],  # Example temperature data
            "slaveID": "1",
            "masterID": "1",
            "modbusType": "1"  # Updated to string to match Pydantic model expectations
        }
        data2 = {
            "coils": [new_coil + random.randint(0,100)],  # Example coils data
            "temperature_data": [new_temperature + random.randint(0,100)],  # Example temperature data
            "slaveID": "2",
            "masterID": "2",
            "modbusType": "2"  # Updated to string to match Pydantic model expectations
        }
        headers = {"Authorization": f"Bearer {token}"}
        response1 = requests.post(modbus_url, json=data1, headers=headers)

        if response1.status_code == 200:
            print("Data sent successfully to FastAPI")
        # else:
        #     print(f"Error sending data to FastAPI: {response2.text}")



        response2 = requests.post(modbus_url, json=data2, headers=headers)
        if response2.status_code == 200:
            print("Data sent successfully to FastAPI")
        # else:
        #     print(f"Error sending data to FastAPI: {response2.text}")


        time.sleep(5)

if __name__ == "__main__":
    send_modbus_data()



# TODO extend it, and make it master and client, with working updating server, that generated random data for now
    

    