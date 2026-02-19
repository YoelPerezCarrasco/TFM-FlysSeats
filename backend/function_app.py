import azure.functions as func
import json
import logging
from datetime import datetime, date, time
from uuid import uuid4
from utils.cosmos_client import cosmos_db
from models.flight import Flight, Airport, Aircraft, FlightStatus, Coordinates
from models.seat import Seat, SeatDetails, SeatPreferences, SeatType, SeatSection
from pydantic import ValidationError

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


# ==================== FLIGHTS API ====================

@app.route(route="flights", methods=["GET", "POST"])
def flights(req: func.HttpRequest) -> func.HttpResponse:
    """Get all flights or create a new flight"""
    logging.info('Processing flights request')
    
    try:
        if req.method == "GET":
            # Search flights
            search_params = {}
            
            flight_number = req.params.get('flight_number')
            departure_code = req.params.get('departure_code')
            arrival_code = req.params.get('arrival_code')
            date_param = req.params.get('date')
            
            if flight_number:
                search_params['flight_number'] = flight_number
            if departure_code:
                search_params['departure_code'] = departure_code
            if arrival_code:
                search_params['arrival_code'] = arrival_code
            if date_param:
                search_params['date'] = date_param
            
            flights_list = cosmos_db.search_flights(search_params)
            
            return func.HttpResponse(
                body=json.dumps(flights_list, default=str),
                mimetype="application/json",
                status_code=200,
                headers={"Content-Type": "application/json"}
            )
        
        elif req.method == "POST":
            # Create new flight
            from utils.flight_utils import generate_flight_id
            
            req_body = req.get_json()
            
            # Validate required fields
            required_fields = ['flight_number', 'airline', 'departure', 'arrival', 'created_by']
            for field in required_fields:
                if field not in req_body:
                    return func.HttpResponse(
                        json.dumps({"error": f"Missing required field: {field}"}),
                        mimetype="application/json",
                        status_code=400
                    )
            
            # Check if flight already exists
            flight_id = generate_flight_id(
                req_body['flight_number'],
                req_body['departure']['date'],
                req_body['departure']['airport_code']
            )
            
            if cosmos_db.get_flight_exists(
                req_body['flight_number'],
                req_body['departure']['date'],
                req_body['departure']['airport_code']
            ):
                return func.HttpResponse(
                    json.dumps({"error": "Flight already exists with same number, date and origin"}),
                    mimetype="application/json",
                    status_code=409
                )
            
            # Create flight
            flight_data = {
                "id": flight_id,
                "type": "flight",
                "flight_number": req_body['flight_number'],
                "airline": req_body['airline'],
                "departure": req_body['departure'],
                "arrival": req_body['arrival'],
                "aircraft": req_body.get('aircraft'),
                "created_by": req_body['created_by'],
                "participants_count": 0,
                "active_swaps_count": 0,
                "status": req_body.get('status', 'upcoming'),
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            flight = cosmos_db.create_flight(flight_data)
            
            return func.HttpResponse(
                body=json.dumps(flight, default=str),
                mimetype="application/json",
                status_code=201,
                headers={"Content-Type": "application/json"}
            )
    
    except ValidationError as ve:
        logging.error(f"Validation error: {str(ve)}")
        return func.HttpResponse(
            json.dumps({"error": "Validation error", "details": str(ve)}),
            mimetype="application/json",
            status_code=400
        )
    except Exception as e:
        logging.error(f"Error processing flights request: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Internal server error", "details": str(e)}),
            mimetype="application/json",
            status_code=500
        )


@app.route(route="flights/{flight_id}", methods=["GET", "PUT", "DELETE"])
def flight_detail(req: func.HttpRequest) -> func.HttpResponse:
    """Get, update or delete a specific flight"""
    logging.info('Processing flight detail request')
    
    try:
        flight_id = req.route_params.get('flight_id')
        
        if req.method == "GET":
            # Get flight
            flight = cosmos_db.get_flight(flight_id)
            
            if not flight:
                return func.HttpResponse(
                    json.dumps({"error": "Flight not found"}),
                    mimetype="application/json",
                    status_code=404
                )
            
            return func.HttpResponse(
                body=json.dumps(flight, default=str),
                mimetype="application/json",
                status_code=200,
                headers={"Content-Type": "application/json"}
            )
        
        elif req.method == "PUT":
            # Update flight
            req_body = req.get_json()
            
            existing_flight = cosmos_db.get_flight(flight_id)
            if not existing_flight:
                return func.HttpResponse(
                    json.dumps({"error": "Flight not found"}),
                    mimetype="application/json",
                    status_code=404
                )
            
            # Update fields
            flight_data = existing_flight.copy()
            if 'status' in req_body:
                flight_data['status'] = req_body['status']
            if 'participants_count' in req_body:
                flight_data['participants_count'] = req_body['participants_count']
            if 'active_swaps_count' in req_body:
                flight_data['active_swaps_count'] = req_body['active_swaps_count']
            
            flight_data['updated_at'] = datetime.utcnow().isoformat()
            
            flight = cosmos_db.update_flight(flight_id, flight_data)
            
            return func.HttpResponse(
                body=json.dumps(flight, default=str),
                mimetype="application/json",
                status_code=200,
                headers={"Content-Type": "application/json"}
            )
        
        elif req.method == "DELETE":
            # Delete flight
            success = cosmos_db.delete_flight(flight_id)
            
            if not success:
                return func.HttpResponse(
                    json.dumps({"error": "Flight not found or could not be deleted"}),
                    mimetype="application/json",
                    status_code=404
                )
            
            return func.HttpResponse(
                body=json.dumps({"message": "Flight deleted successfully"}),
                mimetype="application/json",
                status_code=200,
                headers={"Content-Type": "application/json"}
            )
    
    except Exception as e:
        logging.error(f"Error processing flight detail request: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Internal server error", "details": str(e)}),
            mimetype="application/json",
            status_code=500
        )


# ==================== SEATS API ====================

@app.route(route="flights/{flight_id}/seats", methods=["GET", "POST"])
def flight_seats(req: func.HttpRequest) -> func.HttpResponse:
    """Get all seats for a flight or join a flight with a seat"""
    logging.info('Processing flight seats request')
    
    try:
        flight_id = req.route_params.get('flight_id')
        
        if req.method == "GET":
            # Get all seats for flight
            seats = cosmos_db.get_flight_seats(flight_id)
            
            return func.HttpResponse(
                body=json.dumps(seats, default=str),
                mimetype="application/json",
                status_code=200,
                headers={"Content-Type": "application/json"}
            )
        
        elif req.method == "POST":
            # Join flight with a seat
            from utils.flight_utils import generate_seat_id, parse_seat_number, determine_seat_type, determine_seat_section
            
            req_body = req.get_json()
            
            # Validate required fields
            required_fields = ['user_id', 'seat_number']
            for field in required_fields:
                if field not in req_body:
                    return func.HttpResponse(
                        json.dumps({"error": f"Missing required field: {field}"}),
                        mimetype="application/json",
                        status_code=400
                    )
            
            # Check if flight exists
            flight = cosmos_db.get_flight(flight_id)
            if not flight:
                return func.HttpResponse(
                    json.dumps({"error": "Flight not found"}),
                    mimetype="application/json",
                    status_code=404
                )
            
            # Check if seat is already taken
            seat_number = req_body['seat_number'].upper()
            if cosmos_db.get_seat_taken(flight_id, seat_number):
                return func.HttpResponse(
                    json.dumps({"error": "Seat already taken"}),
                    mimetype="application/json",
                    status_code=409
                )
            
            # Check if user already has a seat on this flight
            existing_seat = cosmos_db.get_user_seat_for_flight(req_body['user_id'], flight_id)
            if existing_seat:
                return func.HttpResponse(
                    json.dumps({"error": "User already has a seat on this flight"}),
                    mimetype="application/json",
                    status_code=409
                )
            
            # Parse seat number
            seat_info = parse_seat_number(seat_number)
            seat_type = determine_seat_type(seat_info['column'])
            seat_section = determine_seat_section(seat_info['row'])
            
            # Create seat
            seat_id = generate_seat_id(flight_id, seat_number)
            
            seat_data = {
                "id": seat_id,
                "type": "seat",
                "flight_id": flight_id,
                "user_id": req_body['user_id'],
                "seat_number": seat_number,
                "seat_details": {
                    "type": seat_type,
                    "section": seat_section,
                    "row": seat_info['row'],
                    "column": seat_info['column'],
                    "is_emergency_exit": req_body.get('is_emergency_exit', False),
                    "is_reclinable": req_body.get('is_reclinable', True),
                    "extra_legroom": req_body.get('extra_legroom', False)
                },
                "preferences": req_body.get('preferences'),
                "open_to_swap": req_body.get('open_to_swap', True),
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            seat = cosmos_db.create_seat(seat_data)
            
            # Update flight participants count
            flight['participants_count'] = flight.get('participants_count', 0) + 1
            cosmos_db.update_flight(flight_id, flight)
            
            return func.HttpResponse(
                body=json.dumps(seat, default=str),
                mimetype="application/json",
                status_code=201,
                headers={"Content-Type": "application/json"}
            )
    
    except ValueError as ve:
        logging.error(f"Validation error: {str(ve)}")
        return func.HttpResponse(
            json.dumps({"error": str(ve)}),
            mimetype="application/json",
            status_code=400
        )
    except Exception as e:
        logging.error(f"Error processing flight seats request: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Internal server error", "details": str(e)}),
            mimetype="application/json",
            status_code=500
        )


@app.route(route="seats/{seat_id}", methods=["GET", "PUT", "DELETE"])
def seat_detail(req: func.HttpRequest) -> func.HttpResponse:
    """Get, update or delete a specific seat"""
    logging.info('Processing seat detail request')
    
    try:
        seat_id = req.route_params.get('seat_id')
        
        if req.method == "GET":
            # Get seat
            seat = cosmos_db.get_seat(seat_id)
            
            if not seat:
                return func.HttpResponse(
                    json.dumps({"error": "Seat not found"}),
                    mimetype="application/json",
                    status_code=404
                )
            
            return func.HttpResponse(
                body=json.dumps(seat, default=str),
                mimetype="application/json",
                status_code=200,
                headers={"Content-Type": "application/json"}
            )
        
        elif req.method == "PUT":
            # Update seat (mainly preferences)
            req_body = req.get_json()
            
            existing_seat = cosmos_db.get_seat(seat_id)
            if not existing_seat:
                return func.HttpResponse(
                    json.dumps({"error": "Seat not found"}),
                    mimetype="application/json",
                    status_code=404
                )
            
            # Update fields
            seat_data = existing_seat.copy()
            if 'preferences' in req_body:
                seat_data['preferences'] = req_body['preferences']
            if 'open_to_swap' in req_body:
                seat_data['open_to_swap'] = req_body['open_to_swap']
            
            seat_data['updated_at'] = datetime.utcnow().isoformat()
            
            seat = cosmos_db.update_seat(seat_id, seat_data)
            
            return func.HttpResponse(
                body=json.dumps(seat, default=str),
                mimetype="application/json",
                status_code=200,
                headers={"Content-Type": "application/json"}
            )
        
        elif req.method == "DELETE":
            # Delete seat (leave flight)
            seat = cosmos_db.get_seat(seat_id)
            if not seat:
                return func.HttpResponse(
                    json.dumps({"error": "Seat not found"}),
                    mimetype="application/json",
                    status_code=404
                )
            
            success = cosmos_db.delete_seat(seat_id)
            
            if success:
                # Update flight participants count
                flight = cosmos_db.get_flight(seat['flight_id'])
                if flight:
                    flight['participants_count'] = max(0, flight.get('participants_count', 1) - 1)
                    cosmos_db.update_flight(seat['flight_id'], flight)
            
            return func.HttpResponse(
                body=json.dumps({"message": "Seat deleted successfully"}),
                mimetype="application/json",
                status_code=200,
                headers={"Content-Type": "application/json"}
            )
    
    except Exception as e:
        logging.error(f"Error processing seat detail request: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Internal server error", "details": str(e)}),
            mimetype="application/json",
            status_code=500
        )
