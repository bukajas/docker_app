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





@router.get("/users", response_model=List[schemas.UserDisplay], tags=["Users"])
def read_users(db: Session = Depends(auth.get_db)):
    users = db.query(models.UserList).all()
    return users


@router.patch("/users/{user_id}/role", response_model=schemas.UserInDB, tags=["Users"])
def update_user_role(
    user_id: int, 
    role_update: schemas.RoleUpdate,  # Use the RoleUpdate model for input validation
    current_user: Annotated[models.User, Security(auth.get_current_active_user, scopes=["admin"])], 
    db: Session = Depends(auth.get_db)
):
     # Fetch the user to update from the DB
    user_to_update = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")

    # Update the user's role and commit changes
    user_to_update.role = role_update.new_role  # Use the validated new_role
    db.commit()
    db.refresh(user_to_update)
    return user_to_update