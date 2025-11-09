"""
Database Model for User Registration Requests

Add this to your models.py file
"""

from sqlalchemy import Column, String, DateTime, Text, ForeignKey, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from uuid import uuid4

# Assuming you have a Base from your existing models
# Base = declarative_base()

class UserRegistrationRequest(Base):
    """
    Model for storing pending user registration requests.
    Admin must approve before user account is created.
    """
    __tablename__ = "user_registration_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False, index=True)

    # User Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone_number = Column(String(20), nullable=True)
    job_title = Column(String(150), nullable=True)
    department = Column(String(150), nullable=True)
    role = Column(String(50), nullable=False)

    # Security
    password_hash = Column(String(255), nullable=False)

    # Request Status
    status = Column(String(20), default='pending', nullable=False, index=True)  # pending, approved, rejected
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Relationships
    organization = relationship("Organizations", back_populates="registration_requests")
    reviewer = relationship("Users", foreign_keys=[reviewed_by])

    def __repr__(self):
        return f"<UserRegistrationRequest {self.email} - {self.status}>"

    class Config:
        orm_mode = True


# Also add this to your Organizations model:
# registration_requests = relationship("UserRegistrationRequest", back_populates="organization")


"""
SQL Migration Script (Alembic or direct SQL)

CREATE TABLE user_registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    job_title VARCHAR(150),
    department VARCHAR(150),
    role VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    
    CONSTRAINT check_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX idx_user_reg_requests_org_id ON user_registration_requests(organization_id);
CREATE INDEX idx_user_reg_requests_email ON user_registration_requests(email);
CREATE INDEX idx_user_reg_requests_status ON user_registration_requests(status);
CREATE INDEX idx_user_reg_requests_requested_at ON user_registration_requests(requested_at DESC);

-- Create composite index for common query pattern
CREATE INDEX idx_user_reg_requests_org_status ON user_registration_requests(organization_id, status);
"""