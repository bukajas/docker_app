def group_data(data):
    """
    Groups data entries by all keys except time-related keys into a dictionary of lists.

    Parameters:
    data (list of dict): The list of dictionaries containing the data.

    Returns:
    dict: A dictionary where each key is a tuple of key-value pairs (except time-related keys),
          and the value is a list of entries matching these key-value pairs.
    """
    grouped = {}
    time_keys = {'_start', '_stop', '_time', 'time','_value'}  # Set of time-related keys to exclude
    
    for item in data:
        # Create a tuple of key-value pairs for all keys except the time-related ones
        key = tuple((k, v) for k, v in item.items() if k not in time_keys)
        
        # If the key doesn't exist in the dictionary, create a new entry
        if key not in grouped:
            grouped[key] = []
        
        # Append the current item to the list corresponding to the key
        grouped[key].append(item)
    
    # Convert tuple keys to more readable dictionary format for output
    result = {}
    for k, v in grouped.items():
        key_dict = {key: value for key, value in k}
        result[str(key_dict)] = v
    return result

# Example usage:
data = [
    {
      "result": "_result",
      "table": 0,
      "_start": "2024-04-15T13:18:28.558573+00:00",
      "_stop": "2024-04-15T13:19:28.558573+00:00",
      "_time": "2024-04-15T13:18:28.665603+00:00",
      "_value": 83,
      "_field": "data",
      "_measurement": "coil_list",
      "host": "d8918617625a",
      "masterID": "2",
      "modbusType": "1",
      "protocol": "modbus",
      "slaveID": "2",
      "unit": "2",
      "time": "2024-04-15T13:18:28.665603+00:00"
    },
    {
      "result": "_result",
      "table": 0,
      "_start": "2024-04-15T13:18:28.558573+00:00",
      "_stop": "2024-04-15T13:19:28.558573+00:00",
      "_time": "2024-04-15T13:18:29.716070+00:00",
      "_value": 90,
      "_field": "data",
      "_measurement": "coil_list",
      "host": "d8918617625a",
      "masterID": "1",
      "modbusType": "1",
      "protocol": "modbus",
      "slaveID": "2",
      "unit": "2",
      "time": "2024-04-15T13:18:29.716070+00:00"
    }
]

grouped_data = group_data(data)
print(grouped_data)
