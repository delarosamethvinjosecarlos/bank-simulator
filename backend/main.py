from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
import bcrypt
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer

# ==========================================
# 0. CONFIGURACIÓN DE SEGURIDAD (JWT)
# ==========================================
SECRET_KEY = "bbva_mock_secret_key_super_secure"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ==========================================
# 1. CONFIGURACIÓN DE BASE DE DATOS (SQLite)
# ==========================================
SQLALCHEMY_DATABASE_URL = "sqlite:///./banco.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    account_iban = Column(String, unique=True, index=True)
    balance = Column(Float, default=0.0)

Base.metadata.create_all(bind=engine)

# ==========================================
# 2. ESQUEMAS PYDANTIC (Entrada/Salida)
# ==========================================
class UserCreate(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    username: str
    account_iban: str
    balance: float

    class Config:
        from_attributes = True

class TransferRequest(BaseModel):
    iban_destino: str
    amount: float

# ==========================================
# 3. APLICACIÓN FASTAPI
# ==========================================
app = FastAPI(title="BBVA Mock API - Backend Python")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Función para generar token
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Función para validar al usuario logueado en cada petición segura
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(UserDB).filter(UserDB.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# ==========================================
# 4. ENDPOINTS (Rutas)
# ==========================================
@app.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(user.password.encode('utf-8'), salt)
    
    import random
    fake_iban = f"ES912100{random.randint(10000000, 99999999)}"
    
    nuevo_usuario = UserDB(username=user.username, password_hash=hashed.decode('utf-8'), account_iban=fake_iban, balance=1500.00)
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

@app.post("/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.username == req.username).first()
    if not user or not bcrypt.checkpw(req.password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=UserResponse)
def get_user_me(current_user: UserDB = Depends(get_current_user)):
    return current_user

@app.post("/transferencias")
def realizar_transferencia(transfer: TransferRequest, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    iban_dest = transfer.iban_destino.upper().replace(" ", "")
    
    if not (iban_dest.startswith('FR') or iban_dest.startswith('DE') or iban_dest.startswith('IT')):
        raise HTTPException(status_code=400, detail="El IBAN debe pertenecer a un país autorizado (FR, DE, IT).")
    
    if transfer.amount <= 0:
        raise HTTPException(status_code=400, detail="El importe debe ser mayor que cero.")
        
    if transfer.amount > current_user.balance:
        raise HTTPException(status_code=400, detail="Fondos insuficientes.")
        
    if transfer.amount > 10000:
        raise HTTPException(status_code=403, detail="Bloqueo de Seguridad: La transferencia supera el límite antiblanqueo.")
        
    # Restar saldo
    current_user.balance -= transfer.amount
    db.commit()
    
    return {"status": "success", "message": "Transferencia procesada con éxito", "nuevo_saldo": current_user.balance}
