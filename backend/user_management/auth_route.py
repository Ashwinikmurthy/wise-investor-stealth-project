"""
Complete Authentication System with Proper JWT Tokens
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import uuid
import os
import hashlib
#from passlib.context import CryptContext
from database import get_db
from models import Users as User, Organizations as Organization

# Router
router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

# Password hashing
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__ident="2b",  # Skip wrap bug detection
    bcrypt__rounds=12,
)

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


# Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    organization_id: uuid.UUID
    full_name: str
    is_superadmin: bool = False


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 1800
    user: UserResponse


class SuperadminLoginRequest(BaseModel):
    username: str
    password: str


class SuperadminUserResponse(BaseModel):
    id: str
    email: str
    role: str
    is_superadmin: bool = True


class SuperadminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 1800
    user: SuperadminUserResponse


# Helper Functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    password_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
    return pwd_context.verify(password_hash, hashed_password)
    #return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Hash a password"""
    print(f"\n=== HASH PASSWORD ===")
    print(f"Input password: {password}")
    print(f"Input length: {len(password)}")
    # Handle bcrypt 72 byte limit
   # password = password.replace('\x00', '')
    #password_bytes = password.encode('utf-8')
    
    #if len(password_bytes) > 72:
    #    password_bytes = password_bytes[:72]
    #    password = password_bytes.decode('utf-8', errors='ignore')
    password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    print(f"SHA256 hash: {password_hash}")
    result = pwd_context.hash(password_hash)
    print(f"Final bcrypt hash: {result}")
    print(f"=== END HASH ===\n")
    return result


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token
    """
    to_encode = data.copy()
    
    # Set expiration
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    # Create JWT token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


def verify_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Authentication Endpoints

@router.post("/login", response_model=LoginResponse, summary="User Login")
async def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return JWT token with user information
    
    - **email**: User email address
    - **password**: User password
    
    Returns:
    - **access_token**: JWT token for authentication
    - **token_type**: Always "bearer"
    - **expires_in**: Token expiration time in seconds (1800 = 30 minutes)
    - **user**: User information (id, email, role, organization_id, full_name)
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "organization_id": str(user.organization_id),
        "is_superadmin": user.is_superadmin
    }
    
    access_token = create_access_token(
        data=token_data,
        expires_delta=access_token_expires
    )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Prepare user response
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        organization_id=user.organization_id,
        full_name=user.full_name,
        is_superadmin=user.is_superadmin
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_response
    )


@router.post("/superadmin/login", response_model=SuperadminLoginResponse, summary="Superadmin Login")
async def superadmin_login(
    credentials: SuperadminLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate superadmin and return JWT token
    
    - **username**: Superadmin username (default: superadmin)
    - **password**: Superadmin password (default: SuperAdmin@123)
    
    Returns JWT token with superadmin claims
    """
    # Superadmin credentials from environment
    SUPERADMIN_USERNAME = os.getenv("SUPERADMIN_USERNAME", "superadmin")
    SUPERADMIN_PASSWORD = os.getenv("SUPERADMIN_PASSWORD", "SuperAdmin@123")
    
    # Verify credentials
    if credentials.username != SUPERADMIN_USERNAME or credentials.password != SUPERADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid superadmin credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    token_data = {
        "sub": "superadmin",
        "username": credentials.username,
        "is_superadmin": True,
        "role": "superadmin"
    }
    
    access_token = create_access_token(
        data=token_data,
        expires_delta=access_token_expires
    )
    
    # Prepare response
    user_response = SuperadminUserResponse(
        id="superadmin",
        email="superadmin@system",
        role="superadmin",
        is_superadmin=True
    )
    
    return SuperadminLoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_response
    )


@router.post("/verify-token", summary="Verify JWT Token")
async def verify_token_endpoint(token: str):
    """
    Verify if a JWT token is valid
    
    - **token**: JWT token to verify
    
    Returns decoded token payload if valid
    """
    try:
        payload = verify_token(token)
        return {
            "valid": True,
            "payload": payload
        }
    except HTTPException:
        return {
            "valid": False,
            "error": "Invalid or expired token"
        }


@router.post("/refresh-token", summary="Refresh Access Token")
async def refresh_token(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Refresh an existing JWT token
    
    - **token**: Current JWT token
    
    Returns new token with extended expiration
    """
    # Verify current token
    payload = verify_token(token)
    
    user_id = payload.get("sub")
    
    if user_id == "superadmin":
        # Refresh superadmin token
        token_data = {
            "sub": "superadmin",
            "username": "superadmin",
            "is_superadmin": True,
            "role": "superadmin"
        }
    else:
        # Refresh regular user token
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
            "organization_id": str(user.organization_id),
            "is_superadmin": user.is_superadmin
        }
    
    # Create new token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_token = create_access_token(
        data=token_data,
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": new_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

from fastapi import Depends, HTTPException, status, Header
from jose import jwt, JWTError

@router.get("/me")
async def get_current_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    """
    Get current user information from JWT token
    """
    try:
        # Extract token from "Bearer <token>"
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")

        token = authorization.replace("Bearer ", "")

        # Decode JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")

        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")

    # Return user info
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "organization_id": str(user.organization_id),
        "is_superadmin": user.is_superadmin,
        "role": getattr(user, 'role', 'User')
    }
