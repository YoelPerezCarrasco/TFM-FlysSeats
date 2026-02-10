import azure.functions as func
import json
import logging

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request for flight search.')

    try:
        req_body = req.get_json()
        origin = req_body.get('origin')
        destination = req_body.get('destination')
        departure_date = req_body.get('departureDate')
        passengers = req_body.get('passengers', 1)
        
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
            status_code=200
        )
    except ValueError:
        return func.HttpResponse(
            "Invalid request body",
            status_code=400
        )
    except Exception as e:
        logging.error(f"Error processing request: {str(e)}")
        return func.HttpResponse(
            "Internal server error",
            status_code=500
        )
