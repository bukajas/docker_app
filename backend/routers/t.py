from datetime import datetime
from dateutil import parser

def format_time_for_chartjs(time_string):
    # Parse the datetime string to a datetime object
    dt = parser.parse(time_string)
    
    # Format the datetime object to a string in a JavaScript friendly format
    formatted_time = dt.strftime('%Y-%m-%dT%H:%M:%S')  # This format is generally well-supported in JavaScript
    return formatted_time

# Example usage
time_string = "2023-04-15T14:30:00Z"
formatted_time = format_time_for_chartjs(time_string)
print(formatted_time)