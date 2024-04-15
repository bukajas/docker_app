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

class ReadData(BaseModel):
    range: int  # Updated to reflect the frontend's "Last Hours" parameter
    dataType: str
    data: str
    slaveId: int
    masterId: int
    modbusType: int


# TODO read data but manage so that there isnt same data fetched twice, so to save bandwidth
# TODO the data needs to have field or tag that specifies which protocos it is.
# TODO neco todo
@router.post("/read_data", tags=["Read"])
async def read_data(readData: ReadData, current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"]):  
    try:
        # Assuming INFLUXDB_BUCKET and client are defined elsewhere
        query = f'from(bucket: "{INFLUXDB_BUCKET}") |> range(start: -{readData.range}m) |> filter(fn: (r) => r["_measurement"] == "{readData.dataType}") |> filter(fn: (r) => r["_field"] == "{readData.data}")'
        # Adding filters for slaveId, masterId, and modbusType
        query += f' |> filter(fn: (r) => r["slaveID"] == "{readData.slaveId}") |> filter(fn: (r) => r["masterID"] == "{readData.masterId}") |> filter(fn: (r) => r["modbusType"] == "{readData.modbusType}")'
        
        tables = client.query_api().query(query)
        # Extract data values from the query result
        data = []
        for table in tables:
            for record in table.records:
                data.append({"time": record.get_time().isoformat(), "value": record.get_value(), "field": record.get_field()})
                
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DynamicReadData(BaseModel):
    measurement: str
    range: str
    tag_filters: Optional[Dict[str, str]] = None

@router.post("/read_data_dynamic", tags=["Read"])
async def read_data_dynamic(readData: DynamicReadData, current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"]):
    try:
        query = f'from(bucket: "{INFLUXDB_BUCKET}") |> range(start: -{readData.range}m) |> filter(fn: (r) => r["_measurement"] == "{readData.measurement}")'
        
        # Dynamically adding filters based on the tag_filters dictionary
        if readData.tag_filters:
            for tag, value in readData.tag_filters.items():
                query += f' |> filter(fn: (r) => r["{tag}"] == "{value}")'
        print(query)
        tables = client.query_api().query(query)
        data = []
        for table in tables:
            for record in table.records:
                data.append({"time": record.get_time().isoformat(), "value": record.get_value(), "field": record.get_field()})
                print(record.get_time().isoformat())
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))