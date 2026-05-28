from datetime import datetime, timedelta
from jose import JWTError, jwt

SECRET_KEY = "fm_secret_key_2026_change_in_production"
ALGORITHM = "HS256"
EXPIRE_DAYS = 30

def create_token(user_id: int):
    expire = datetime.utcnow() + timedelta(days=EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload.get("sub"))
    except JWTError:
        return None
