import azure.functions as func
import json
import logging
from datetime import datetime

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed login request.')

    try:
        req_body = req.get_json()
        email = req_body.get('email')
        password = req_body.get('password')
        
        # Mock authentication - replace with actual authentication logic
        if email and password:
            user = {
                "id": "user123",
                "email": email,
                "name": "Test User",
                "token": "mock-jwt-token-" + email
            }
            
            return func.HttpResponse(
                body=json.dumps(user),
                mimetype="application/json",
                status_code=200
            )
        else:
            return func.HttpResponse(
                "Invalid credentials",
                status_code=401
            )
    except ValueError:
        return func.HttpResponse(
            "Invalid request body",
            status_code=400
        )
    except Exception as e:
        logging.error(f"Error processing login: {str(e)}")
        return func.HttpResponse(
            "Internal server error",
            status_code=500
        )
