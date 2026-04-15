export interface NearestMenuResult {
  restaurant_uid: string;
  restaurant_id: number;
  restaurant_name: string;
  lat: number;
  lng: number;
  distance: number;

  id: number;
  menu_name: string;
  category: string | null;
  description: string | null;
  price: number;
  food_type: string | null;
  cuisine_type: string | null;
  contain_allergence: boolean;
  specify_allergence: string | null;
  customized_option: any[] | null;
  size_option: any[] | null;
  topping: any[] | null;
  size: string | null;
  qty: number;
  images: any[] | null;
  discount: number;
  rating: number;
  orderedCount: number;
  isActive: boolean;

  updatedAt: string | Date | null;
  createdAt: string | Date | null;
  deletedAt: string | Date | null;
}
