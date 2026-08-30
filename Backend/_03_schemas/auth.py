from pydantic import BaseModel, EmailStr


class RequestOTP(BaseModel):
    email: EmailStr

class VerifyAndRegister(BaseModel):
    email: EmailStr
    otp_code: str
    username: str
    password: str
    full_name: str | None = None

class UserLogin(BaseModel):
    identifier: str
    password: str
    
class Token(BaseModel):
    access_token: str
    token_type: str
    message: str | None = None

class ResetPassword(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str

