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
from routers import delete, export, edit
from fastapi import APIRouter




router = APIRouter()





pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")



#! scopes - right now its just for one role, make it also in mysql database so taht user can have mutliple roles
#! when stoped and started it will remenger the last logged in user and will show, but the users doesnt have valid token repair
@router.post("/token", tags=["authentication"])
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(auth.get_db),) -> schemas.Token:
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "scopes": [user.role]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

#! TODO frontend 
#! TODO admin can change users roles
@router.post("/register", response_model=schemas.UserInDB, tags=["authentication"])
def register_user(user: schemas.UserCreate, db: Session = Depends(auth.get_db)):
    # Check if the username already exists
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Hash the password and create a new user instance
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password, role='basic')  # Set role as 'basic'
    
    # Add the new user to the database and commit changes
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Return the newly created user
    return db_user


#TODO something like that if there will be that the user have permission for only specific data, than id should somehow know which data he wants to acces and only show it to him.
#TODO probably users that have permissions for specific DBs?

@router.post("/login", tags=["authentication"])
def login(user: schemas.UserCreate, db: Session = Depends(auth.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}



@router.get("/secure-endpoint", tags=["authentication"])
async def secure_endpoint(current_user: Annotated[models.User, Security(auth.get_current_active_user)], scopes=["admin"]):
    # Here you can use current_user directly as it is already authenticated
    return {"message": "Secure Information", "user": current_user}