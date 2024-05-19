from fastapi import APIRouter, Response, Security
import models, auth, schemas
from typing import Annotated
from dependencies import INFLUXDB_ORG, INFLUXDB_URL, INFLUXDB_TOKEN, INFLUXDB_AGRO_BUCKET
from influxdb_client import InfluxDBClient
from io import StringIO
import Time_functions,Functions
from influxdb_client.client.write_api import SYNCHRONOUS


router = APIRouter()



@router.post("/agregate", tags=["Agregate"])
async def agregate(
    export_request: schemas.AgregateDataRequest,
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin","read+write","read"],
    ): 
    # Convert the provided timestamps from CEST to UTC
    formatted_timestamp_start = Time_functions.format_timestamp_cest_to_utc(export_request.start_time)
    formatted_timestamp_end = Time_functions.format_timestamp_cest_to_utc(export_request.end_time)
   
    # Define the Flux query to retrieve data from InfluxDB
    flux_query = f'''
    from(bucket: "{INFLUXDB_AGRO_BUCKET}")
    |> range(start: {formatted_timestamp_start}, stop: {formatted_timestamp_end}) 
    |> drop(columns: ["_result", "table"])
    |> group()
    |> yield()
    '''   
    
    # Connect to the InfluxDB client using the provided URL, token, and organization
    with InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG) as client:
        # Execute the query and get the results as a DataFrame
        results = client.query_api().query_data_frame(query=flux_query, org=INFLUXDB_ORG)

        if isinstance(results, list):
            if results:
            # Create an empty StringIO object to store CSV content
                output = StringIO()
                for result in results:
                    if not result.empty:
                        # Write the CSV content of the result to the StringIO object
                        result.to_csv(output, index=False)
                # Move the cursor to the beginning of the StringIO object
                output.seek(0)
            
                # Get the CSV content from the StringIO object
                csv_content = output.getvalue()
                output.close()

                # Return the CSV response
                return Response(content=csv_content, media_type="text/csv")
            else:
                return Response(content="No data found", media_type="text/plain")
        else:
            # If results is a single DataFrame
            if not results.empty:
                # Create a StringIO object and write the DataFrame to CSV
                output = StringIO()
                results.to_csv(output, index=False)
                output.seek(0)
                csv_content = output.getvalue()
                return Response(content=csv_content, media_type="text/csv")
            else:
                return Response(content="No data found", media_type="text/plain")
