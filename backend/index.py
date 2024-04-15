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
from routers import delete, export, edit, authentication, users, measurements, read, write









# 1. user can access data only after signing in - partialy done
# 2. one graph will have its own inputs, so that user can have multiple gprahs, and can choose what is want to see, - DONE
# 3. export data from the graph, and overall


# TODO add security, authorization - where the functions are blocked for non authorized user
# TODO security - encrypted data transfer, and if in database is data stored plaintext or also encrypted
# TODO add users for administration + add administration
# TODO manage to stop and resume logging, > how if modbus inicates the comunication


# Replace with your InfluxDB details
INFLUXDB_URL = "http://docker-influxdb:8086"
INFLUXDB_ORG = "VUT"
INFLUXDB_BUCKET = "school_data"
INFLUXDB_TOKEN = "uSw9UaNW-cbxDFGV5mtHrXNR0wzp7pBo5J0jgRopYAkS183A7QEwGy91ME03SAgqEv2C-25RhhiT7qQsrP3ZSA=="
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(delete.router)
app.include_router(export.router)
app.include_router(edit.router)
app.include_router(authentication.router)
app.include_router(users.router)
app.include_router(measurements.router)
app.include_router(read.router)
app.include_router(write.router)





@app.get("/api")
async def root():
    return {"message": "Awesome Leads Manager"}

