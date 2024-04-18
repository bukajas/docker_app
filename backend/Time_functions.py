from datetime import datetime
import pytz
import json

def format_timestamps_utc_to_cest(json_data):
    # Define the UTC and CEST timezones
    tz_utc = pytz.timezone('UTC')
    tz_cest = pytz.timezone('Europe/Berlin')

    # Loop through each entry in the JSON data
    for key, data_list in json_data['data'].items():
        for entry in data_list:
            # Convert the timestamp string to a datetime object
            dt_utc = entry['_time']

            # Convert the datetime object to the CEST timezone
            dt_cest = dt_utc.astimezone(tz_cest)

            # Format the datetime object into the specified date format
            entry['_time'] = dt_cest.strftime('%Y-%m-%d %H:%M:%S')
            entry['day']= dt_cest.strftime('%H:%M:%S')
            entry['date'] = dt_cest.strftime('%Y-%m-%d')
    return json_data


# # Format timestamps in CEST timezone
# formatted_data = format_timestamps_utc_to_cest(json_data)
# # Output the formatted JSON data
# print(json.dumps(formatted_data, indent=2))



from datetime import datetime
import pytz

def format_timestamp_cest_to_utc(timestamp_str):
    # Define the CEST and UTC timezones
    tz_cest = pytz.timezone('Europe/Berlin')
    tz_utc = pytz.timezone('UTC')

    # Parse the timestamp string into a datetime object
    dt_cest = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')

    # Localize the datetime object to CEST timezone
    dt_cest = tz_cest.localize(dt_cest)

    # Convert the datetime object to UTC timezone
    dt_utc = dt_cest.astimezone(tz_utc)

    # Format the datetime object into RFC 3339 format
    formatted_timestamp = dt_utc.strftime('%Y-%m-%dT%H:%M:%SZ')

    return formatted_timestamp

# # Example usage
# timestamp_str = '2024-04-18 16:14:48'
# formatted_timestamp = format_timestamp_cest_to_utc(timestamp_str)


