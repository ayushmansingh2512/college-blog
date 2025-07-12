from sqlalchemy import Boolean , Column , ForeignKey, Integer , String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base
from sqlalchemy.sql import func 

class User(Base):
    __tablename__ = "users"
    id = Column(Integer,primary_key=True, index=True)
    email = Column(String,unique=True, index=True)
    username = Column(String, unique=True, index=True, nullable=True) # Add this line
    hashed_password = Column(String) # we will store a hashed value password or dummy password value for Oauth users
    is_active = Column(Boolean,default=True)
    is_verified = Column(Boolean,default=False)
    verification_token = Column(String, unique=True, nullable=True) 
    verification_token_expires = Column(DateTime, nullable=True) 
    posts = relationship("Post",back_populates="owner")
    bookmarks = relationship("Bookmark", back_populates="user") 



class PostCategory(Base):
    __tablename__ = "post_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    posts = relationship("Post", back_populates="category")

class ResourceCategory(Base):
    __tablename__ = "resource_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    resources = relationship("Resource", back_populates="category")

class ClubCategory(Base):
    __tablename__ = "club_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    clubs = relationship("Club", back_populates="category") 


class Bookmark(Base):
    __tablename__ = "bookmarks"
    
    id = Column(Integer, primary_key=True,index=True)
    user_id = Column(Integer,ForeignKey("users.id"))
    post_id = Column(Integer, ForeignKey("posts.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="bookmarks")
    post = relationship("Post", back_populates="bookmarks")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer,primary_key= True, index=True)
    title = Column(String, index=True)
    content = Column(String) 
    image_url = Column(String, nullable=True) 
    owner_id = Column(Integer,ForeignKey("users.id")) 
    category_id = Column(Integer, ForeignKey("post_categories.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User" , back_populates="posts")
    category = relationship("PostCategory", back_populates="posts")
    bookmarks = relationship("Bookmark", back_populates="post")


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    context = Column(String)
    teachings = Column(String)
    link = Column(String)
    image_url = Column(String, nullable=True)
    category_id = Column(Integer, ForeignKey("resource_categories.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    category = relationship("ResourceCategory", back_populates="resources")


class Club(Base):
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    image_url = Column(String, nullable=True)
    category_id = Column(Integer, ForeignKey("club_categories.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    category = relationship("ClubCategory", back_populates="clubs")