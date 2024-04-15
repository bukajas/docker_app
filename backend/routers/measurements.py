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
from dependencies import client, write_api, INFLUXDB_URL,INFLUXDB_ORG,INFLUXDB_BUCKET,INFLUXDB_TOKEN, ACCESS_TOKEN_EXPIRE_MINUTES
from routers import delete, export, edit, authentication


from fastapi import APIRouter



router = APIRouter()








@router.get("/measurements", tags=["Measurements"])
async def get_measurements(current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"]):
    query_api = client.query_api()
    query = f'''
    import "influxdata/influxdb/schema"
    
    schema.measurements(bucket: "{INFLUXDB_BUCKET}")
    '''

    query = f'from(bucket:"{INFLUXDB_BUCKET}") |> range(start: -1h) |> keep(columns: ["_field"]) |> distinct(column: "_field")'
    result = query_api.query(org=INFLUXDB_ORG, query=query)
    # print(result)
    measurements = [record.get_value() for table in result for record in table.records]
    # print(measurements)
    return {"measurements": measurements}


@router.get("/filtered_measurements_with_fields", tags=["Measurements"])
async def get_filtered_measurements_with_fields(
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"],
    slaveID: Optional[str] = Query(None), masterID: Optional[str] = Query(None), modbusType: Optional[str] = Query(None)):
    query_api = client.query_api()
    
    # Construct the filter part of the query based on the provided tags
    filters = ""
    if slaveID:
        filters += f' |> filter(fn: (r) => r.slaveID == "{slaveID}")'
    if masterID:
        filters += f' |> filter(fn: (r) => r.masterID == "{masterID}")'
    if modbusType:
        filters += f' |> filter(fn: (r) => r.modbusType == "{modbusType}")'
    
    # Base query with filters applied
    base_query = f'from(bucket:"{INFLUXDB_BUCKET}") |> range(start: -1h) {filters}'
    
    # Query to get list of filtered measurements
    measurements_query = base_query + ' |> keep(columns: ["_measurement"]) |> distinct(column: "_measurement")'
    measurements_result = query_api.query(org=INFLUXDB_ORG, query=measurements_query)
    measurements = [record.get_value() for table in measurements_result for record in table.records]
    
    # Dictionary to hold the filtered measurements and their fields
    measurements_with_fields: Dict[str, List[str]] = {}

    # Loop through each filtered measurement to query their fields
    for measurement in measurements:
        fields_query = base_query + f' |> filter(fn: (r) => r._measurement == "{measurement}") |> keep(columns: ["_field"]) |> distinct(column: "_field")'
        fields_result = query_api.query(org=INFLUXDB_ORG, query=fields_query)
        fields = [record.get_value() for table in fields_result for record in table.records]
        measurements_with_fields[measurement] = fields
    
    return {"measurements_with_fields": measurements_with_fields}



@router.get("/filtered_measurements_with_tags", tags=["Measurements"])
async def get_filtered_measurements_with_tags(
    current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"]):
    # slaveID: Optional[str] = Query(None), masterID: Optional[str] = Query(None), modbusType: Optional[str] = Query(None)):
    query_api = client.query_api()

    # Base query with filters applied
    base_query = f'from(bucket:"{INFLUXDB_BUCKET}") |> range(start: -1d)'
    # base_query = f'from(bucket:"{INFLUXDB_BUCKET}") |> range(start: -1d) {filters}'
    
    # Query to get list of filtered measurements
    measurements_query = base_query + ' |> keep(columns: ["_measurement"]) |> distinct(column: "_measurement")'
    measurements_result = query_api.query(org=INFLUXDB_ORG, query=measurements_query)
    measurements = [record.get_value() for table in measurements_result for record in table.records]
    
    # Dictionary to hold the filtered measurements and their tags
    measurements_with_tags: dict[str, List[str]] = {}

    # Loop through each filtered measurement to query their tags
    for measurement in measurements:
        tags_query = base_query + f' |> filter(fn: (r) => r._measurement == "{measurement}") |> keys() |> keep(columns: ["_value"]) |> distinct(column: "_value")'
        tags_result = query_api.query(org=INFLUXDB_ORG, query=tags_query)
        tags = [record.get_value() for table in tags_result for record in table.records if record.get_value().startswith('_') is False]  # Exclude system tags/fields
        measurements_with_tags[measurement] = tags
    
    return {"measurements_with_tags": measurements_with_tags}
