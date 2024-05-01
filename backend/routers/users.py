from fastapi import HTTPException, Depends, Security, APIRouter
from typing import  List, Annotated
from fastapi import  Depends, HTTPException
from sqlalchemy.orm import Session
import  models, schemas, auth

router = APIRouter()


@router.get("/users",  tags=["Users"])
def read_users(db: Session = Depends(auth.get_db), response_model=List[schemas.UserDisplay]):
    users = db.query(models.UserList).all()
    return users


@router.patch("/users/{user_id}/role",  tags=["Users"])
def update_user_role(
    user_id: int, 
    role_update: schemas.RoleUpdate,  # Use the RoleUpdate model for input validation
    current_user: Annotated[models.User, Security(auth.get_current_active_user, scopes=["admin"])], 
    db: Session = Depends(auth.get_db),
    response_model=schemas.UserInDB

):
     # Fetch the user to update from the DB
    user_to_update = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")

    # Update the user's role and commit changes
    user_to_update.role = role_update.new_role  # Use the validated new_role
    db.commit()
    db.refresh(user_to_update)
    return user_to_update