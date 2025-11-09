"""
Superadmin Authentication Dependencies
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os

from database import get_db
from models import Users as User

# Security scheme for Swagger
security = HTTPBearer()

# JWT Configuration

SECRET_KEY = "IfGoOOnglgp65RIbY3pfx8E787Nute-_3Wkv6lCvEKlhC0oLmavChErNr-EtvRNEntHYt15mblG4tn9nJK0zsg"  # Use environment variable
#SECRET_KEY = os.getenv("SECRET_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdXBlcmFkbWluIiwidXNlcm5hbWUiOiJzdXBlcmFkbWluIiwiaXNfc3VwZXJhZG1pbiI6dHJ1ZSwicm9sZSI6InN1cGVyYWRtaW4iLCJleHAiOjE3NjEzNDQ0NTAsImlhdCI6MTc2MTM0MjY1MCwidHlwZSI6ImFjY2VzcyJ9.6XDfI1mi_-VQTenJaC9xjdhUZrbHks5j6xOrlSFKFVI")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Superadmin credentials (in production, store hashed in database)
SUPERADMIN_USERNAME = os.getenv("SUPERADMIN_USERNAME", "superadmin")
SUPERADMIN_PASSWORD = os.getenv("SUPERADMIN_PASSWORD", "SuperAdmin@123")



def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_superadmin(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
):
    """
    Dependency to validate superadmin access
    Extracts and validates JWT token from Authorization header
    """
    token = credentials.credentials

    # Verify token
    payload = verify_token(token)

    # Check if user is superadmin
    user_id = payload.get("sub")
    is_superadmin = payload.get("is_superadmin", False)

    if not is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required"
        )

    # For static superadmin (not in database), return a mock user object
    if user_id == "superadmin":
        class SuperAdminUser:
            id = "superadmin"
            email = "superadmin@system"
            is_superadmin = True
            full_name = "System Superadmin"

        return SuperAdminUser()

    # For database users, verify they exist and have superadmin privileges
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required"
        )

    return user


def verify_superadmin_credentials(username: str, password: str) -> bool:
    """Verify superadmin username and password"""
    return username == SUPERADMIN_USERNAME and password == SUPERADMIN_PASSWORD
