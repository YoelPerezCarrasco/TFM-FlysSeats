import azure.functions as func
import json
import logging
from datetime import datetime

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# Auth endpoint - Login
@app.route(route="auth/login", methods=["POST"])
def login(req: func.HttpRequest) -> func.HttpResponse:
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
                status_code=200,
                headers={"Content-Type": "application/json"}
            )
        else:
            return func.HttpResponse(
                json.dumps({"error": "Invalid credentials"}),
                mimetype="application/json",
                status_code=401
            )
    except ValueError:
        return func.HttpResponse(
            json.dumps({"error": "Invalid request body"}),
            mimetype="application/json",
            status_code=400
        )
    except Exception as e:
        logging.error(f"Error processing login: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Internal server error"}),
            mimetype="application/json",
            status_code=500
        )


# Flights endpoint - Search flights
@app.route(route="flights/search", methods=["GET", "POST"])
def search_flights(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request for flight search.')

    try:
        if req.method == "POST":
            req_body = req.get_json()
            origin = req_body.get('origin')
            destination = req_body.get('destination')
            departure_date = req_body.get('departureDate')
            passengers = req_body.get('passengers', 1)
        else:
            origin = req.params.get('origin')
            destination = req.params.get('destination')
            departure_date = req.params.get('departureDate')
            passengers = req.params.get('passengers', 1)
        
        # Mock response - replace with actual database query
        flights = [
            {
                "id": "FL001",
                "flightNumber": "AA123",
                "airline": "American Airlines",
                "origin": origin,
                "destination": destination,
                "departureTime": f"{departure_date}T08:00:00",
                "arrivalTime": f"{departure_date}T12:00:00",
                "price": 299.99,
                "availableSeats": 45
            },
            {
                "id": "FL002",
                "flightNumber": "DL456",
                "airline": "Delta",
                "origin": origin,
                "destination": destination,
                "departureTime": f"{departure_date}T14:00:00",
                "arrivalTime": f"{departure_date}T18:00:00",
                "price": 349.99,
                "availableSeats": 32
            }
        ]
        
        return func.HttpResponse(
            body=json.dumps(flights),
            mimetype="application/json",
            status_code=200,
            headers={"Content-Type": "application/json"}
        )
    except ValueError:
        return func.HttpResponse(
            json.dumps({"error": "Invalid request body"}),
            mimetype="application/json",
            status_code=400
        )
    except Exception as e:
        logging.error(f"Error processing request: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Internal server error"}),
            mimetype="application/json",
            status_code=500
        )


# Bookings endpoint - Get user bookings
@app.route(route="bookings", methods=["GET", "POST"])
def bookings(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed bookings request.')

    try:
        if req.method == "POST":
            # Create new booking
            req_body = req.get_json()
            new_booking = {
                "id": f"BK{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "userId": req_body.get('userId', 'user123'),
                "flightId": req_body.get('flightId'),
                "bookingNumber": f"BKG-{datetime.now().strftime('%Y-%m%d-%H%M%S')}",
                "passengerName": req_body.get('passengerName'),
                "seatNumber": req_body.get('seatNumber'),
                "status": "confirmed",
                "createdAt": datetime.now().isoformat()
            }
            return func.HttpResponse(
                body=json.dumps(new_booking),
                mimetype="application/json",
                status_code=201,
                headers={"Content-Type": "application/json"}
            )
        else:
            # Get bookings list
            bookings_list = [
                {
                    "id": "BK001",
                    "userId": "user123",
                    "flightId": "FL001",
                    "bookingNumber": "BKG-2024-001",
                    "passengerName": "John Doe",
                    "seatNumber": "12A",
                    "status": "confirmed",
                    "createdAt": "2024-01-15T10:00:00"
                },
                {
                    "id": "BK002",
                    "userId": "user123",
                    "flightId": "FL002",
                    "bookingNumber": "BKG-2024-002",
                    "passengerName": "John Doe",
                    "seatNumber": "15C",
                    "status": "pending",
                    "createdAt": "2024-01-20T14:30:00"
                }
            ]
            
            return func.HttpResponse(
                body=json.dumps(bookings_list),
                mimetype="application/json",
                status_code=200,
                headers={"Content-Type": "application/json"}
            )
    except Exception as e:
        logging.error(f"Error processing bookings request: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Internal server error"}),
            mimetype="application/json",
            status_code=500
        )
