from fastapi import HTTPException,  Depends, Security
from influxdb_client import  Point
from datetime import datetime, timedelta
import pytz
from typing import Annotated
import  models, schemas, auth
from dependencies import client, INFLUXDB_ORG, INFLUXDB_BUCKET
from fastapi import APIRouter
import Time_functions
import Functions
from influxdb_client.client.write_api import SYNCHRONOUS

router = APIRouter()




# TODO modify class
# * Three subclasses
# * 1. Get data from database to edit
# * 2. send to DB updated data
# * 3. send to DB deleted data
# ! modify data not their values but the info (slaveid, masterid, type, etc.) and seperate or in bulk
    

# * Read data from database, and show them

@router.post("/modify_data_read", tags=["Modify"])
async def modify_data_read(
    request_body: schemas.EditReadDataRequest, 
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin","read+write"], 
    # If 'admin' scope is required, ensure your authentication logic handles it
):
    try:
        formatted_timestamp_start = Time_functions.format_timestamp_cest_to_utc(request_body.start_time)
        formatted_timestamp_end = Time_functions.format_timestamp_cest_to_utc(request_body.end_time)
        flux_query = Functions.generate_flux_query(request_body.data,formatted_timestamp_start,formatted_timestamp_end,INFLUXDB_BUCKET)
        
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

        # Group the data
        for item in data:
            measurement = item['_measurement']
            if measurement not in grouped_data:
                grouped_data[measurement] = []
            grouped_data[measurement].append(item)
        # print(grouped_data)
        return grouped_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ! problem - when i update the new data is written to it but it is exactly the same to than it lists it at the end of the list, and it looks like it isnt fetching new data
    
@router.post("/modify_data_update", tags=["Modify"])
async def modify_data_update(
    update_request: schemas.EditUpdateDataRequest, 
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin","read+write"]):
    try:
        if update_request.time is None:
            raise HTTPException(status_code=400, detail="Time parameter is missing.")
        
        # Assuming you want to delete data from a range starting X minutes before the provided time
        end_time = update_request.time + timedelta(seconds=.5)
        start_time = end_time - timedelta(seconds=.5)  # For example, 5 minutes before end_time

        # Ensure timezone is UTC for consistency
        start_time = start_time.replace(tzinfo=pytz.UTC)
        end_time = end_time.replace(tzinfo=pytz.UTC)

        start_str = start_time.isoformat()
        end_str = end_time.isoformat()

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
        # print(query)


        result = query_api.query(org=INFLUXDB_ORG, query=query)
        records_to_keep = []
        for table in result:
            for record in table.records:
                # Keep the records that you don't want to delete
                if record.get_field() != update_request.tag_filters["_field"]:  # Adjust this condition as needed

                    records_to_keep.append(record)



        # ! Here delete data and than write them.
        # Write the modified data back to InfluxDB
        # print(update_request)

        predicate = f'_measurement="{update_request.measurement}"'

        for tag, value in update_request.tag_filters.items():
            if tag == "_field":
                continue
            predicate += f' AND {tag}="{value}"'
        # Use the delete API from your client
        delete_api = client.delete_api()
        delete_api.delete(
            start_str,
            end_str,
            predicate,
            bucket=INFLUXDB_BUCKET,
            org=INFLUXDB_ORG
        )

        points = []
        for record in records_to_keep:
            point = Point(record.get_measurement()).time(record.get_time())
            for tag in record.values:
                if tag.startswith('_'):
                    continue
                point.tag(tag, record.values[tag])
            point.field(record.get_field(), record.get_value())
            points.append(point)


        # Update the specific field in a new data point
        new_point = Point(update_request.measurement).time(update_request.time)
        for tag, value in update_request.tag_filters.items():
            if tag == "_field":
                new_point.field(value, update_request.new_value)
            else:
                new_point.tag(tag, value)

        points.append(new_point)

        
        # print(point)
        write_api.write(bucket=INFLUXDB_BUCKET, record=points)

        return {"message": "Data updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

# ! influxdb doesnt support specifying deletion with field values
@router.delete("/modify_data_delete", tags=["Modify"])
async def modify_data_delete(
    delete_request: schemas.EditDeleteDataRequest, 
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin","read+write"]
):    
    try:
        if delete_request.time is None:
            raise HTTPException(status_code=400, detail="Time parameter is missing.")
        
        # Assuming you want to delete data from a range starting X minutes before the provided time
        end_time = delete_request.time + timedelta(seconds=.5)
        start_time = end_time - timedelta(seconds=.5)  # For example, 5 minutes before end_time
        # Ensure timezone is UTC for consistency
        start_time = start_time.replace(tzinfo=pytz.UTC)
        end_time = end_time.replace(tzinfo=pytz.UTC)
        start_str = start_time.isoformat()
        end_str = end_time.isoformat()


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
        # print(query)


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

        # Use the delete API from your client
        delete_api = client.delete_api()
        delete_api.delete(
            start_str,
            end_str,
            predicate,
            bucket=INFLUXDB_BUCKET,
            org=INFLUXDB_ORG
        )

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