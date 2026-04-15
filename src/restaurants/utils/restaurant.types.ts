export interface NearestActiveRestaurantResult {
  restaurant_uid: string;
  restaurant_id: number;
  isDiningEnabled?: boolean;
  isGstRegistered: boolean;
  restaurant_name: string | null;
  lat: number;
  lng: number;
  distance: number;
  avg_cost_two: string | null;
  rest_address: string | null;
  rest_logo: string | null;
  food_type: string | null;
  rating_avg: number;
  current_offers?: any[];

  profile: {
    restaurant_name: string | null;
    contact_person: string | null;
    contact_number: string | null;
    photo: string[];
    avg_cost_for_two?: string | null;
    food_type?: string | null;
    contact_email?: string | null;
    packing_charge: number;
  };
}
