import os
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import httpx
from jose import jwt, JWTError
from .database import get_db
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm 
from passlib.context import CryptContext
from . import crud, models, schemas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# --- Configuration ---
router = APIRouter(
    prefix='/auth',
    tags=["auth"],
)

# Google OAuth Credentials
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

# JWT Settings
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password , hashed_password)
def get_password_hash(password ):
    return pwd_context.hash(password)
def authenticate_user(db:Session,email:str,password:str):
    user = crud.get_user_by_email(db,email=email)
    if not user or not verify_password(password,user.hashed_password):
        return False
    return user

# --- Helper Functions ---
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Creates a JWT access token."""
    if not JWT_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT secret key is not configured."
        )
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        if not JWT_SECRET_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="JWT_SECRET_KEY not set"
            )
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation error: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = crud.get_user_by_email(db, email=token_data.email)
    
    if user is None:
        raise credentials_exception
    return user 
 
    


# --- Authentication Routes ---
@router.get("/google/login")
async def google_login():
    """Redirects the user to Google's login page."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_REDIRECT_URI:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth credentials or redirect URI not configured in .env."
        )
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        "response_type=code&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        "scope=openid%20profile%20email&"
        "access_type=offline"
    )
    print(f"!!!! GENERATED REDIRECT URL: {google_auth_url}")
    return RedirectResponse(url=google_auth_url)

@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """
    Handles the callback from Google. Exchanges the code for tokens,
    verifies the user, and returns a JWT.
    """
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Authorization code not provided.")
    
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET or not GOOGLE_REDIRECT_URI:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth credentials or redirect URI not configured in .env."
        )
    
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    
    try:
        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data)
            token_response.raise_for_status()
            tokens = token_response.json()
    except (httpx.HTTPStatusError, httpx.RequestError) as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to exchange authorization code for tokens: {e}"
        )
    
    id_token = tokens.get("id_token")
    if not id_token:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="ID token not received")
    
    try:
        async with httpx.AsyncClient() as client:
            jwks_response = await client.get("https://www.googleapis.com/oauth2/v3/certs")
            jwks_response.raise_for_status()
            jwks = jwks_response.json()
        
        unverified_header = jwt.get_unverified_header(id_token)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {"kty": key["kty"], "kid": key["kid"], "use": key["use"], "n": key["n"], "e": key["e"]}
                break
        
        if not rsa_key:
            raise HTTPException(status_code=500, detail="Could not find matching public key for token.")
        
        payload = jwt.decode(
            id_token,
            rsa_key,
            algorithms=[unverified_header.get("alg", "RS256")],
            audience=GOOGLE_CLIENT_ID,
            issuer="https://accounts.google.com",
            access_token=tokens.get("access_token")
        )
        
        user_email = payload.get("email")
        if not user_email:
            raise HTTPException(status_code=400, detail="Email not found in ID token.")
        
        user = crud.get_user_by_email(db, email=user_email)
        if not user:
            user_in = schemas.UserCreate(email=user_email, password="google_oauth_user")
            user = crud.create_user(db=db, user=user_in)
            user.is_verified = True
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"New user created: {user.email}")
        else:
            print(f"Existing user logged in: {user.email}")
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
    
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid ID token: {e}")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during OAuth callback: {e}"
        )
    
@router.get("/verify-email", response_model=schemas.User)
async def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.verification_token == token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token."
        )
    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified."
        )
    if user.verification_token_expires and user.verification_token_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired."
        )
    user.is_verified = True
    user.verification_token = None # Clear the token after use
    user.verification_token_expires = None # Clear expiration
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/token", response_model = schemas.Token)
async def login_for_acess_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username , form_data.password)    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expire = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expire
    )
    return {"access_token": access_token, "token_type":"bearer"}