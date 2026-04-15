export const CartOrderStatus = Object.freeze({
  // ====================================================
  // CUSTOMER FLOW (C001 – C020)
  // ====================================================
  ADDED_TO_CART: {
    code: 'C001',
    label: 'Added to Cart',
    description: 'Customer added items to cart.',
  },
  CART_UPDATED: {
    code: 'C002',
    label: 'Cart Updated',
    description: 'Customer modified items/quantities.',
  },
  ADDRESS_CONFIRMED: {
    code: 'C003',
    label: 'Address Confirmed',
    description: 'Customer confirmed delivery address.',
  },
  COD_SELECTED: {
    code: 'C004',
    label: 'COD Selected',
    description: 'Customer selected Cash on Delivery.',
  },
  ONLINE_SELECTED: {
    code: 'C005',
    label: 'Online Payment Selected',
    description: 'Customer selected online payment.',
  },
  SCHEDULED_ORDER: {
    code: 'C006',
    label: 'Scheduled Order',
    description: 'Order scheduled for later.',
  },

  PAYMENT_INITIATED: {
    code: 'C007',
    label: 'Payment Initiated',
    description: 'Customer started online payment.',
  },
  PAYMENT_PENDING: {
    code: 'C008',
    label: 'Payment Pending',
    description: 'Waiting for confirmation.',
  },
  PAYMENT_SUCCESS: { code: 'C009', label: 'Payment Successful', description: 'Payment completed.' },
  PAYMENT_FAILED: {
    code: 'C010',
    label: 'Payment Failed',
    description: 'Payment failure occurred.',
  },

  ORDER_CREATED_COD: {
    code: 'C011',
    label: 'Order Created (COD)',
    description: 'Order created using COD.',
  },
  ORDER_CREATED_ONLINE: {
    code: 'C012',
    label: 'Order Created (Online)',
    description: 'Order created after payment.',
  },

  CUSTOMER_INSTRUCTIONS_ADDED: {
    code: 'C013',
    label: 'Instructions Added',
    description: 'Customer added delivery notes.',
  },
  CUSTOMER_RESCHEDULED: {
    code: 'C014',
    label: 'Delivery Rescheduled',
    description: 'Customer rescheduled order.',
  },
  CUSTOMER_MODIFY_REQUESTED: {
    code: 'C015',
    label: 'Modification Requested',
    description: 'Customer requested modification.',
  },
  CUSTOMER_CANCEL_REQUESTED: {
    code: 'C016',
    label: 'Cancel Requested',
    description: 'Customer requested cancellation.',
  },
  CUSTOMER_CONTACTED_SUPPORT: {
    code: 'C017',
    label: 'Contacted Support',
    description: 'Customer contacted support.',
  },
  CUSTOMER_VERIFIED_OTP: {
    code: 'C018',
    label: 'OTP Verified',
    description: 'Customer verified OTP.',
  },
  CUSTOMER_TIP_ADDED: { code: 'C019', label: 'Tip Added', description: 'Customer added a tip.' },
  ORDER_READY_FOR_RESTAURANT: {
    code: 'C020',
    label: 'Forwarded to Restaurant',
    description: 'Order forwarded to kitchen.',
  },

  // ====================================================
  // PAYMENT FLOW (P001 – P020)
  // ====================================================
  PAYMENT_TIMEOUT: { code: 'P001', label: 'Payment Timeout', description: 'Payment timeout.' },
  PAYMENT_3DS_REQUIRED: { code: 'P002', label: '3DS Required', description: '3D secure required.' },
  PAYMENT_3DS_FAILED: {
    code: 'P003',
    label: '3DS Failed',
    description: '3DS authentication failed.',
  },
  PARTIAL_PAYMENT_SUCCESS: {
    code: 'P004',
    label: 'Partial Payment',
    description: 'Partial payment success.',
  },
  WALLET_PAYMENT_APPLIED: { code: 'P005', label: 'Wallet Applied', description: 'Wallet used.' },
  PAYMENT_REFUND_INITIATED: {
    code: 'P006',
    label: 'Refund Initiated',
    description: 'Refund started.',
  },
  PAYMENT_REFUND_IN_PROGRESS: {
    code: 'P007',
    label: 'Refund In Progress',
    description: 'Refund processing.',
  },
  PAYMENT_REFUND_COMPLETED: {
    code: 'P008',
    label: 'Refund Completed',
    description: 'Refund done.',
  },
  PAYMENT_REFUND_FAILED: { code: 'P009', label: 'Refund Failed', description: 'Refund failed.' },
  PARTIAL_REFUND: { code: 'P010', label: 'Partial Refund', description: 'Partial refund issued.' },

  COUPON_APPLIED: { code: 'P011', label: 'Coupon Applied', description: 'Coupon success.' },
  COUPON_INVALID: { code: 'P012', label: 'Coupon Invalid', description: 'Coupon invalid.' },
  PAYMENT_RETRY_REQUIRED: {
    code: 'P013',
    label: 'Payment Retry Needed',
    description: 'Retry needed.',
  },
  PAYMENT_FRAUD_REVIEW: { code: 'P014', label: 'Under Fraud Review', description: 'Fraud check.' },
  PAYMENT_HOLD: { code: 'P015', label: 'Payment On Hold', description: 'Manual hold.' },
  PAYMENT_CAPTURED: { code: 'P016', label: 'Payment Captured', description: 'Captured fully.' },
  TIP_CAPTURED: { code: 'P017', label: 'Tip Captured', description: 'Tip captured.' },
  PROMO_APPLIED: { code: 'P018', label: 'Promo Applied', description: 'Promo discount.' },
  PAYMENT_AUTHORIZED: { code: 'P019', label: 'Payment Authorized', description: 'Authorized.' },
  PAYMENT_REVERSED: { code: 'P020', label: 'Payment Reversed', description: 'Reversed by bank.' },

  // ====================================================
  // RESTAURANT FLOW (R001 – R030)
  // ====================================================
  R_RECEIVED: {
    code: 'R001',
    label: 'Restaurant Received',
    description: 'Restaurant received order.',
  },
  R_ACCEPTED: {
    code: 'R002',
    label: 'Restaurant Accepted',
    description: 'Accepted by restaurant.',
  },
  R_REJECTED: {
    code: 'R003',
    label: 'Restaurant Rejected',
    description: 'Rejected by restaurant.',
  },
  R_ITEM_NOT_AVAILABLE: {
    code: 'R004',
    label: 'Item Not Available',
    description: 'Item unavailable.',
  },
  R_ORDER_PRINTED: { code: 'R005', label: 'Order Printed', description: 'Order printed.' },
  R_ASSIGNED_TO_CHEF: { code: 'R006', label: 'Assigned to Chef', description: 'Chef assigned.' },
  R_PREPARING: { code: 'R007', label: 'Preparing Food', description: 'Food preparing.' },
  R_COOKING_STARTED: { code: 'R008', label: 'Cooking Started', description: 'Cooking started.' },
  R_COOKING_COMPLETED: { code: 'R009', label: 'Cooking Completed', description: 'Cooking done.' },
  R_PACKING_STARTED: { code: 'R010', label: 'Packing Started', description: 'Packing started.' },
  R_PACKING_COMPLETED: { code: 'R011', label: 'Packing Completed', description: 'Packing done.' },
  R_READY_FOR_PICKUP: { code: 'R012', label: 'Ready for Pickup', description: 'Ready for fleet.' },
  R_DELAYED: { code: 'R013', label: 'Restaurant Delayed', description: 'Delayed prep.' },
  R_BUSY: { code: 'R014', label: 'Busy', description: 'Restaurant overloaded.' },
  R_RECOOKING: { code: 'R015', label: 'Re-cooking', description: 'Re-cooking items.' },
  R_QC_DONE: { code: 'R016', label: 'Quality Check Done', description: 'QC completed.' },
  R_HOLD: { code: 'R017', label: 'On Hold', description: 'Restaurant paused order.' },
  R_AUTO_TIMEOUT: { code: 'R018', label: 'Auto Timeout', description: 'Restaurant timeout.' },
  R_MODIFIED_ITEMS: { code: 'R019', label: 'Items Modified', description: 'Items changed.' },
  R_SPECIAL_INSTRUCTIONS: {
    code: 'R020',
    label: 'Special Instructions Added',
    description: 'Notes added.',
  },
  R_READY_DELAYED: { code: 'R021', label: 'Ready but Delayed', description: 'Ready but waiting.' },
  R_CANCELLED_AFTER_ACCEPT: {
    code: 'R022',
    label: 'Cancelled After Accept',
    description: 'Cancelled after acceptance.',
  },
  R_ESCALATED: { code: 'R023', label: 'Restaurant Escalated', description: 'Escalation created.' },
  R_PACKAGING_ISSUE: { code: 'R024', label: 'Packaging Issue', description: 'Packaging problem.' },
  R_INGREDIENT_SHORTAGE: { code: 'R025', label: 'Ingredient Shortage', description: 'Shortage.' },
  R_FLEET_NOT_ARRIVED: {
    code: 'R026',
    label: 'Fleet Not Arrived',
    description: 'Waiting for fleet.',
  },
  R_DUPLICATE_ORDER: { code: 'R027', label: 'Duplicate Order', description: 'Duplicate flagged.' },
  R_PROCESSING_COMPLETE: {
    code: 'R028',
    label: 'Processing Complete',
    description: 'Processing done.',
  },
  R_AWAITING_PICKUP: { code: 'R029', label: 'Awaiting Pickup', description: 'Waiting for pickup.' },
  R_HANDOVER_COMPLETE: {
    code: 'R030',
    label: 'Handover Complete',
    description: 'Handed to fleet.',
  },

  // ====================================================
  // FLEET FLOW (F001 – F030)
  // ====================================================
  F_ASSIGNED: { code: 'F001', label: 'Fleet Assigned', description: 'Fleet assigned.' },
  F_ACCEPTED: { code: 'F002', label: 'Fleet Accepted', description: 'Fleet accepted.' },
  F_REJECTED: { code: 'F003', label: 'Fleet Rejected', description: 'Rejected assignment.' },
  F_NAVIGATING_TO_RESTAURANT: {
    code: 'F004',
    label: 'Navigating to Restaurant',
    description: 'Fleet en route.',
  },
  F_ARRIVED_AT_RESTAURANT: {
    code: 'F005',
    label: 'Arrived at Restaurant',
    description: 'Fleet arrived.',
  },
  F_WAITING_FOR_ORDER: {
    code: 'F006',
    label: 'Waiting for Order',
    description: 'Waiting at restaurant.',
  },
  F_PICKED_UP: { code: 'F007', label: 'Picked Up', description: 'Order picked.' },
  F_PICKUP_DELAYED: { code: 'F008', label: 'Pickup Delayed', description: 'Pickup delayed.' },
  F_ON_THE_WAY: { code: 'F009', label: 'On the Way', description: 'Delivering.' },
  F_TRAFFIC_DELAY: { code: 'F010', label: 'Traffic Delay', description: 'Traffic issues.' },
  F_ARRIVED_LOCATION: {
    code: 'F011',
    label: 'Arrived at Location',
    description: 'Reached customer area.',
  },
  F_CALLING_CUSTOMER: { code: 'F012', label: 'Calling Customer', description: 'Calling customer.' },
  F_CUSTOMER_UNREACHABLE: {
    code: 'F013',
    label: 'Unreachable',
    description: 'Customer unreachable.',
  },
  F_WRONG_LOCATION: {
    code: 'F014',
    label: 'Wrong Location',
    description: 'Wrong location reached.',
  },
  F_OTP_REQUIRED: { code: 'F015', label: 'OTP Required', description: 'OTP needed.' },
  F_ISSUE_REPORTED: { code: 'F016', label: 'Issue Reported', description: 'Issue reported.' },
  F_VEHICLE_BREAKDOWN: { code: 'F017', label: 'Vehicle Breakdown', description: 'Bike breakdown.' },
  F_REASSIGNMENT_NEEDED: {
    code: 'F018',
    label: 'Reassignment Needed',
    description: 'New rider required.',
  },
  F_REASSIGNED: { code: 'F019', label: 'Reassigned', description: 'Rider changed.' },
  F_CANCELLED_BY_FLEET: {
    code: 'F020',
    label: 'Cancelled by Fleet',
    description: 'Fleet cancelled.',
  },
  F_WAITING_AT_GATE: { code: 'F021', label: 'Waiting at Gate', description: 'Waiting at gate.' },
  F_ENTERED_BUILDING: {
    code: 'F022',
    label: 'Entered Building',
    description: 'Entered inside building.',
  },
  F_NEAR_LOCATION: { code: 'F023', label: 'Near Location', description: 'Near delivery spot.' },
  F_HANDOVER_COMPLETE: {
    code: 'F024',
    label: 'Handover Complete',
    description: 'Delivered to customer.',
  },
  F_RETURNING_ORDER: { code: 'F025', label: 'Returning Order', description: 'Returning order.' },
  F_LOW_BATTERY: { code: 'F026', label: 'Low Battery', description: 'Low EV battery.' },
  F_SAFETY_HALT: { code: 'F027', label: 'Safety Halt', description: 'Safety halt.' },
  F_FALLBACK_PARTNER: {
    code: 'F028',
    label: 'Fallback Rider Assigned',
    description: 'Backup rider.',
  },
  F_CONTACTLESS_REQUESTED: {
    code: 'F029',
    label: 'Contactless Requested',
    description: 'Contactless delivery.',
  },
  F_COMPLETION_CONFIRMED: {
    code: 'F030',
    label: 'Completion Confirmed',
    description: 'Rider confirmed.',
  },

  // ====================================================
  // DELIVERY COMPLETION (D001 – D020)
  // ====================================================
  DELIVERED: { code: 'D001', label: 'Delivered', description: 'Delivered successfully.' },
  DELIVERED_CONTACTLESS: {
    code: 'D002',
    label: 'Delivered Contactless',
    description: 'Left at door.',
  },
  DELIVERED_TO_SECURITY: {
    code: 'D003',
    label: 'Delivered to Security',
    description: 'Security received.',
  },
  DELIVERED_TO_NEIGHBOR: {
    code: 'D004',
    label: 'Delivered to Neighbor',
    description: 'Given to neighbour.',
  },
  DELIVERY_PHOTO_TAKEN: {
    code: 'D005',
    label: 'Photo Taken',
    description: 'Proof photo captured.',
  },
  DELIVERY_FAILED: { code: 'D006', label: 'Delivery Failed', description: 'Delivery failed.' },
  CUSTOMER_NOT_AVAILABLE: {
    code: 'D007',
    label: 'Customer Not Available',
    description: 'Customer absent.',
  },
  DELIVERY_ATTEMPTED: { code: 'D008', label: 'Attempted Delivery', description: 'Attempt made.' },
  DELIVERY_REATTEMPT_SCHEDULED: {
    code: 'D009',
    label: 'Reattempt Scheduled',
    description: 'Will retry.',
  },
  RETURNED_TO_RESTAURANT: {
    code: 'D010',
    label: 'Returned to Restaurant',
    description: 'Returned.',
  },
  RETURN_IN_PROGRESS: { code: 'D011', label: 'Return In Progress', description: 'Returning.' },
  DELIVERY_ESCALATED: {
    code: 'D012',
    label: 'Delivery Escalated',
    description: 'Issue escalated.',
  },
  DELIVERY_CLOSED: { code: 'D013', label: 'Delivery Closed', description: 'Delivery closure.' },
  PROOF_VERIFIED: { code: 'D014', label: 'Proof Verified', description: 'Proof verified.' },
  CUSTOMER_PICKED_FROM_STORE: {
    code: 'D015',
    label: 'Customer Picked Up',
    description: 'Customer pickup.',
  },
  DROP_SAFE_LOCATION: {
    code: 'D016',
    label: 'Dropped at Safe Location',
    description: 'Safe place drop.',
  },
  DELIVERY_FINALIZED: { code: 'D017', label: 'Delivery Finalized', description: 'Finalized.' },
  DELIVERY_CLEANUP: { code: 'D018', label: 'Cleanup Completed', description: 'Cleanup done.' },
  DELIVERY_COMPLETION_LOGGED: { code: 'D019', label: 'Completion Logged', description: 'Logged.' },
  DELIVERY_MANUAL_OVERRIDE: {
    code: 'D020',
    label: 'Manual Override',
    description: 'Manual override.',
  },

  // ====================================================
  // CANCELLATION & REFUND (X001 – X020)
  // ====================================================
  CANCELLED_BY_CUSTOMER: {
    code: 'X001',
    label: 'Cancelled by Customer',
    description: 'Customer cancellation.',
  },
  CANCELLED_BY_RESTAURANT: {
    code: 'X002',
    label: 'Cancelled by Restaurant',
    description: 'Restaurant cancelled.',
  },
  CANCELLED_NO_STOCK: { code: 'X003', label: 'No Stock', description: 'No stock available.' },
  CANCELLED_DELAY: {
    code: 'X004',
    label: 'Delay Cancellation',
    description: 'Cancelled due to delay.',
  },
  CANCELLED_NO_FLEET: { code: 'X005', label: 'No Fleet', description: 'No fleet available.' },
  CANCELLED_FRAUD: { code: 'X006', label: 'Fraud Cancelled', description: 'Fraudulent order.' },
  CANCELLED_PAYMENT_TIMEOUT: {
    code: 'X007',
    label: 'Payment Timeout',
    description: 'Payment timeout.',
  },
  CANCELLED_BY_FLEET: {
    code: 'X008',
    label: 'Cancelled by Fleet',
    description: 'Fleet cancelled.',
  },
  CANCELLED_SYSTEM: {
    code: 'X009',
    label: 'System Cancelled',
    description: 'System auto cancelled.',
  },
  CANCELLED_INVALID_ADDRESS: {
    code: 'X010',
    label: 'Invalid Address',
    description: 'Invalid address.',
  },
  CANCELLED_OUT_OF_RANGE: {
    code: 'X011',
    label: 'Out of Range',
    description: 'Delivery out of range.',
  },
  CANCELLED_AFTER_ACCEPT: {
    code: 'X012',
    label: 'Cancelled After Accept',
    description: 'Post accept cancel.',
  },
  REFUND_INITIATED: { code: 'X013', label: 'Refund Initiated', description: 'Refund started.' },
  REFUND_IN_PROGRESS: {
    code: 'X014',
    label: 'Refund In Progress',
    description: 'Refund processing.',
  },
  REFUND_COMPLETED: { code: 'X015', label: 'Refund Completed', description: 'Refund done.' },
  REFUND_FAILED: { code: 'X016', label: 'Refund Failed', description: 'Refund failure.' },
  PARTIAL_REFUND_ISSUED: {
    code: 'X017',
    label: 'Partial Refund',
    description: 'Partial refund issued.',
  },
  REFUND_HOLD: { code: 'X018', label: 'Refund Hold', description: 'Refund on hold.' },
  COMPENSATION_ISSUED: {
    code: 'X019',
    label: 'Compensation Issued',
    description: 'Compensation provided.',
  },
  CREDIT_ISSUED: { code: 'X020', label: 'Credit Issued', description: 'Store credit issued.' },

  // ====================================================
  // SYSTEM / OPS (S001 – S020)
  // ====================================================
  SLA_BREACHED: { code: 'S001', label: 'SLA Breached', description: 'SLA exceeded.' },
  SLA_EXTENDED: { code: 'S002', label: 'SLA Extended', description: 'SLA extended.' },
  SYSTEM_ESCALATION: {
    code: 'S003',
    label: 'System Escalation',
    description: 'System raised escalation.',
  },
  MANUAL_ESCALATION: {
    code: 'S004',
    label: 'Manual Escalation',
    description: 'Support escalation.',
  },
  ORDER_UNDER_AUDIT: { code: 'S005', label: 'Under Audit', description: 'Audit in progress.' },
  ETA_UPDATED: { code: 'S006', label: 'ETA Updated', description: 'ETA updated.' },
  LOCATION_VERIFIED: {
    code: 'S007',
    label: 'Location Verified',
    description: 'Location verified.',
  },
  LOCATION_ERROR: { code: 'S008', label: 'Location Error', description: 'Location invalid.' },
  ORDER_SYNCED: { code: 'S009', label: 'Order Synced', description: 'Order synced externally.' },
  WEBHOOK_SENT: { code: 'S010', label: 'Webhook Sent', description: 'Webhook sent.' },
  WEBHOOK_FAILED: { code: 'S011', label: 'Webhook Failed', description: 'Webhook failed.' },
  ORDER_ARCHIVED: { code: 'S012', label: 'Order Archived', description: 'Order archived.' },
  ORDER_DELETED: { code: 'S013', label: 'Order Deleted', description: 'Order deleted.' },
  SYSTEM_RETRY: { code: 'S014', label: 'System Retry', description: 'Retry triggered.' },
  QUEUE_DELAYED: { code: 'S015', label: 'Queue Delayed', description: 'Queue delay.' },
  DUPLICATE_ORDER_FLAGGED: {
    code: 'S016',
    label: 'Duplicate Order',
    description: 'Duplicate flagged.',
  },
  MERCHANT_SYNC_ERROR: { code: 'S017', label: 'Merchant Sync Error', description: 'Sync error.' },
  // eslint-disable-next-line prettier/prettier
  ML_PREDICTION_UPDATED: {
    code: 'S018',
    label: 'ML Prediction Updated',
    description: 'ML ETA updated.',
  },
  TELEMETRY_RECORDED: {
    code: 'S019',
    label: 'Telemetry Recorded',
    description: 'Telemetry logged.',
  },
  ORDER_FLOW_COMPLETE: {
    code: 'S020',
    label: 'Order Flow Complete',
    description: 'Flow completed.',
  },
});

export type CartStatusType = (typeof CartOrderStatus)[keyof typeof CartOrderStatus];

export const StatusCodeToLabel = Object.fromEntries(
  Object.values(CartOrderStatus).map((v) => [v.code, v.label]),
);
