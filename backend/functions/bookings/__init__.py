import azure.functions as func
import json
import logging
from datetime import datetime

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed bookings request.')

    try:
        # Mock bookings data - replace with actual database query
        bookings = [
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
            body=json.dumps(bookings),
            mimetype="application/json",
            status_code=200
        )
    except Exception as e:
        logging.error(f"Error processing bookings request: {str(e)}")
        return func.HttpResponse(
            "Internal server error",
            status_code=500
        )
