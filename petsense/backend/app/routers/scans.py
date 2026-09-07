from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.scan import Scan
from app.schemas.scan import ScanResponse, ScanHistoryPoint
from app.services.auth_service import get_current_user

router = APIRouter()


@router.get("", response_model=List[ScanResponse])
def list_scans(
    pet_id: Optional[int] = Query(None, description="Filter by pet ID"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List scan history for the authenticated user, optionally filtered by pet."""
    q = db.query(Scan).filter(Scan.user_id == current_user.id)
    if pet_id is not None:
        q = q.filter(Scan.pet_id == pet_id)
    return q.order_by(Scan.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/{scan_id}", response_model=ScanResponse)
def get_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single scan result by ID."""
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == current_user.id).first()
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found.")
    return scan


@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a scan record."""
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == current_user.id).first()
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found.")
    db.delete(scan)
    db.commit()


@router.get("/pets/{pet_id}/history", response_model=List[ScanHistoryPoint])
def pet_history(
    pet_id: int,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return lightweight scan history for a pet, suitable for trend charts.
    Scans are ordered oldest-first for time-series display.
    """
    scans = (
        db.query(Scan)
        .filter(Scan.pet_id == pet_id, Scan.user_id == current_user.id)
        .order_by(Scan.created_at.asc())
        .limit(limit)
        .all()
    )
    return scans
