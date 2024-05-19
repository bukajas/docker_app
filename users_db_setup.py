import argparse
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from passlib.context import CryptContext

# Initialize password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Command-line argument parsing
parser = argparse.ArgumentParser(description="Set up the users database.")
parser.add_argument('--mysql_root_password', required=True, help='MySQL root password')
parser.add_argument('--user_name', required=True, help='User name')
parser.add_argument('--plain_password', required=True, help='Plain password')
parser.add_argument('--user_email', required=True, help='User email')
parser.add_argument('--user_full_name', required=True, help='User full name')
args = parser.parse_args()

mysql_root_password = args.mysql_root_password
user_name = args.user_name
plain_password = args.plain_password
user_email = args.user_email
user_full_name = args.user_full_name

mysql_database = "authusers"
user_role = "admin"

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
