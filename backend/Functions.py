from dependencies import client,INFLUXDB_ORG,INFLUXDB_BUCKET
from typing import Optional, List, Annotated, Dict

def generate_flux_query(data,start,end,bucket):
    query = f'from(bucket: "{bucket}")\n'  # Replace "your_bucket" with your actual bucket name
    query += f'|> range(start: {start}, stop: {end})\n'  # Adjust the time range as needed

    query += '|> filter(fn: (r) => (\n'
    for measurement, tags in data.items():
        query += '    (\n'
        query += f'        r._measurement == "{measurement}"\n'
        for tag_key, tag_value in tags.items():
            query += f'        and r["{tag_key}"] == "{tag_value}"\n'
        query += '    )\n    or\n'
    query = query[:-8]  # Remove the last "or" and correct indentation
    query += '))\n'
    query += '|> drop(columns: ["_result", "_field", "table"])\n'
    query += '|> yield()'
    
    return query

def generate_flux_query2(data,start,end,bucket):
    query = f'from(bucket: "{bucket}")\n'  # Replace "your_bucket" with your actual bucket name
    query += f'|> range(start: {start}, stop: {end})\n'  # Adjust the time range as needed

    query += '|> filter(fn: (r) => (\n'
    for measurement, tags in data.items():
        query += '    (\n'
        query += f'        r._measurement == "{measurement}"\n'
        for tag_key, tag_value in tags.items():
            query += f'        and r["{tag_key}"] == "{tag_value}"\n'
        query += '    )\n    or\n'
    query = query[:-8]  # Remove the last "or" and correct indentation
    query += '))\n'
    query += '|> drop(columns: ["_result", "_field", "table"])\n'
    query += '|> group()\n'
    query += '|> yield()'
    
    return query


def get_measurements_with_tags(start,end):
    query_api = client.query_api()
    measurement_query = f'from(bucket:"{INFLUXDB_BUCKET}") |> range(start: {start}, stop: {end}) |> keep(columns: ["_measurement"]) |> distinct(column: "_measurement")'
    print(measurement_query)
    measurements_result = query_api.query(org=INFLUXDB_ORG, query=measurement_query)
    measurements = [record.get_value() for table in measurements_result for record in table.records]

    
    # Dictionary to hold the filtered measurements and their tags
    measurements_with_tags: dict[str, List[str]] = {}

    # Loop through each filtered measurement to query their tags
    for measurement in measurements:
        tags_query = f'from(bucket:"{INFLUXDB_BUCKET}") |> range(start: {start}, stop: {end}) |> filter(fn: (r) => r._measurement == "{measurement}") |> keys() |> keep(columns: ["_value"]) |> distinct(column: "_value")'
        print(tags_query)
        tags_result = query_api.query(org=INFLUXDB_ORG, query=tags_query)
        tags = [record.get_value() for table in tags_result for record in table.records if record.get_value().startswith('_') is False]  # Exclude system tags/fields
        measurements_with_tags[measurement] = tags

    return measurements_with_tags
