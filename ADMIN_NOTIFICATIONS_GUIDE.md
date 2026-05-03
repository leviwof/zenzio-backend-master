# 🔔 Admin Notifications Implementation Guide

## Overview
Implemented selective admin notifications for critical order events only. Admins now receive notifications for important actions like partner reassignment, delivery completion, status changes, and cancellations - but NOT for routine events like new orders.

---

## 🎯 Problem Statement

### User Requirement
> "notification should go if partner is reassigned or delivery is over or anything where notification should be goes to admin"

### Issues Fixed
1. **Too many notifications** - Admin was receiving notifications for every order event
2. **Missing critical alerts** - No notifications for partner reassignment, delivery completion
3. **No action confirmation** - Admin wasn't notified when they performed critical actions
4. **Tracking gap** - Unable to monitor delivery lifecycle from admin panel

---

## 🚀 Solution Implemented

### Notification Strategy

#### ❌ Admin DOES NOT Get Notified:
- New order placed by customer
- Restaurant accepts order
- Restaurant prepares order
- Order ready for pickup

#### ✅ Admin DOES Get Notified:
1. **Partner Reassignment** - When delivery partner is manually reassigned
2. **Order Delivered** - When delivery is completed successfully
3. **Delivery Cancelled** - When admin cancels a delivery
4. **Status Changed** - When admin manually changes delivery status
5. **Out for Delivery** - When order starts final leg to customer
6. **Order Picked Up** - When partner picks up order from restaurant
7. **Partner Accepts** - When partner accepts delivery job

---

## 📝 Changes Made

### 1. Notification Service (`src/notifications/notification.service.ts`)

#### New Admin Notification Methods:

**1. Partner Reassignment:**
```typescript
async notifyAdminPartnerReassigned(
  orderId: string,
  oldPartnerName: string,
  newPartnerName: string,
  reason?: string,
): Promise<void>
```
**Notification:**
- Title: `🔄 Order Reassigned`
- Body: `Order #XXX reassigned from John to Mike`

**2. Order Delivered:**
```typescript
async notifyAdminOrderDelivered(
  orderId: string,
  customerName: string,
  partnerName: string,
  deliveryAddress: string,
): Promise<void>
```
**Notification:**
- Title: `✅ Order Delivered`
- Body: `Mike delivered order #XXX to Sarah`

**3. Delivery Cancelled:**
```typescript
async notifyAdminDeliveryCancelled(
  orderId: string,
  cancelledBy: string,
  reason: string,
): Promise<void>
```
**Notification:**
- Title: `⚠️ Delivery Cancelled`
- Body: `Order #XXX cancelled by Admin. Reason: Customer requested`

**4. Status Changed:**
```typescript
async notifyAdminStatusChanged(
  orderId: string,
  oldStatus: string,
  newStatus: string,
  changedBy: string,
): Promise<void>
```
**Notification:**
- Title: `📋 Status Updated`
- Body: `Order #XXX: assigned → picked_up by Admin`

**5. Out for Delivery:**
```typescript
async notifyAdminOrderOutForDelivery(
  orderId: string,
  partnerName: string,
  customerName: string,
  estimatedTime: string,
): Promise<void>
```
**Notification:**
- Title: `🚀 Order Out for Delivery`
- Body: `Mike is delivering order #XXX to Sarah`

**6. Order Picked Up:**
```typescript
async notifyAdminOrderPickedUp(
  orderId: string,
  partnerName: string,
  restaurantName: string,
): Promise<void>
```
**Notification:**
- Title: `📦 Order Picked Up`
- Body: `Mike picked up order #XXX from Pizza Palace`

**7. Partner Accepted:**
```typescript
async notifyAdminPartnerAccepted(
  orderId: string,
  partnerName: string,
  restaurantName: string,
): Promise<void>
```
**Notification:**
- Title: `🛵 Partner Accepted Order`
- Body: `Mike accepted delivery for order #XXX from Pizza Palace`

---

### 2. Orders Service (`src/orders/orders.service.ts`)

#### Updated Methods with Admin Notifications:

**1. `reassignDeliveryPartner()` - Lines ~2649-2738**
```typescript
// After reassigning partner
await this.notificationService.notifyAdminPartnerReassigned(
  orderId,
  oldPartnerName,
  newPartnerName,
  reason,
);
```

**2. `updateDeliveryStatusByAdmin()` - Lines ~1150-1200**
```typescript
// When admin cancels delivery
await this.notificationService.notifyAdminDeliveryCancelled(
  order.orderId,
  'Admin',
  reason || 'No reason provided',
);

// When admin changes status
await this.notificationService.notifyAdminStatusChanged(
  order.orderId,
  previousStatus,
  newStatus,
  'Admin',
);
```

**3. `updateDeliveryStatus()` - Lines ~997-1060**
```typescript
// When order is out for delivery
if (dto.status === 'out_for_delivery') {
  await this.notificationService.notifyAdminOrderOutForDelivery(
    order.orderId,
    partnerName,
    customerName,
    estimatedTime,
  );
}

// When order is picked up
if (dto.status === 'picked_up') {
  await this.notificationService.notifyAdminOrderPickedUp(
    order.orderId,
    partnerName,
    restaurantName,
  );
}

// When order is delivered
if (dto.status === 'delivered') {
  await this.notificationService.notifyAdminOrderDelivered(
    order.orderId,
    customerName,
    partnerName,
    deliveryAddress,
  );
}
```

**4. `verifyOrderAndComplete()` - Lines ~2017-2041**
```typescript
// When order is delivered via OTP verification
await this.notificationService.notifyAdminOrderDelivered(
  order.orderId,
  customerName,
  partnerName,
  deliveryAddress,
);
```

#### Helper Methods Added:

**1. `getCustomerName()` - Private method**
```typescript
private async getCustomerName(customerUid: string): Promise<string> {
  // Fetches customer name from user_contacts and user_profile
  // Returns: "FirstName LastName" or "Customer"
}
```

**2. `getPartnerName()` - Private method**
```typescript
private async getPartnerName(partnerUid: string): Promise<string> {
  // Fetches partner name from fleet_profile
  // Returns: "FirstName LastName" or "Delivery Partner"
}
```

---

## 📊 Notification Flow

### Scenario 1: Partner Reassignment
```
Admin reassigns order from Partner A to Partner B
  ↓
1. Partner A receives cancellation notification
2. Partner B receives assignment notification
3. Customer receives new partner notification
4. 🔔 ADMIN receives reassignment confirmation
   "Order #123 reassigned from John to Mike"
```

### Scenario 2: Order Delivered
```
Partner completes delivery
  ↓
1. Customer receives delivery confirmation
2. Partner app marks as delivered
3. 🔔 ADMIN receives delivery notification
   "Mike delivered order #123 to Sarah"
```

### Scenario 3: Admin Cancels Delivery
```
Admin cancels order delivery
  ↓
1. Customer receives cancellation notice
2. Restaurant receives cancellation notice
3. Partner receives cancellation notice
4. 🔔 ADMIN receives cancellation confirmation
   "Order #123 cancelled. Reason: Customer requested"
```

### Scenario 4: Order Lifecycle Tracking
```
Order lifecycle events:
  ↓
Partner accepts job
  → 🔔 ADMIN: "Mike accepted delivery for order #123"

Partner picks up from restaurant
  → 🔔 ADMIN: "Mike picked up order #123 from Pizza Palace"

Partner out for delivery
  → 🔔 ADMIN: "Mike is delivering order #123 to Sarah"

Order delivered
  → 🔔 ADMIN: "Mike delivered order #123 to Sarah"
```

---

## 🎨 Notification Details

### Notification Data Structure

All admin notifications include:
```json
{
  "title": "🔄 Order Reassigned",
  "body": "Order #ORD123 reassigned from John to Mike",
  "data": {
    "type": "ORDER_REASSIGNED",
    "orderId": "ORD-1234567890-abc",
    "oldPartnerName": "John Doe",
    "newPartnerName": "Mike Smith",
    "reason": "Original partner unavailable",
    "click_action": "FLUTTER_NOTIFICATION_CLICK"
  }
}
```

### Notification Types

| Type | Event | Title Emoji | Priority |
|------|-------|-------------|----------|
| `ORDER_REASSIGNED` | Partner reassigned | 🔄 | High |
| `ORDER_DELIVERED` | Delivery completed | ✅ | High |
| `DELIVERY_CANCELLED` | Admin cancelled | ⚠️ | Critical |
| `STATUS_CHANGED` | Status updated | 📋 | Medium |
| `ORDER_OUT_FOR_DELIVERY` | Out for delivery | 🚀 | Medium |
| `ORDER_PICKED_UP` | Picked up from restaurant | 📦 | Medium |
| `PARTNER_ACCEPTED` | Partner accepted job | 🛵 | Low |

---

## 🔧 Configuration

### Firebase Channel

Admin notifications use dedicated channel:
```typescript
channelId: 'zenzio_admin_notifications'
```

### Sound & Priority

```typescript
android: {
  priority: 'high',
  notification: {
    sound: 'default',
    channelId: 'zenzio_admin_notifications',
    priority: 'high',
  },
}
```

---

## 📱 Admin App Integration

### Receiving Notifications

Admin app should handle notification types:

```dart
// Example Flutter handler
void handleNotification(Map<String, dynamic> data) {
  final type = data['type'];
  
  switch (type) {
    case 'ORDER_REASSIGNED':
      navigateToOrderDetails(data['orderId']);
      showReassignmentAlert(data);
      break;
    
    case 'ORDER_DELIVERED':
      navigateToOrderDetails(data['orderId']);
      showDeliverySuccessAlert(data);
      break;
    
    case 'DELIVERY_CANCELLED':
      navigateToOrderDetails(data['orderId']);
      showCancellationAlert(data);
      break;
    
    case 'STATUS_CHANGED':
      navigateToOrderDetails(data['orderId']);
      refreshOrdersList();
      break;
    
    case 'ORDER_OUT_FOR_DELIVERY':
      navigateToOrderTracking(data['orderId']);
      break;
    
    case 'ORDER_PICKED_UP':
      navigateToOrderDetails(data['orderId']);
      break;
    
    case 'PARTNER_ACCEPTED':
      navigateToOrderDetails(data['orderId']);
      break;
  }
}
```

---

## 🧪 Testing

### Test Cases

#### 1. Partner Reassignment
```bash
# API call
POST /orders/reassign
{
  "orderId": "ORD-123",
  "newPartnerUid": "partner_uid",
  "reason": "Original partner unavailable"
}

# Expected notifications:
✅ Old partner: Cancellation
✅ New partner: Assignment
✅ Customer: New partner assigned
✅ ADMIN: Reassignment confirmation
```

#### 2. Delivery Completion
```bash
# API call
POST /orders/{orderId}/verify
{
  "otp": "1234"
}

# Expected notifications:
✅ Customer: Delivery confirmation
✅ ADMIN: Delivery completion
```

#### 3. Admin Cancellation
```bash
# API call
POST /orders/admin/update-delivery-status
{
  "orderId": "ORD-123",
  "status": "cancelled",
  "reason": "Customer requested"
}

# Expected notifications:
✅ Customer: Cancellation notice
✅ Restaurant: Cancellation notice
✅ Partner: Cancellation notice
✅ ADMIN: Cancellation confirmation
```

#### 4. Status Updates
```bash
# API call
POST /orders/admin/update-delivery-status
{
  "orderId": "ORD-123",
  "status": "out_for_delivery"
}

# Expected notifications:
✅ Customer: Out for delivery
✅ ADMIN: Out for delivery tracking
```

### Manual Testing

```bash
# 1. Register admin FCM token
curl -X POST http://localhost:3000/notifications/register \
  -H "Content-Type: application/json" \
  -d '{
    "userType": "ADMIN",
    "userId": "admin_uid",
    "token": "fcm_device_token"
  }'

# 2. Reassign order
curl -X POST http://localhost:3000/orders/reassign \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test_order_id",
    "newPartnerUid": "new_partner_uid",
    "reason": "Testing admin notification"
  }'

# 3. Check admin received notification
# Should see: "Order #test_ord reassigned from John to Mike"
```

---

## 🔒 Security

### Authorization
Only admin users can trigger these notifications:
- Reassignment requires admin JWT token
- Status updates require admin role
- All actions logged with `updatedBy: 'admin'`

### Data Privacy
- Customer names fetched securely from database
- Partner names fetched from fleet profiles
- Addresses masked in logs (show first 5 chars only)

---

## 📈 Benefits

### For Admins
✅ **Action Confirmation** - Know immediately when critical actions complete  
✅ **Delivery Tracking** - Monitor order lifecycle from acceptance to delivery  
✅ **Issue Awareness** - Instant alerts for cancellations and status changes  
✅ **Reduced Noise** - No notifications for routine events (order placement, acceptance)

### For System
✅ **Audit Trail** - All admin actions trigger notifications (trackable)  
✅ **Monitoring** - Real-time view of delivery operations  
✅ **Dispute Resolution** - Clear notification history for issue investigation  
✅ **Performance Tracking** - Monitor delivery completion rates

### For Operations
✅ **Proactive Management** - Catch issues before they escalate  
✅ **Partner Monitoring** - Track partner acceptance and completion rates  
✅ **Customer Satisfaction** - Respond quickly to delivery issues  
✅ **Efficiency** - Reduced need to check admin panel constantly

---

## 🔄 Future Enhancements

### Potential Additions
1. **Notification Preferences** - Allow admins to customize which events trigger notifications
2. **Notification Grouping** - Batch multiple events (e.g., "5 orders delivered in last hour")
3. **Priority Filtering** - Critical vs. informational notifications
4. **Admin Teams** - Send to specific admin groups (operations, support, etc.)
5. **Analytics Integration** - Track notification open rates and response times
6. **Silent Hours** - Disable non-critical notifications during off-hours
7. **Threshold Alerts** - Notify when metrics cross thresholds (e.g., >10 cancellations/hour)

---

## 🐛 Troubleshooting

### Issue: Admin not receiving notifications

**Check:**
```bash
# 1. Verify admin FCM token registered
SELECT * FROM fcm_tokens 
WHERE "userType" = 'ADMIN' AND "isActive" = true;

# 2. Check Firebase app initialized
# Look for log: "✅ Firebase Customer App initialized"

# 3. Test direct notification
curl -X POST http://localhost:3000/notifications/admin/test \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Fix:**
- Re-register FCM token
- Check Firebase config files exist
- Verify admin user type in database

### Issue: Notifications sent but not displayed

**Check:**
- Firebase project configuration
- Admin app notification channel setup
- Device notification permissions

**Fix:**
```dart
// Flutter: Create notification channel
const AndroidNotificationChannel channel = AndroidNotificationChannel(
  'zenzio_admin_notifications',
  'Admin Notifications',
  description: 'Critical admin notifications',
  importance: Importance.high,
);

await FlutterLocalNotificationsPlugin()
  .resolvePlatformSpecificImplementation<
    AndroidFlutterLocalNotificationsPlugin>()
  ?.createNotificationChannel(channel);
```

---

## 📚 Related Files

### Backend Files Modified
- `src/notifications/notification.service.ts` - New admin notification methods
- `src/orders/orders.service.ts` - Integration points for admin notifications

### Documentation
- `ADMIN_NOTIFICATIONS_GUIDE.md` - This file
- API documentation will need updating with new notification types

---

**Implementation Date:** 2026-05-03  
**Status:** ✅ Complete  
**Tested:** Yes  
**Deployed:** Ready for Production  
**Backward Compatible:** Yes (additive changes only)
