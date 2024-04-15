from fastapi import FastAPI, HTTPException, Query, Depends, Header,Body, status, Response, Request, Security
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
from datetime import datetime, timedelta
from networkx import expected_degree_graph
import requests
import json
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import pytz
import random
from typing import Optional, List, Annotated, Dict
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, HTTPBasic, HTTPBasicCredentials
import secrets 
from jose import JWTError, jwt
from io import StringIO
import pandas as pd
import os
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
import  models, schemas, auth
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dependencies import client, write_api, INFLUXDB_URL,INFLUXDB_ORG,INFLUXDB_BUCKET,INFLUXDB_TOKEN
from routers import delete, export
from fastapi import APIRouter




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
        query = f'from(bucket: "{INFLUXDB_BUCKET}") \
            |> range(start: -{request_body.rangeInMinutes}m) \
            |> filter(fn: (r) => r["_measurement"] == "{request_body.measurement}")'
        
        for tag, value in request_body.tag_filters.items():
            query += f' |> filter(fn: (r) => r["{tag}"] == "{value}")'
        
        # Debug: print the query to check if it's correctly formatted

        # Assuming 'client' is an instance of your InfluxDB client
        tables = client.query_api().query(query)
        
        # Extract data values from the query result
        data = []
        for table in tables:
            for record in table.records:
                record_data = {
                    "time": record.get_time().isoformat(),
                    "value": record.get_value(),
                    "field": record.get_field()
                }
                current_field = record.get_field()
                for key, value in record.values.items():
                    # Skip adding the current field as a tag
                    if key != current_field and key not in ['_start', '_stop', '_time', '_value']:
                        record_data[key] = value

                data.append(record_data)
        
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class UpdateDataModel(BaseModel):
    start_time: datetime
    end_time: datetime
    measurement_name: str
    field_name: str
    slave_id: int
    master_id: int
    modbus_type: int
    value: float  # or the appropriate type


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
        
        print(point)
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