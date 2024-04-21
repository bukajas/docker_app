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