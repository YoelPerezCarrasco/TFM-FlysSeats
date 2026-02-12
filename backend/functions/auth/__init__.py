import azure.functions as func
import json
import logging
import sys
import os
from datetime import datetime, timedelta
import jwt
import hashlib
import uuid

# Añadir el directorio raíz al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.cosmos_client import cosmos_db
from utils.redis_client import redis_client
from config import Config

logger = logging.getLogger(__name__)


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Azure Function para autenticación
    
    Endpoints:
    - POST /api/auth/login - Login de usuario
    - POST /api/auth/register - Registro de usuario
    - POST /api/auth/logout - Logout de usuario
    - GET /api/auth/verify - Verificar token
    """
    logger.info(f'🔐 Procesando request de autenticación: {req.method}')
    
    try:
        route = req.route_params.get('route', 'login')
        
        if req.method == 'POST' and route == 'login':
            return handle_login(req)
        elif req.method == 'POST' and route == 'register':
            return handle_register(req)
        elif req.method == 'POST' and route == 'logout':
            return handle_logout(req)
        elif req.method == 'GET' and route == 'verify':
            return handle_verify(req)
        else:
            return func.HttpResponse(
                json.dumps({"error": "Route not found"}),
                mimetype="application/json",
                status_code=404
            )
            
    except Exception as e:
        logger.error(f'❌ Error en autenticación: {e}')
        return func.HttpResponse(
            json.dumps({
                "error": "Internal server error",
                "message": str(e)
            }),
            mimetype="application/json",
            status_code=500
        )


def handle_login(req: func.HttpRequest) -> func.HttpResponse:
    """Maneja el login de usuario"""
    try:
        req_body = req.get_json()
    except ValueError:
        return func.HttpResponse(
            json.dumps({"error": "Invalid JSON body"}),
            mimetype="application/json",
            status_code=400
        )
    
    email = req_body.get('email')
    password = req_body.get('password')
    
    if not email or not password:
        return func.HttpResponse(
            json.dumps({"error": "Email and password are required"}),
            mimetype="application/json",
            status_code=400
        )
    
    try:
        # Buscar usuario por email
        user = cosmos_db.get_user_by_email(email)
        
        if not user:
            logger.warning(f'Usuario no encontrado: {email}')
            return func.HttpResponse(
                json.dumps({"error": "Invalid credentials"}),
                mimetype="application/json",
                status_code=401
            )
        
        # Verificar contraseña
        password_hash = hash_password(password)
        
        if user.get('passwordHash') != password_hash:
            logger.warning(f'Contraseña incorrecta para: {email}')
            return func.HttpResponse(
                json.dumps({"error": "Invalid credentials"}),
                mimetype="application/json",
                status_code=401
            )
        
        # Generar JWT token
        token = generate_jwt_token(user)
        
        # Guardar sesión en Redis
        session_id = str(uuid.uuid4())
        redis_client.set_session(session_id, {
            'userId': user['userId'],
            'email': user['email'],
            'loginAt': datetime.utcnow().isoformat()
        })
        
        logger.info(f'✅ Login exitoso para: {email}')
        
        # Devolver usuario sin datos sensibles
        user_data = {
            'userId': user['userId'],
            'email': user['email'],
            'name': user.get('name', ''),
            'token': token,
            'sessionId': session_id
        }
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "data": user_data
            }),
            mimetype="application/json",
            status_code=200
        )
        
    except Exception as e:
        logger.error(f'Error en login: {e}')
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            mimetype="application/json",
            status_code=500
        )


def handle_register(req: func.HttpRequest) -> func.HttpResponse:
    """Maneja el registro de nuevo usuario"""
    try:
        req_body = req.get_json()
    except ValueError:
        return func.HttpResponse(
            json.dumps({"error": "Invalid JSON body"}),
            mimetype="application/json",
            status_code=400
        )
    
    email = req_body.get('email')
    password = req_body.get('password')
    name = req_body.get('name', '')
    
    if not email or not password:
        return func.HttpResponse(
            json.dumps({"error": "Email and password are required"}),
            mimetype="application/json",
            status_code=400
        )
    
    try:
        # Verificar si el usuario ya existe
        existing_user = cosmos_db.get_user_by_email(email)
        
        if existing_user:
            return func.HttpResponse(
                json.dumps({"error": "User already exists"}),
                mimetype="application/json",
                status_code=409
            )
        
        # Crear nuevo usuario
        user_data = {
            'userId': str(uuid.uuid4()),
            'email': email,
            'name': name,
            'passwordHash': hash_password(password),
            'createdAt': datetime.utcnow().isoformat(),
            'updatedAt': datetime.utcnow().isoformat()
        }
        
        user = cosmos_db.create_user(user_data)
        
        # Generar JWT token
        token = generate_jwt_token(user)
        
        # Guardar sesión
        session_id = str(uuid.uuid4())
        redis_client.set_session(session_id, {
            'userId': user['userId'],
            'email': user['email'],
            'loginAt': datetime.utcnow().isoformat()
        })
        
        logger.info(f'✅ Usuario registrado: {email}')
        
        # Devolver usuario sin datos sensibles
        user_response = {
            'userId': user['userId'],
            'email': user['email'],
            'name': user.get('name', ''),
            'token': token,
            'sessionId': session_id
        }
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "data": user_response
            }),
            mimetype="application/json",
            status_code=201
        )
        
    except Exception as e:
        logger.error(f'Error en registro: {e}')
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            mimetype="application/json",
            status_code=500
        )


def handle_logout(req: func.HttpRequest) -> func.HttpResponse:
    """Maneja el logout de usuario"""
    try:
        req_body = req.get_json()
        session_id = req_body.get('sessionId')
        
        if session_id:
            redis_client.delete_session(session_id)
            logger.info(f'✅ Logout exitoso')
        
        return func.HttpResponse(
            json.dumps({"success": True, "message": "Logged out successfully"}),
            mimetype="application/json",
            status_code=200
        )
        
    except Exception as e:
        logger.error(f'Error en logout: {e}')
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            mimetype="application/json",
            status_code=500
        )


def handle_verify(req: func.HttpRequest) -> func.HttpResponse:
    """Verifica un JWT token"""
    auth_header = req.headers.get('Authorization', '')
    
    if not auth_header.startswith('Bearer '):
        return func.HttpResponse(
            json.dumps({"error": "Missing or invalid authorization header"}),
            mimetype="application/json",
            status_code=401
        )
    
    token = auth_header.replace('Bearer ', '')
    
    try:
        # Verificar token
        payload = jwt.decode(
            token,
            Config.JWT_SECRET_KEY,
            algorithms=[Config.JWT_ALGORITHM]
        )
        
        logger.info(f'✅ Token válido para userId: {payload.get("userId")}')
        
        return func.HttpResponse(
            json.dumps({
                "valid": True,
                "userId": payload.get('userId'),
                "email": payload.get('email')
            }),
            mimetype="application/json",
            status_code=200
        )
        
    except jwt.ExpiredSignatureError:
        return func.HttpResponse(
            json.dumps({"error": "Token expired"}),
            mimetype="application/json",
            status_code=401
        )
    except jwt.InvalidTokenError:
        return func.HttpResponse(
            json.dumps({"error": "Invalid token"}),
            mimetype="application/json",
            status_code=401
        )


def hash_password(password: str) -> str:
    """Hash de contraseña usando SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


def generate_jwt_token(user: dict) -> str:
    """Genera un JWT token para el usuario"""
    payload = {
        'userId': user['userId'],
        'email': user['email'],
        'exp': datetime.utcnow() + timedelta(hours=Config.JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    
    token = jwt.encode(
        payload,
        Config.JWT_SECRET_KEY,
        algorithm=Config.JWT_ALGORITHM
    )
    
    return token

