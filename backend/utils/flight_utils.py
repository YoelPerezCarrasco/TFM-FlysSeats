"""
Flight API utility functions
"""
import re
from typing import Dict


def generate_flight_id(flight_number: str, date_str: str, departure_code: str) -> str:
    """Generate a unique flight ID"""
    # Format: flight_AA123_20260301_MAD
    clean_flight = re.sub(r'[^A-Z0-9]', '', flight_number.upper())
    clean_date = date_str.replace('-', '')
    return f"flight_{clean_flight}_{clean_date}_{departure_code}"


def generate_seat_id(flight_id: str, seat_number: str) -> str:
    """Generate a unique seat ID"""
    # Format: seat_AA123_20260301_12A
    clean_seat = re.sub(r'[^A-Z0-9]', '', seat_number.upper())
    return f"seat_{flight_id.replace('flight_', '')}_{clean_seat}"


def parse_seat_number(seat_number: str) -> Dict:
    """Parse seat number into row and column"""
    # Example: 12A -> row=12, column=A
    match = re.match(r'(\d+)([A-K])', seat_number.upper())
    if not match:
        raise ValueError(f"Invalid seat number format: {seat_number}")
    
    row = int(match.group(1))
    column = match.group(2)
    
    return {"row": row, "column": column}


def determine_seat_type(column: str) -> str:
    """Determine seat type based on column"""
   # Typical configuration: ABC DEF (6-seat row) or ABC DEFG HJK (10-seat row)
    window_cols = ['A', 'K', 'F']  # Simplified
    aisle_cols = ['C', 'D', 'G', 'H']
    
    if column in window_cols:
        return SeatType.WINDOW
    elif column in aisle_cols:
        return SeatType.AISLE
    else:
        return SeatType.MIDDLE


def determine_seat_section(row: int, total_rows: int = 40) -> str:
    """Determine seat section based on row number"""
    if row <= total_rows / 3:
        return SeatSection.FRONT
    elif row <= 2 * total_rows / 3:
        return SeatSection.MIDDLE
    else:
        return SeatSection.BACK
