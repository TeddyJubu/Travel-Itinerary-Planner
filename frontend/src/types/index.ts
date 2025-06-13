export interface Itinerary {
  id: number;
  destination: string;
  days: number;
  result: string;
  created_at: string;
}

export interface ItineraryRequest {
  destination: string;
  days: number;
  user_email: string;
} 