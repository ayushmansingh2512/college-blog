import os
import cloudinary
import cloudinary.uploader
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
from fastapi.staticfiles import StaticFiles
import shutil
from pathlib import Path
import uuid
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime, timedelta
from backend import crud, models, schemas, auth
from .database import SessionLocal, engine, get_db
from .email_utils import send_verification_email
import secrets
from typing import List
from .schemas import BookmarkCreate, Bookmark
from backend.crud import create_bookmark, get_bookmark_by_user_and_post, delete_bookmark, get_bookmarks_by_user



# This command creates all the tables defined in models.py in the database
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Get the directory of the current file (main.py)
BASE_DIR = Path(__file__).resolve().parent
# Define the path for uploads relative to the backend directory
UPLOAD_DIR = BASE_DIR / "static" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Mount the static files directory relative to BASE_DIR
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

app.include_router(auth.router)

# FIXED CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://college-blog-seven.vercel.app",
        "http://localhost:5173",
        "http://localhost:8000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Cloudinary configuration
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

# Add a health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.get("/debug-jwt-key")
async def debug_jwt_key():
    import os
    return {"JWT_SECRET_KEY": os.getenv("JWT_SECRET_KEY")}

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    verification_token = secrets.token_urlsafe(32)
    verification_token_expires = datetime.utcnow() + timedelta(hours=1)
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        username=user.username,
        is_verified=False,
        verification_token=verification_token,
        verification_token_expires=verification_token_expires
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    verification_link = f"{FRONTEND_URL}/verify-email?token={verification_token}"
    send_verification_email(db_user.email, verification_link)
    return db_user

# FIXED UPLOAD ENDPOINT - Handle both Cloudinary and local uploads
@app.post("/uploadfile")
async def create_upload_file(file: UploadFile = File(...)):
    try:
        # Check if file is valid
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            file.file,
            folder="college-blog",  # Organize uploads in a folder
            resource_type="auto"
        )
        
        return {
            "filename": result["public_id"],
            "url": result["secure_url"],
            "success": True
        }
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/posts/", response_model=schemas.Post)
def create_post_for_user(
    post: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.create_user_post(db=db, post=post, user_id=current_user.id)

@app.post("/post-categories/", response_model=schemas.PostCategory)
def create_post_category(
    category: schemas.PostCategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_category = crud.get_post_category_by_name(db, name=category.name)
    if db_category:
        raise HTTPException(status_code=400, detail="Post category with this name already exists")
    return crud.create_post_category(db=db, category=category)

@app.get("/post-categories/", response_model=List[schemas.PostCategory])
def read_post_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    categories = crud.get_post_categories(db, skip=skip, limit=limit)
    return categories

# IMPROVED USER ENDPOINT with better error handling
@app.get("/users/me", response_model=schemas.User)
async def read_user_me(current_user: models.User = Depends(auth.get_current_user)):
    try:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        return current_user
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        print(f"Error in /users/me: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@app.put("/users/me/username", response_model=schemas.User)
def update_my_username(
    username_update: schemas.UserUpdateUsername,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    updated_user = crud.update_user_username(
        db=db,
        user_id=current_user.id,
        username=username_update.username
    )
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@app.put("/posts/{post_id}", response_model=schemas.Post)
def update_post(
    post_id: int,
    post: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_post = crud.get_post(db, post_id=post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found") 
    if db_post.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this post")
    return crud.update_post(db=db, post_id=post_id, post=post)

@app.delete("/posts/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_post = crud.get_post(db, post_id=post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found") 
    if db_post.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    crud.delete_post(db=db, post_id=post_id)
    return {"message": "Post Deleted Successfully"}    

@app.get("/posts/", response_model=List[schemas.Post])
def read_posts(skip: int = 0, limit: int = 100, category_id: Optional[int] = None, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    posts = crud.get_posts(db, skip=skip, limit=limit, category_id=category_id, start_date=start_date, end_date=end_date, search=search)
    return posts

@app.get("/posts/{post_id}", response_model=schemas.Post)
def read_post(post_id: int, db: Session = Depends(get_db)):
    db_post = crud.get_post(db, post_id=post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return db_post

@app.post("/bookmarks/", response_model=schemas.Bookmark, status_code=status.HTTP_201_CREATED)
def create_user_bookmark(
    bookmark: schemas.BookmarkCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_bookmark = crud.get_bookmark_by_user_and_post(db, user_id=current_user.id, post_id=bookmark.post_id)
    if db_bookmark:
        raise HTTPException(status_code=400, detail="Bookmark already exists")
    return crud.create_bookmark(db=db, user_id=current_user.id, post_id=bookmark.post_id)

@app.get("/bookmarks/", response_model=List[schemas.Bookmark])
def read_user_bookmarks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    bookmarks = crud.get_bookmarks_by_user(db, user_id=current_user.id)
    return bookmarks

@app.delete("/bookmarks/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_bookmark(
    bookmark_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_bookmark = crud.get_bookmark(db, bookmark_id=bookmark_id)
    if not db_bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    if db_bookmark.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this bookmark")
    crud.delete_bookmark(db=db, bookmark_id=db_bookmark.id)

@app.post("/resources/", response_model=schemas.Resource)
def create_resource(
    resource: schemas.ResourceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.create_resource(db=db, resource=resource)

@app.get("/resources/", response_model=List[schemas.Resource])
def read_resources(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    resources = crud.get_resources(db, skip=skip, limit=limit, category_id=category_id, start_date=start_date, end_date=end_date, search=search)
    return resources

@app.get("/resources/{resource_id}", response_model=schemas.Resource)
def read_resource(resource_id: int, db: Session = Depends(get_db)):
    db_resource = crud.get_resource(db, resource_id=resource_id)
    if db_resource is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    return db_resource

@app.put("/resources/{resource_id}", response_model=schemas.Resource)
def update_resource(
    resource_id: int,
    resource: schemas.ResourceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_resource = crud.get_resource(db, resource_id=resource_id)
    if db_resource is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    return crud.update_resource(db=db, resource_id=resource_id, resource=resource)

@app.delete("/resources/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_resource = crud.get_resource(db, resource_id=resource_id)
    if db_resource is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    crud.delete_resource(db=db, resource_id=resource_id)
    return {"message": "Resource Deleted Successfully"}

@app.post("/resource-categories/", response_model=schemas.ResourceCategory)
def create_resource_category(
    category: schemas.ResourceCategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_category = crud.get_resource_category_by_name(db, name=category.name)
    if db_category:
        raise HTTPException(status_code=400, detail="Resource category with this name already exists")
    return crud.create_resource_category(db=db, category=category)

@app.get("/resource-categories/", response_model=List[schemas.ResourceCategory])
def read_resource_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    categories = crud.get_resource_categories(db, skip=skip, limit=limit)
    return categories

@app.post("/clubs/", response_model=schemas.Club)
def create_club(
    club: schemas.ClubCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.create_club(db=db, club=club)

@app.get("/clubs/", response_model=List[schemas.Club])
def read_clubs(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    clubs = crud.get_clubs(db, skip=skip, limit=limit, category_id=category_id, start_date=start_date, end_date=end_date, search=search)
    return clubs

@app.get("/clubs/{club_id}", response_model=schemas.Club)
def read_club(club_id: int, db: Session = Depends(get_db)):
    db_club = crud.get_club(db, club_id=club_id)
    if db_club is None:
        raise HTTPException(status_code=404, detail="Club not found")
    return db_club

@app.put("/clubs/{club_id}", response_model=schemas.Club)
def update_club(
    club_id: int,
    club: schemas.ClubCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_club = crud.get_club(db, club_id=club_id)
    if db_club is None:
        raise HTTPException(status_code=404, detail="Club not found")
    return crud.update_club(db=db, club_id=club_id, club=club)

@app.delete("/clubs/{club_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_club(
    club_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_club = crud.get_club(db, club_id=club_id)
    if db_club is None:
        raise HTTPException(status_code=404, detail="Club not found")
    crud.delete_club(db=db, club_id=club_id)
    return {"message": "Club Deleted Successfully"}

@app.post("/club-categories/", response_model=schemas.ClubCategory)
def create_club_category(
    category: schemas.ClubCategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_category = crud.get_club_category_by_name(db, name=category.name)
    if db_category:
        raise HTTPException(status_code=400, detail="Club category with this name already exists")
    return crud.create_club_category(db=db, category=category)

@app.get("/club-categories/", response_model=List[schemas.ClubCategory])
def read_club_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    categories = crud.get_club_categories(db, skip=skip, limit=limit)
    return categories