from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from passlib.context import CryptContext

# Initialize password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Prompt the user for input
mysql_root_password = "1234567890"
mysql_database= "usersauth"
user_name = "test"
plain_password = "test"
user_role = "admin"
user_email = "test@test.cz"
user_full_name = "testest"

# Hash the plaintext password
user_hashed_password = pwd_context.hash(plain_password)

# Connection string for creating the database
connection_string = f"mysql+pymysql://asszonyij:{mysql_root_password}@localhost:3333"

# Create engine for initial connection to create the database
engine = create_engine(connection_string)

# Connect to the MySQL server and create the database if it does not exist
try:
    with engine.connect() as connection:
        connection.execute(f"CREATE DATABASE IF NOT EXISTS {mysql_database}")
    print(f"Database '{mysql_database}' created successfully.")
except SQLAlchemyError as e:
    print(f"Error occurred: {e}")

# Define the new engine connection string for the specific database
db_connection_string = f"mysql+pymysql://root:{mysql_root_password}@localhost:3333/{mysql_database}"
db_engine = create_engine(db_connection_string)

# Base class for declarative class definitions
Base = declarative_base()

# Define the server_users ORM model
class ServerUser(Base):
    __tablename__ = 'server_users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default='noright')
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255))

# Create the table if it does not exist
try:
    Base.metadata.create_all(db_engine)
    print("Table 'server_users' created successfully.")
except SQLAlchemyError as e:
    print(f"Error occurred: {e}")

# Create a new session
Session = sessionmaker(bind=db_engine)
session = Session()

# Insert the new user
try:
    new_user = ServerUser(
        username=user_name,
        hashed_password=user_hashed_password,
        role=user_role,
        email=user_email,
        full_name=user_full_name
    )
    session.add(new_user)
    session.commit()
    print("User data inserted successfully.")
except SQLAlchemyError as e:
    session.rollback()
    print(f"Error occurred: {e}")
finally:
    session.close()
