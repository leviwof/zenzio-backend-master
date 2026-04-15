export interface NearestActiveRestaurantResult {
  restaurant_uid: string;
  restaurant_id: number;
  rating_avg?: number;
  distance: number;

  profile: {
    restaurant_name: string | null;
    contact_person: string | null;
    contact_number: string | null;
    avg_cost_for_two: string | null;
    photo: string[];
    packing_charge: number;
  };

  address: {
    city: string | null;
    state: string | null;
    pincode: string | null;
    address: string | null;
    land_mark: string | null;
    lat: number;
    lng: number;
  };

  bank_details: {
    bank_name: string | null;
    account_number: string | null;
    ifsc_code: string | null;
    account_type: string | null;
  };

  documents: {
    fssai_number: string | null;
    file_fssai: string[];
    gst_number: string | null;
    file_gst: string[];
    trade_license_number: string | null;
    file_trade_license: string[];
    otherDocumentType: string | null;
    file_other_doc: string[];
  };

  operational_hours: {
    day: string;
    enabled: boolean;
    from: string;
    to: string;
  }[];
}
