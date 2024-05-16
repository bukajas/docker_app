from sqlalchemy import Column, Integer, String
from database import Base

class User(Base):
    __tablename__ = "server_users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)  # Specifying length
    hashed_password = Column(String(255))  # Specifying length
    role = Column(String(50), default='noright')  # Specifying length
    email = Column(String(255), unique=True, index=True)  # Specifying length
    full_name = Column(String(255))  # Specifying length
    __table_args__ = {'extend_existing': True}  # To handle table extension


class UserList(Base):
    __tablename__ = "server_users"  # Ensure this matches your table name in MySQL
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)  # Specifying length
    role = Column(String(50))  # Specifying length
    __table_args__ = {'extend_existing': True}  # To handle table extension