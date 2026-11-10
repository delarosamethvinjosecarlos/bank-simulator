from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
import bcrypt

# ==========================================
# 1. CONFIGURACIÓN DE BASE DE DATOS (SQLite)
# ==========================================
SQLALCHEMY_DATABASE_URL = "sqlite:///./banco.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==========================================
# 2. MODELOS DE DATOS (Tablas SQL)
# ==========================================
class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    account_iban = Column(String, unique=True, index=True)
    balance = Column(Float, default=0.0)

Base.metadata.create_all(bind=engine)

# ==========================================
# 3. ESQUEMAS PYDANTIC (Validación de entrada/salida)
# ==========================================
class UserCreate(BaseModel):
    username: str
    password: str

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
# 4. APLICACIÓN FASTAPI
# ==========================================
app = FastAPI(title="BBVA Mock API - Backend Python")

# Configurar CORS para que el Frontend (React) pueda conectarse
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependencia para obtener la sesión de BD
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 5. ENDPOINTS (Rutas)
# ==========================================
@app.get("/")
def read_root():
    return {"status": "ok", "message": "API de BBVA Mock funcionando"}

@app.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Comprobar si existe
    db_user = db.query(UserDB).filter(UserDB.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    # Hashear contraseña
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(user.password.encode('utf-8'), salt)
    
    # Generar un IBAN simulado aleatorio para el nuevo usuario
    import random
    fake_iban = f"ES912100{random.randint(10000000, 99999999)}"
    
    nuevo_usuario = UserDB(
        username=user.username,
        password_hash=hashed.decode('utf-8'),
        account_iban=fake_iban,
        balance=1500.00 # Regalo de bienvenida simulado
    )
    
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

# Aquí añadiremos luego el POST /login y POST /transferencias
