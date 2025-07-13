from pydantic import BaseModel
from datetime import datetime 
from typing import List, Optional 
 
# Schemas for Post Categories
class PostCategoryBase(BaseModel):
    name: str

class PostCategoryCreate(PostCategoryBase):
    pass

class PostCategory(PostCategoryBase):
    id: int
    class Config:
        from_attributes = True

# Schemas for Resource Categories
class ResourceCategoryBase(BaseModel):
    name: str

class ResourceCategoryCreate(ResourceCategoryBase):
    pass

class ResourceCategory(ResourceCategoryBase):
    id: int
    class Config:
        from_attributes = True

# Schemas for Club Categories
class ClubCategoryBase(BaseModel):
    name: str

class ClubCategoryCreate(ClubCategoryBase):
    pass

class ClubCategory(ClubCategoryBase):
    id: int
    class Config:
        from_attributes = True

class BookmarkBase(BaseModel):
    post_id: int 

class BookmarkCreate(BookmarkBase):
    pass

# For bookmarks - only include essential post info, not full post with bookmarks
class PostSummary(BaseModel):
    id: int
    title: str
    content: str
    owner_id: int
    created_at: Optional[datetime] = None
    image_url: Optional[str] = None  
    category_id: Optional[int] = None  
    category: Optional[PostCategory] = None  
    
    class Config:
        from_attributes = True
 
class PostInBookmark(BaseModel):
    id: int
    title: str
    content: str
    owner_id: int
    created_at: Optional[datetime] = None
    image_url: Optional[str] = None  
    category_id: Optional[int] = None  
    category: Optional[PostCategory] = None  
    
    class Config:
        from_attributes = True
 
class Bookmark(BookmarkBase):
    id: int
    user_id: int
    created_at: datetime
    post: PostInBookmark

    class Config:
        from_attributes = True

# For posts - only include bookmark info, not full bookmark with post
class BookmarkInPost(BookmarkBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
    
# Schema for creating new post
class PostCreate(BaseModel):
    title: str
    content: str 
    image_url: Optional[str] = None 
    category_id: Optional[int] = None

class ResourceBase(BaseModel):
    title: str
    context: str
    teachings: str
    link: str
    image_url: Optional[str] = None
    category_id: Optional[int] = None

class ResourceCreate(ResourceBase):
    pass

class Resource(ResourceBase):
    id: int
    created_at: datetime
    category: Optional[ResourceCategory] = None

    class Config:
        from_attributes = True

class ClubBase(BaseModel):
    name: str
    description: str
    image_url: Optional[str] = None
    category_id: Optional[int] = None

class ClubCreate(ClubBase):
    pass

class Club(ClubBase):
    id: int
    created_at: datetime
    category: Optional[ClubCategory] = None

    class Config:
        from_attributes = True

# Main Post schema - this is what you'll use for most responses
class Post(BaseModel):
    id: int
    title: str
    content: str
    owner_id: int
    created_at: Optional[datetime] = None
    image_url: Optional[str] = None  
    category_id: Optional[int] = None  
    category: Optional[PostCategory] = None
    owner: "UserPublic"
    bookmarks: List[BookmarkInPost] = []

    class Config:
        from_attributes = True

# Schema for creating new user 
class UserCreate(BaseModel):
    email: str
    password: str
    username: Optional[str] = None  
# Schema for reading a user
class UserPublic(BaseModel):
    id: int
    email: str
    is_active: bool
    is_verified: bool
    username: Optional[str]

    class Config:
        from_attributes = True

# Schema for reading a user (full profile)
class User(BaseModel):
    id: int
    email: str
    is_active: bool
    is_verified: bool
    username: Optional[str]
    posts: List[Post] = []  # Use the main Post schema
    bookmarks: List[Bookmark] = []  # This will use PostSummary for post details

    class Config:
        from_attributes = True 
 
class UserUpdateUsername(BaseModel):
    username: Optional[str] = None

class VerificationToken(BaseModel):
    token: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None