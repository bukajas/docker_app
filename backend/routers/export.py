from fastapi import APIRouter, Response, Security
import models, auth, schemas
from typing import Annotated
from dependencies import INFLUXDB_BUCKET, INFLUXDB_ORG, INFLUXDB_URL, INFLUXDB_TOKEN
from influxdb_client import InfluxDBClient
from io import StringIO
import Time_functions,Functions



router = APIRouter()




@router.post("/export_csv", tags=["Export"])
async def export_csv(
    export_request: schemas.ExportDataRequest,
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin","read+write","read"],
    ): 
    """
    Endpoint to export data from InfluxDB to a CSV file.

    Inputs:
    - export_request: An ExportDataRequest schema containing 'start_time', 'end_time', and data to be exported.
    - current_user: The currently authenticated user.
    - scopes: List of allowed scopes for this endpoint.

    Outputs:
    - A CSV file containing the exported data, or a plain text response if no data is found.
    """

    # Convert the provided timestamps from CEST to UTC
    formatted_timestamp_start = Time_functions.format_timestamp_cest_to_utc(export_request.start_time)
    formatted_timestamp_end = Time_functions.format_timestamp_cest_to_utc(export_request.end_time)
    
    # Generate the Flux query to fetch data from InfluxDB
    flux_query = Functions.generate_flux_query2(export_request.data,formatted_timestamp_start,formatted_timestamp_end,INFLUXDB_BUCKET)

    # Connect to the InfluxDB client using the provided URL, token, and organization
    with InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG) as client:

        results = client.query_api().query_data_frame(query=flux_query, org=INFLUXDB_ORG)

        if isinstance(results, list):
        # Check if the list of results is not empty
            if results:
                output = StringIO()
                for result in results:
                    if not result.empty:
                    # Write the CSV content of the result to the StringIO object
                        result.to_csv(output, index=False)
                output.seek(0)
            
                # Get the CSV content from the StringIO object
                csv_content = output.getvalue()
                output.close()

                # Return the CSV response
                return Response(content=csv_content, media_type="text/csv")
            else:
                return Response(content="No data found", media_type="text/plain")
        else:
            if not results.empty:
                output = StringIO()
                results.to_csv(output, index=False)
                output.seek(0)
                csv_content = output.getvalue()
                return Response(content=csv_content, media_type="text/csv")
            else:
                return Response(content="No data found", media_type="text/plain")
