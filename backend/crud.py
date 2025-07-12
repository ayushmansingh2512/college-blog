from sqlalchemy.orm import Session, joinedload
from typing import Optional
from datetime import datetime # Add this import
from backend import models, schemas

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    # Note: Password hashing should be handled in auth.py or main.py
    # This function should receive already hashed password
    db_user = models.User(
        email=user.email, 
        hashed_password=user.password,
        username=user.username  
        )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_posts(db: Session, skip: int = 0, limit: int = 100, category_id: Optional[int] = None, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None, search: Optional[str] = None):
    query = db.query(models.Post).options(joinedload(models.Post.owner), joinedload(models.Post.category))
    if category_id is not None:
        query = query.filter(models.Post.category_id == category_id)
    if start_date is not None:
        query = query.filter(models.Post.created_at >= start_date)
    if end_date is not None:
        # To include the entire end_date, set it to the end of the day
        end_of_day = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        query = query.filter(models.Post.created_at <= end_of_day)
    if search is not None:
        query = query.filter(models.Post.title.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()

def create_user_post(db: Session, post: schemas.PostCreate, user_id: int):
    db_post = models.Post(**post.model_dump(), owner_id=user_id)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

def get_post(db: Session, post_id: int):
    return db.query(models.Post).filter(models.Post.id == post_id).first()

def update_post(db: Session, post_id: int, post: schemas.PostCreate):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if db_post:
        db_post.title = post.title
        db_post.content = post.content
        db_post.image_url = post.image_url
        db_post.category_id = post.category_id
        db.add(db_post)
        db.commit()
        db.refresh(db_post)
    return db_post

def update_user_username(db: Session, user_id: int, username: Optional[str]):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.username = username
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    return db_user

def delete_post(db: Session, post_id: int):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if db_post:
        db.delete(db_post)
        db.commit()
    return db_post

def get_post_category_by_name(db: Session, name: str):
    return db.query(models.PostCategory).filter(models.PostCategory.name == name).first()

def create_post_category(db: Session, category: schemas.PostCategoryCreate):
    db_category = models.PostCategory(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def get_post_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.PostCategory).offset(skip).limit(limit).all()

def get_bookmark_by_user_and_post(db: Session, user_id: int, post_id: int):
    return db.query(models.Bookmark).filter(
        models.Bookmark.user_id == user_id,
        models.Bookmark.post_id == post_id
    ).first()

def create_bookmark(db: Session, user_id: int, post_id: int):
    db_bookmark = models.Bookmark(user_id=user_id, post_id=post_id)
    db.add(db_bookmark)
    db.commit()
    db.refresh(db_bookmark)
    return db_bookmark

def get_bookmark(db: Session, bookmark_id: int):
    return db.query(models.Bookmark).filter(models.Bookmark.id == bookmark_id).first()

def delete_bookmark(db: Session, bookmark_id: int):
    db_bookmark = db.query(models.Bookmark).filter(models.Bookmark.id == bookmark_id).first()
    if db_bookmark:
        db.delete(db_bookmark)
        db.commit()
    return db_bookmark

def get_bookmarks_by_user(db: Session, user_id: int):
    return db.query(models.Bookmark).filter(models.Bookmark.user_id == user_id).options(joinedload(models.Bookmark.post)).all()

def create_resource(db: Session, resource: schemas.ResourceCreate):
    db_resource = models.Resource(**resource.model_dump())
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource

def get_resource(db: Session, resource_id: int):
    return db.query(models.Resource).filter(models.Resource.id == resource_id).first()

def get_resources(db: Session, skip: int = 0, limit: int = 100, category_id: Optional[int] = None, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None, search: Optional[str] = None):
    query = db.query(models.Resource).options(joinedload(models.Resource.category))
    if category_id is not None:
        query = query.filter(models.Resource.category_id == category_id)
    if start_date is not None:
        query = query.filter(models.Resource.created_at >= start_date)
    if end_date is not None:
        query = query.filter(models.Resource.created_at <= end_date)
    if search is not None:
        query = query.filter(models.Resource.title.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()

def get_resource_category_by_name(db: Session, name: str):
    return db.query(models.ResourceCategory).filter(models.ResourceCategory.name == name).first()

def create_resource_category(db: Session, category: schemas.ResourceCategoryCreate):
    db_category = models.ResourceCategory(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def get_resource_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.ResourceCategory).offset(skip).limit(limit).all()

def update_resource(db: Session, resource_id: int, resource: schemas.ResourceCreate):
    db_resource = db.query(models.Resource).filter(models.Resource.id == resource_id).first()
    if db_resource:
        db_resource.title = resource.title
        db_resource.context = resource.context
        db_resource.teachings = resource.teachings
        db_resource.link = resource.link
        db_resource.image_url = resource.image_url
        db_resource.category_id = resource.category_id
        db.add(db_resource)
        db.commit()
        db.refresh(db_resource)
    return db_resource

def delete_resource(db: Session, resource_id: int):
    db_resource = db.query(models.Resource).filter(models.Resource.id == resource_id).first()
    if db_resource:
        db.delete(db_resource)
        db.commit()
    return db_resource

def create_club(db: Session, club: schemas.ClubCreate):
    db_club = models.Club(**club.model_dump())
    db.add(db_club)
    db.commit()
    db.refresh(db_club)
    return db_club

def get_club(db: Session, club_id: int):
    return db.query(models.Club).filter(models.Club.id == club_id).first()

def get_clubs(db: Session, skip: int = 0, limit: int = 100, category_id: Optional[int] = None, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None, search: Optional[str] = None):
    query = db.query(models.Club).options(joinedload(models.Club.category))
    if category_id is not None:
        query = query.filter(models.Club.category_id == category_id)
    if start_date is not None:
        query = query.filter(models.Club.created_at >= start_date)
    if end_date is not None:
        query = query.filter(models.Club.created_at <= end_date)
    if search is not None:
        query = query.filter(models.Club.name.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()

def get_club_category_by_name(db: Session, name: str):
    return db.query(models.ClubCategory).filter(models.ClubCategory.name == name).first()

def create_club_category(db: Session, category: schemas.ClubCategoryCreate):
    db_category = models.ClubCategory(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def get_club_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.ClubCategory).offset(skip).limit(limit).all()

def update_club(db: Session, club_id: int, club: schemas.ClubCreate):
    db_club = db.query(models.Club).filter(models.Club.id == club_id).first()
    if db_club:
        db_club.name = club.name
        db_club.description = club.description
        db_club.image_url = club.image_url
        db_club.category_id = club.category_id
        db.add(db_club)
        db.commit()
        db.refresh(db_club)
    return db_club

def delete_club(db: Session, club_id: int):
    db_club = db.query(models.Club).filter(models.Club.id == club_id).first()
    if db_club:
        db.delete(db_club)
        db.commit()
    return db_club