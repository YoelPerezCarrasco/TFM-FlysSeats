/**
 * TypeScript models for SitFly application
 * Matches backend Pydantic models
 */

// ==================== User Models ====================

export interface UserProfile {
  avatar_url?: string;
  bio?: string;
  preferred_language: string;
}

export interface UserReputation {
  rating: number;
  total_reviews: number;
  total_swaps: number;
  completed_swaps: number;
  cancelled_swaps: number;
  percentage_completed: number;
}

export interface User {
  id: string;
  type: string;
  email: string;
  name: string;
  phone?: string;
  profile: UserProfile;
  reputation: UserReputation;
  created_at: string;
  updated_at: string;
}

// ==================== Flight Models ====================

export enum FlightStatus {
  UPCOMING = 'upcoming',
  BOARDING = 'boarding',
  DEPARTED = 'departed',
  CANCELLED = 'cancelled'
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface Airport {
  airport_code: string;
  airport_name: string;
  city: string;
  country: string;
  date: string;  // YYYY-MM-DD
  time: string;  // HH:MM:SS
  timezone: string;
  coordinates?: Coordinates;
}

export interface Aircraft {
  model: string;
  total_seats: number;
  seat_map_url?: string;
}

export interface Flight {
  // Legacy SitFly properties
  id: string;
  type: string;
  flight_number?: string;
  airline?: string;
  departure?: Airport;
  arrival?: Airport;
  aircraft?: Aircraft;
  created_by?: string;
  participants_count?: number;
  active_swaps_count?: number;
  status?: FlightStatus;
  created_at?: string;
  updated_at?: string;
  
  // Amadeus API properties
  instantTicketingRequired?: boolean;
  isUpsellOffer?: boolean;
  itineraries?: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      aircraft?: {
        code: string;
      };
      operating?: {
        carrierCode?: string;
        carrierName?: string;
      };
      duration: string;
      id: string;
      numberOfStops: number;
      blacklistedInEU: boolean;
    }>;
  }>;
  price?: {
    currency: string;
    total: string;
    base: string;
    fees?: Array<{
      amount: string;
      type: string;
    }>;
    grandTotal?: string;
    additionalServices?: Array<{
      amount: string;
      type: string;
    }>;
  };
  pricingOptions?: {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
  };
  validatingAirlineCodes?: string[];
  travelerPricings?: Array<{
    travelerId: string;
    fareOption: string;
    travelerType: string;
    price?: {
      currency: string;
      total: string;
      base: string;
    };
    fareDetailsBySegment?: Array<{
      segmentId: string;
      cabin?: string;
      class?: string;
      fareBasis?: string;
      brandedFare?: string;
      brandedFareLabel?: string;
      includedCheckedBags?: {
        quantity: number;
      };
      includedCabinBags?: {
        quantity: number;
      };
      amenities?: Array<{
        description: string;
        isChargeable: boolean;
        amenityType: string;
        amenityProvider?: {
          name: string;
        };
      }>;
    }>;
  }>;
  lastTicketingDate?: string;
  lastTicketingDateTime?: string;
  nonHomogeneous?: boolean;
  numberOfBookableSeats?: number;
  oneWay?: boolean;
  source?: string;
}

export interface FlightSearchParams {
  flight_number?: string;
  departure_code?: string;
  arrival_code?: string;
  date?: string;
}

export interface CreateFlightRequest {
  flight_number: string;
  airline: string;
  departure: Airport;
  arrival: Airport;
  aircraft?: Aircraft;
  created_by: string;
  status?: FlightStatus;
}

// ==================== Seat Models ====================

export enum SeatType {
  WINDOW = 'WINDOW',
  AISLE = 'AISLE',
  MIDDLE = 'MIDDLE'
}

export enum SeatSection {
  FRONT = 'FRONT',
  MIDDLE = 'MIDDLE',
  BACK = 'BACK'
}

export interface SeatDetails {
  type: SeatType;
  section: SeatSection;
  row: number;
  column: string;
  is_emergency_exit: boolean;
  is_reclinable: boolean;
  extra_legroom: boolean;
}

export interface SeatPreferences {
  desired_type: SeatType[];
  desired_section?: SeatSection;
  together_seats: number;
  emergency_exit: boolean;
  importance_weights: {
    seat_type: number;
    section: number;
    together_seats: number;
    emergency_exit: number;
  };
}

export interface Seat {
  id: string;
  type: string;
  flight_id: string;
  user_id: string;
  seat_number: string;
  seat_details: SeatDetails;
  preferences?: SeatPreferences;
  open_to_swap: boolean;
  created_at: string;
  updated_at: string;
}

export interface JoinFlightRequest {
  user_id: string;
  seat_number: string;
  is_emergency_exit?: boolean;
  is_reclinable?: boolean;
  extra_legroom?: boolean;
  preferences?: SeatPreferences;
  open_to_swap?: boolean;
}

// ==================== Swap Models ====================

export enum SwapStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  EXPIRED = 'expired'
}

export interface SwapParticipant {
  user_id: string;
  current_seat: string;
  seat_id: string;
}

export interface SwapRequest {
  id: string;
  type: string;
  flight_id: string;
  requester: SwapParticipant;
  partner: SwapParticipant;
  match_score: number;
  status: SwapStatus;
  created_by: string;
  messages_count: number;
  requester_confirmed: boolean;
  partner_confirmed: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// ==================== Message Models ====================

export interface Message {
  id: string;
  type: string;
  swap_request_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

// ==================== Rating Models ====================

export interface Rating {
  id: string;
  type: string;
  swap_request_id: string;
  flight_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}
