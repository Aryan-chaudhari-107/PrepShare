"""Pydantic schemas for the education_history resource.

education_id must NEVER appear in any post response — it trivially de-anonymizes
the poster by linking them to a specific college/degree row. It is safe here
because this endpoint is /users/me/education (the owner's own resource).
"""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, model_validator


class EducationCreate(BaseModel):
    degree_level: Literal["Diploma", "Bachelors", "Masters", "PhD"]
    institution_id: uuid.UUID
    course: str
    branch: str | None = None
    education_type: Literal["full_time", "part_time", "online"]
    start_year: int
    end_year: int | None = None
    is_current: bool = False

    @model_validator(mode="after")
    def check_end_year(self):
        if not self.is_current and self.end_year is None:
            raise ValueError("end_year is required unless is_current is True")
        return self


class EducationUpdate(BaseModel):
    degree_level: Literal["Diploma", "Bachelors", "Masters", "PhD"] | None = None
    institution_id: uuid.UUID | None = None
    course: str | None = None
    branch: str | None = None
    education_type: Literal["full_time", "part_time", "online"] | None = None
    start_year: int | None = None
    end_year: int | None = None
    is_current: bool | None = None


class EducationOut(BaseModel):
    id: uuid.UUID
    degree_level: str
    institution_id: uuid.UUID
    course: str
    branch: str | None = None
    education_type: str
    start_year: int
    end_year: int | None = None
    is_current: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
