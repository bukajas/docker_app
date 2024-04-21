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
    current_user: Annotated[models.User, Depends(auth.get_current_active_user)], 
    # If 'admin' scope is required, ensure your authentication logic handles it
):
    try:
        formatted_timestamp_start = Time_functions.format_timestamp_cest_to_utc(request_body.start_time)
        formatted_timestamp_end = Time_functions.format_timestamp_cest_to_utc(request_body.end_time)
        flux_query = Functions.generate_flux_query(request_body.data,formatted_timestamp_start,formatted_timestamp_end,INFLUXDB_BUCKET)


        query = f'from(bucket: "{INFLUXDB_BUCKET}") |> range(start: {formatted_timestamp_start}, stop: {formatted_timestamp_end}) |> filter(fn: (r) => r["_measurement"] == "{"coil_list"}")'

        # if request_body.tag_filters:
        #     for tag, value in request_body.tag_filters.items():
        #         query += f' |> filter(fn: (r) => r["{tag}"] == "{value}")'
        
        # Debug: print the query to check if it's correctly formatted
        # Assuming 'client' is an instance of your InfluxDB client
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
        print(grouped_data)
        return grouped_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ! problem - when i update the new data is written to it but it is exactly the same to than it lists it at the end of the list, and it looks like it isnt fetching new data
    
@router.post("/modify_data_update", tags=["Modify"])
async def modify_data_update(
    update_request: schemas.EditUpdateDataRequest, 
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], 
    scopes=["admin"]):
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

        # ! Here delete data and than write them.
        # Write the modified data back to InfluxDB
        write_api = client.write_api()

        predicate = f'_measurement="{update_request.measurement}"'

        for tag, value in update_request.tag_filters.items():
            if tag == "field":
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


        
        point = Point(update_request.measurement)\
                .field("_value", update_request.new_value)\
                .time(update_request.time)
        # Dynamically add tags to the point
        for tag, value in update_request.tag_filters.items():
            point.tag(tag, value)
        
        # print(point)
        write_api.write(bucket=INFLUXDB_BUCKET, record=point)

        return {"message": "Data updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

# ! influxdb doesnt support specifying deletion with field values
@router.delete("/modify_data_delete", tags=["Modify"])
async def modify_data_delete(
    delete_request: schemas.EditDeleteDataRequest, 
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], 
    scopes=["admin"]
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

        # Construct the predicate string based on the tag_filters and measurement
        predicate = f'_measurement="{delete_request.measurement}"'

        for tag, value in delete_request.tag_filters.items():
            if tag == "field":
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

        return {"message": "Data deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))