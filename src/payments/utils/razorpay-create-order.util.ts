import { Repository } from 'typeorm';
import { CartGroup } from '../../cart/entity/cart-group.entity';
import { CartOrderStatus, StatusCodeToLabel } from '../../constants/status.constants';

// ----------------------------------------------
// BUILD RAZORPAY ORDER PAYLOAD
// ----------------------------------------------
export function buildRazorpayPayload(amount: number, restaurantUid: string, groupUid: string) {
  const receipt = `${restaurantUid}_${groupUid}`;

  const notes: Record<string, string> = {
    purpose: 'Food Delivery Order',
    restaurant_uid: restaurantUid,
    group_uid: groupUid,
  };

  const payload = {
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt,
    notes,
  };

  return { payload, receipt };
}

// ----------------------------------------------
// UPDATE GROUP → PAYMENT INITIATED (6)
// ----------------------------------------------
export async function updateGroupPaymentInitiated(
  groupUid: string,
  groupRepo: Repository<CartGroup>,
) {
  const group = await groupRepo.findOneBy({ cart_group_uid: groupUid });

  if (!group) throw new Error('Cart Group Not Found');

  const code = CartOrderStatus.PAYMENT_INITIATED.code;

  group.status = code;
  group.status_flag = StatusCodeToLabel[code];

  await groupRepo.save(group);
}

// ----------------------------------------------
// SAVE RAZORPAY ORDER ID IN GROUP
// ----------------------------------------------
export async function saveRazorpayOrderId(
  groupUid: string,
  orderId: string,
  groupRepo: Repository<CartGroup>,
) {
  const group = await groupRepo.findOneBy({ cart_group_uid: groupUid });

  if (!group) throw new Error('Cart Group Not Found');

  group.raz_ord_id = orderId;

  await groupRepo.save(group);
}
