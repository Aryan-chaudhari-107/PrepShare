"""Router for the reports resource."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from _01_core import get_current_user, get_db
from _02_models import User
from _03_schemas.reports import ReportCreate, ReportOut
from _05_services import reports

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
def file_report(
    data: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return reports.file_report(db, current_user, data)
    except ValueError as e:
        msg = str(e)
        code = status.HTTP_400_BAD_REQUEST if "own post" in msg else status.HTTP_404_NOT_FOUND
        raise HTTPException(status_code=code, detail=msg)
