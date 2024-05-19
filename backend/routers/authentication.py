from fastapi import HTTPException, Depends, status
from datetime import timedelta
from typing import Annotated
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import  models, schemas, auth
from dependencies import ACCESS_TOKEN_EXPIRE_MINUTES
from fastapi import APIRouter



router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/token", tags=["authentication"])
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], 
    db: Session = Depends(auth.get_db)
) -> schemas.Token:
    """
    Endpoint to obtain an access token for authentication.

    Inputs:
    - form_data: OAuth2PasswordRequestForm containing 'username' and 'password'.
    - db: Database session dependency.

    Outputs:
    - JSON response containing the access token and token type.
    """

    # Authenticate the user with provided username and password
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Set the access token expiration time
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # Create the access token with user information and expiration time
    access_token = auth.create_access_token(
        data={"sub": user.username, "scopes": [user.role]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}



@router.post("/register", response_model=schemas.UserInDB2, tags=["authentication"])
def register_user(user: schemas.UserCreate, db: Session = Depends(auth.get_db)):
    """
    Endpoint to register a new user.

    Inputs:
    - user: A UserCreate schema containing 'username', 'password', 'email', and 'full_name'.
    - db: Database session dependency.

    Outputs:
    - The newly created user as a UserInDB2 schema.
    """

    # Check if the username or email already exists
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check if the email already exists in the database
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password and create a new user instance
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        hashed_password=hashed_password,
        role='noright',  # Set the default role as 'noright'
        email=user.email,
        full_name=user.full_name
    )
    
    # Add the new user to the database and commit changes
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Return the newly created user
    return db_user

