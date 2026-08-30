"""
TODO 20:
 
Table: HACKATHON_PHASES

id                  UUID, primary key, auto-generated
hackathon_id        FK -> hackathons.id, ON DELETE CASCADE
phase_number        integer — order: Phase 1, Phase 2, ...
phase_type          enum: idea_pitch / building / evaluation / other
mode                enum: online / offline — this phase's mode, independent of other phases
description         optional text — what happened in this phase
created_at          timestamp, set once on insert
"""

import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID

from _01_core import Base
from utils import utc_now


class HackathonPhase(Base):
    __tablename__ = "hackathon_phases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    hackathon_id = Column(
        UUID(as_uuid=True),
        ForeignKey("hackathons.id", ondelete="CASCADE"),
        nullable=False,
    )

    phase_number = Column(Integer, nullable=False)

    phase_type = Column(
        Enum("idea_pitch", "building", "evaluation", "other", name="phase_type"),
        nullable=False,
    )

    mode = Column(
        Enum("online", "offline", name="phase_mode"),
        nullable=False,
    )

    description = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utc_now, nullable=False)