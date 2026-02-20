"""
Matching Engine for Seat Swap Suggestions

Implements a scoring algorithm with 4 factors:
- Preference compatibility (40%)
- User reputation (30%)
- Request age / wait time (20%)
- Seat proximity (10%)
"""
import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Scoring weights
WEIGHT_PREFERENCE = 0.40
WEIGHT_REPUTATION = 0.30
WEIGHT_WAIT_TIME = 0.20
WEIGHT_PROXIMITY = 0.10

# Section order for proximity calculation
SECTION_ORDER = {'FRONT': 0, 'MIDDLE': 1, 'BACK': 2}
SEAT_TYPE_MAP = {'WINDOW': 0, 'MIDDLE': 1, 'AISLE': 2}


def calculate_match_score(
    seat_a: Dict,
    seat_b: Dict,
    user_a: Optional[Dict] = None,
    user_b: Optional[Dict] = None
) -> float:
    """
    Calculate bidirectional match score between two seats.
    
    Both users must benefit from the swap for a good score.
    Returns a score between 0.0 and 100.0.
    """
    prefs_a = seat_a.get('preferences') or {}
    prefs_b = seat_b.get('preferences') or {}
    details_a = seat_a.get('seat_details') or {}
    details_b = seat_b.get('seat_details') or {}
    
    # 1. Preference compatibility (bidirectional)
    pref_score_a_gets_b = _preference_score(prefs_a, details_b)
    pref_score_b_gets_a = _preference_score(prefs_b, details_a)
    # Use geometric mean to penalize one-sided matches
    if pref_score_a_gets_b > 0 and pref_score_b_gets_a > 0:
        pref_score = (pref_score_a_gets_b * pref_score_b_gets_a) ** 0.5
    else:
        pref_score = 0.0
    
    # 2. Reputation score (average of both users)
    rep_score = _reputation_score(user_a, user_b)
    
    # 3. Wait time score (how long both have been waiting)
    wait_score = _wait_time_score(seat_a, seat_b)
    
    # 4. Seat proximity (closer seats = easier swap)
    prox_score = _proximity_score(details_a, details_b)
    
    # Weighted total
    total = (
        WEIGHT_PREFERENCE * pref_score +
        WEIGHT_REPUTATION * rep_score +
        WEIGHT_WAIT_TIME * wait_score +
        WEIGHT_PROXIMITY * prox_score
    )
    
    return round(min(total * 100, 100.0), 1)


def _preference_score(preferences: Dict, target_seat_details: Dict) -> float:
    """
    How well does target_seat_details match the user's preferences?
    Returns 0.0 to 1.0.
    """
    if not preferences or not target_seat_details:
        return 0.3  # Neutral score if no preferences set
    
    weights = preferences.get('importance_weights', {
        'seat_type': 3, 'section': 3, 'together_seats': 3, 'emergency_exit': 3
    })
    total_weight = sum(weights.values()) or 1
    score = 0.0
    
    # Seat type match
    desired_types = preferences.get('desired_type', [])
    if desired_types:
        seat_type = target_seat_details.get('type', '')
        if seat_type in desired_types:
            score += weights.get('seat_type', 3)
        elif len(desired_types) >= 2:
            score += weights.get('seat_type', 3) * 0.3  # Partial credit
    else:
        score += weights.get('seat_type', 3) * 0.5  # No preference = neutral
    
    # Section match
    desired_section = preferences.get('desired_section')
    if desired_section:
        actual_section = target_seat_details.get('section', '')
        if actual_section == desired_section:
            score += weights.get('section', 3)
        else:
            # Adjacent section gets partial credit
            desired_idx = SECTION_ORDER.get(desired_section, 1)
            actual_idx = SECTION_ORDER.get(actual_section, 1)
            if abs(desired_idx - actual_idx) == 1:
                score += weights.get('section', 3) * 0.4
    else:
        score += weights.get('section', 3) * 0.5
    
    # Emergency exit preference
    wants_emergency = preferences.get('emergency_exit', False)
    has_emergency = target_seat_details.get('is_emergency_exit', False)
    if wants_emergency and has_emergency:
        score += weights.get('emergency_exit', 3)
    elif not wants_emergency:
        score += weights.get('emergency_exit', 3) * 0.5
    
    # Together seats (bonus if nearby — simplified)
    together = preferences.get('together_seats', 0)
    if together == 0:
        score += weights.get('together_seats', 3) * 0.5
    # Together seats matching requires group logic — simplified to neutral
    
    return score / total_weight


def _reputation_score(user_a: Optional[Dict], user_b: Optional[Dict]) -> float:
    """
    Average reputation of both users. Returns 0.0 to 1.0.
    New users get a neutral score.
    """
    def _user_rep(user: Optional[Dict]) -> float:
        if not user:
            return 0.5  # Unknown user = neutral
        rep = user.get('reputation', {})
        rating = rep.get('rating', 0)
        total_swaps = rep.get('total_swaps', 0)
        completed = rep.get('completed_swaps', 0)
        
        if total_swaps == 0:
            return 0.5  # New user
        
        # Combine rating (0-5 scale) and completion rate
        rating_norm = rating / 5.0
        completion_rate = completed / total_swaps if total_swaps > 0 else 0.5
        
        return 0.6 * rating_norm + 0.4 * completion_rate
    
    rep_a = _user_rep(user_a)
    rep_b = _user_rep(user_b)
    return (rep_a + rep_b) / 2.0


def _wait_time_score(seat_a: Dict, seat_b: Dict) -> float:
    """
    Score based on how long users have been waiting.
    Longer wait = higher priority. Returns 0.0 to 1.0.
    """
    now = datetime.utcnow()
    
    def _seat_age_hours(seat: Dict) -> float:
        created = seat.get('created_at')
        if isinstance(created, str):
            try:
                dt = datetime.fromisoformat(created.replace('Z', '+00:00'))
                return (now - dt.replace(tzinfo=None)).total_seconds() / 3600
            except (ValueError, TypeError):
                return 0
        return 0
    
    age_a = _seat_age_hours(seat_a)
    age_b = _seat_age_hours(seat_b)
    avg_age = (age_a + age_b) / 2.0
    
    # Normalize: 0h = 0.0, 24h+ = 1.0 (logarithmic-ish)
    if avg_age <= 0:
        return 0.1
    elif avg_age >= 24:
        return 1.0
    else:
        return min(avg_age / 24.0, 1.0)


def _proximity_score(details_a: Dict, details_b: Dict) -> float:
    """
    How close are the two seats? Closer = easier swap. Returns 0.0 to 1.0.
    """
    row_a = details_a.get('row', 0)
    row_b = details_b.get('row', 0)
    
    if row_a == 0 or row_b == 0:
        return 0.5  # Unknown rows
    
    row_diff = abs(row_a - row_b)
    
    # Same row = 1.0, 1-3 rows apart = 0.7, 4-10 = 0.4, 10+ = 0.2
    if row_diff == 0:
        return 1.0
    elif row_diff <= 3:
        return 0.7
    elif row_diff <= 10:
        return 0.4
    else:
        return 0.2


def find_swap_suggestions(
    flight_seats: List[Dict],
    user_seat: Dict,
    users_map: Dict[str, Dict] = None,
    max_results: int = 10
) -> List[Dict]:
    """
    Find the best swap suggestions for a given user's seat on a flight.
    
    Args:
        flight_seats: All seats on the flight that are open_to_swap
        user_seat: The current user's seat
        users_map: Optional dict of user_id -> user_data for reputation
        max_results: Maximum suggestions to return
    
    Returns:
        List of swap suggestion dicts with scores, sorted by score desc
    """
    if users_map is None:
        users_map = {}
    
    user_id = user_seat.get('user_id')
    user_data = users_map.get(user_id)
    suggestions = []
    
    for other_seat in flight_seats:
        # Skip own seat and seats not open to swap
        if other_seat.get('user_id') == user_id:
            continue
        if not other_seat.get('open_to_swap', False):
            continue
        
        other_user_id = other_seat.get('user_id')
        other_user_data = users_map.get(other_user_id)
        
        score = calculate_match_score(
            seat_a=user_seat,
            seat_b=other_seat,
            user_a=user_data,
            user_b=other_user_data
        )
        
        suggestions.append({
            'partner_seat': other_seat,
            'partner_user': {
                'id': other_user_id,
                'name': (other_user_data or {}).get('name', 'Usuario'),
                'reputation': (other_user_data or {}).get('reputation', {})
            },
            'match_score': score,
            'your_seat': user_seat.get('seat_number'),
            'their_seat': other_seat.get('seat_number'),
            'your_seat_details': user_seat.get('seat_details', {}),
            'their_seat_details': other_seat.get('seat_details', {}),
        })
    
    # Sort by score descending
    suggestions.sort(key=lambda x: x['match_score'], reverse=True)
    
    return suggestions[:max_results]
