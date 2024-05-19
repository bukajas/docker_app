from fastapi import HTTPException, Security
from influxdb_client import  Point
from datetime import timedelta
import pytz
from typing import Annotated
import  models, schemas, auth
from dependencies import client, INFLUXDB_ORG, INFLUXDB_BUCKET
from fastapi import APIRouter
import Time_functions
import Functions
from influxdb_client.client.write_api import SYNCHRONOUS

router = APIRouter()




@router.post("/modify_data_read", tags=["Modify"])
async def modify_data_read(
    request_body: schemas.EditReadDataRequest, 
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin","read+write"], 
):
    """
    Endpoint to read and modify data based on user input.

    Inputs:
    - request_body: An EditReadDataRequest schema containing 'start_time', 'end_time', and data to be queried.
    - current_user: The currently authenticated user.
    - scopes: List of allowed scopes for this endpoint.

    Outputs:
    - The queried and grouped data from InfluxDB.
    """

    try:
        # Convert the provided timestamps from CEST to UTC
        formatted_timestamp_start = Time_functions.format_timestamp_cest_to_utc(request_body.start_time)
        formatted_timestamp_end = Time_functions.format_timestamp_cest_to_utc(request_body.end_time)
       
        # Generate the Flux query to fetch data from InfluxDB
        flux_query = Functions.generate_flux_query(request_body.data,formatted_timestamp_start,formatted_timestamp_end,INFLUXDB_BUCKET)
        
        # Execute the query and get the results
        tables = client.query_api().query(flux_query)
        
        # Extract data values from the query result
        data = []
        for table in tables:
            for record in table.records:
                record_data = {
                    "time": record.get_time().isoformat(),
                    "value": record.get_value(),
                }


                for key, value in record.values.items():
                    # Skip adding the current field as a tag
                    if key not in ['_start', '_stop', '_time', '_value']:
                        record_data[key] = value

                data.append(record_data)
        grouped_data = {}

        # Group the data by measurement
        for item in data:
            measurement = item['_measurement']
            if measurement not in grouped_data:
                grouped_data[measurement] = []
            grouped_data[measurement].append(item)

        return grouped_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    
@router.post("/modify_data_update", tags=["Modify"])
async def modify_data_update(
    update_request: schemas.EditUpdateDataRequest, 
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin","read+write"]):
    """
    Endpoint to update specific data in InfluxDB.

    Inputs:
    - update_request: An EditUpdateDataRequest schema containing 'time', 'measurement', 'tag_filters', and 'new_value'.
    - current_user: The currently authenticated user.
    - scopes: List of allowed scopes for this endpoint.

    Outputs:
    - A message confirming the successful update of the specified data.
    """
    
    
    try:
        if update_request.time is None:
            raise HTTPException(status_code=400, detail="Time parameter is missing.")
        
        # Define the time range for data deletion and update
        end_time = update_request.time + timedelta(seconds=.5)
        start_time = end_time - timedelta(seconds=.5)

        # Ensure timezone is UTC for consistency
        start_time = start_time.replace(tzinfo=pytz.UTC)
        end_time = end_time.replace(tzinfo=pytz.UTC)

        start_str = start_time.isoformat()
        end_str = end_time.isoformat()

        # Initialize InfluxDB APIs
        query_api = client.query_api()
        write_api = client.write_api()
        delete_api = client.delete_api()

        # Construct the query to fetch existing data
        query = f'''
        from(bucket: "{INFLUXDB_BUCKET}")
          |> range(start: {start_str}, stop: {end_str})
          |> filter(fn: (r) => r._measurement == "{update_request.measurement}")
        '''
        for tag, value in update_request.tag_filters.items():
            if tag == "_field":
                continue
            query += f' |> filter(fn: (r) => r.{tag} == "{value}")'

        # Execute the query and collect records to keep
        result = query_api.query(org=INFLUXDB_ORG, query=query)
        records_to_keep = []
        for table in result:
            for record in table.records:
                # Keep the records that you don't want to delete
                if record.get_field() != update_request.tag_filters["_field"]:  # Adjust this condition as needed

                    records_to_keep.append(record)

        # Construct the predicate for data deletion
        predicate = f'_measurement="{update_request.measurement}"'
        for tag, value in update_request.tag_filters.items():
            if tag == "_field":
                continue
            predicate += f' AND {tag}="{value}"'
        
        # Delete the existing data within the specified time range
        delete_api = client.delete_api()
        delete_api.delete(
            start_str,
            end_str,
            predicate,
            bucket=INFLUXDB_BUCKET,
            org=INFLUXDB_ORG
        )

        # Prepare points to write back to InfluxDB
        points = []
        for record in records_to_keep:
            point = Point(record.get_measurement()).time(record.get_time())
            for tag in record.values:
                if tag.startswith('_'):
                    continue
                point.tag(tag, record.values[tag])
            point.field(record.get_field(), record.get_value())
            points.append(point)


        # Create a new data point with the updated value
        new_point = Point(update_request.measurement).time(update_request.time)
        for tag, value in update_request.tag_filters.items():
            if tag == "_field":
                new_point.field(value, update_request.new_value)
            else:
                new_point.tag(tag, value)

        points.append(new_point)

        # Write the modified data back to InfluxDB
        write_api.write(bucket=INFLUXDB_BUCKET, record=points)

        return {"message": "Data updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


@router.delete("/modify_data_delete", tags=["Modify"])
async def modify_data_delete(
    delete_request: schemas.EditDeleteDataRequest, 
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin","read+write"]
):    
    """
    Endpoint to delete specific data in InfluxDB.

    Inputs:
    - delete_request: An EditDeleteDataRequest schema containing 'time', 'measurement', and 'tag_filters'.
    - current_user: The currently authenticated user.
    - scopes: List of allowed scopes for this endpoint.

    Outputs:
    - A message confirming the successful deletion of the specified data.
    """
    try:
        if delete_request.time is None:
            raise HTTPException(status_code=400, detail="Time parameter is missing.")
        
        # Define the time range for data deletion
        end_time = delete_request.time + timedelta(seconds=.5)
        start_time = end_time - timedelta(seconds=.5) 

        # Ensure timezone is UTC for consistency
        start_time = start_time.replace(tzinfo=pytz.UTC)
        end_time = end_time.replace(tzinfo=pytz.UTC)
        start_str = start_time.isoformat()
        end_str = end_time.isoformat()

        # Initialize InfluxDB APIs
        query_api = client.query_api()
        write_api = client.write_api()
        delete_api = client.delete_api()


        # Construct the query to fetch existing data
        query = f'''
        from(bucket: "{INFLUXDB_BUCKET}")
          |> range(start: {start_str}, stop: {end_str})
          |> filter(fn: (r) => r._measurement == "{delete_request.measurement}")
        '''
        for tag, value in delete_request.tag_filters.items():
            if tag == "_field":
                continue
            query += f' |> filter(fn: (r) => r.{tag} == "{value}")'


        # Execute the query and collect records to keep
        result = query_api.query(org=INFLUXDB_ORG, query=query)
        records_to_keep = []
        for table in result:
            for record in table.records:
                # Keep the records that you don't want to delete
                if record.get_field() != delete_request.tag_filters["_field"]:  # Adjust this condition as needed
                    records_to_keep.append(record)

        # Construct the predicate string based on the tag_filters and measurement
        predicate = f'_measurement="{delete_request.measurement}"'

        for tag, value in delete_request.tag_filters.items():
            if tag == "_field":
                continue
            predicate += f' AND {tag}="{value}"'

        # Delete the existing data within the specified time range
        delete_api = client.delete_api()
        delete_api.delete(
            start_str,
            end_str,
            predicate,
            bucket=INFLUXDB_BUCKET,
            org=INFLUXDB_ORG
        )

        # Prepare points to write back to InfluxDB
        points = []
        for record in records_to_keep:
            point = Point(record.get_measurement()).time(record.get_time())
            for tag in record.values:
                if tag.startswith('_'):
                    continue
                point.tag(tag, record.values[tag])
            point.field(record.get_field(), record.get_value())
            points.append(point)
 
        write_api.write(bucket=INFLUXDB_BUCKET, record=points)

        return {"message": "Data deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))