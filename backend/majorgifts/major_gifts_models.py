"""
Major Gift Development Models for Wise Investor Platform
Tracks moves management, gift goals, proposals, meetings, and donor priorities
"""

from sqlalchemy import Column, String, Integer, Numeric, Boolean, DateTime, Date, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid

# Import Base from your main models file
from models import Base


class MovesManagementStage(Base):
    """Track donor progression through moves management stages"""
    __tablename__ = "moves_management_stages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    party_id = Column(UUID(as_uuid=True), ForeignKey("parties.id", ondelete="CASCADE"), nullable=False, unique=True)
    officer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Moves Management Stages: Identification, Qualification, Cultivation, Solicitation, Stewardship
    current_stage = Column(String(50), nullable=False)
    stage_entered_date = Column(Date, nullable=False, server_default=func.current_date())
    stage_target_exit_date = Column(Date)
    previous_stage = Column(String(50))

    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships - CORRECTED to use plural class names
    organization = relationship("Organizations", back_populates="moves_management_stages")
    party = relationship("Parties", back_populates="moves_management_stage")
    officer = relationship("Users", back_populates="assigned_donors")









class DonorPriorityCache(Base):
    """Cached donor priority calculations for opportunity targeting"""
    __tablename__ = "donor_priority_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    party_id = Column(UUID(as_uuid=True), ForeignKey("parties.id", ondelete="CASCADE"), nullable=False)
    officer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Priority tier (1-5)
    priority_tier = Column(Integer, nullable=False)
    opportunity_value = Column(Numeric(15, 2), nullable=False)
    opportunity_calculation_basis = Column(Text)

    # Historical giving for calculation
    current_year_total = Column(Numeric(15, 2), default=0.00)
    last_year_total = Column(Numeric(15, 2), default=0.00)
    two_years_ago_total = Column(Numeric(15, 2), default=0.00)

    # Donor classification
    donor_level = Column(String(50), nullable=False)  # Mega, Major, Mid-level, Upper, Lower
    last_gift_date = Column(Date)

    # Cache metadata
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    is_current = Column(Boolean, default=True)

    # Relationships - CORRECTED to use plural class names
    organization = relationship("Organizations", back_populates="donor_priority_cache")
    party = relationship("Parties", back_populates="donor_priority_cache")
    officer = relationship("Users", back_populates="donor_priority_assignments")


class DonorExclusionTag(Base):
    """Tags for excluding donors from certain reports (estate gifts, foundations, etc.)"""
    __tablename__ = "donor_exclusion_tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    party_id = Column(UUID(as_uuid=True), ForeignKey("parties.id", ondelete="CASCADE"), nullable=False)

    tag_type = Column(String(50), nullable=False)  # estate_gifts, foundation_grants, planned_gifts
    tag_reason = Column(Text)

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))

    # Relationships - CORRECTED to use plural class names
    organization = relationship("Organizations", back_populates="donor_exclusion_tags")
    party = relationship("Parties", back_populates="exclusion_tags")
    creator = relationship("Users")