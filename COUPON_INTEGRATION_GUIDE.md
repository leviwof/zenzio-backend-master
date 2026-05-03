# 🎟️ Coupon Integration Guide for Flutter/Dart Developers

## Overview
This guide explains how to properly integrate coupon validation and application in your Flutter app with the Zenzio backend.

---

## 🔍 **Issue: "This coupon has expired or is inactive"**

### Root Causes:
1. **Date/Time Mismatch**: UTC vs Local timezone issues
2. **Status Not Set**: Coupon status is not "Active"
3. **Missing Parameters**: orderAmount not provided when required
4. **Wrong API Calls**: Using incorrect endpoints or parameters

---

## 📋 **Backend API Endpoints**

### 1. **Get Available Coupons for User**
```
GET /coupons?user_uid={user_uid}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "code": "WELCOME50",
    "name": "Welcome Discount",
    "description": "50% off on first order",
    "discountType": "percentage",  // or "fixed"
    "discountValue": 50,           // 50% or ₹50
    "minOrderValue": 100,
    "maxDiscountCap": 200,
    "usageLimit": 1000,
    "usageLimitPerUser": 1,
    "startDate": "2026-05-01",
    "endDate": "2026-12-31",
    "status": "Active",            // ✅ Must be "Active"
    "targetAudience": "new",       // "all" or "new"
    "currentUserUsage": 0,
    "isUserEligible": true,
    "isValidForUser": true
  }
]
```

---

### 2. **Validate Coupon Before Applying**
```
GET /coupons/validate?code={coupon_code}&user_uid={user_uid}&orderAmount={amount}
```

**Example:**
```
GET /coupons/validate?code=WELCOME50&user_uid=user-123&orderAmount=500
```

**Success Response:**
```json
{
  "isValidForUser": true,
  "reason": null,
  "message": "Coupon applied successfully",
  "status": "Active",
  "endDate": "2026-12-31T23:59:59.999Z",
  "discountAmount": 200,         // Calculated discount
  "finalAmount": 300             // After discount
}
```

**Error Response:**
```json
{
  "isValidForUser": false,
  "reason": "EXPIRED",           // or "INACTIVE", "MIN_ORDER_NOT_MET", etc.
  "message": "Coupon expired on 2026-05-01",
  "status": "Inactive",
  "endDate": "2026-05-01T23:59:59.999Z"
}
```

**Possible `reason` values:**
- `EXPIRED` - Coupon has expired
- `INACTIVE` - Coupon status is not Active
- `MIN_ORDER_NOT_MET` - Order amount is below minimum
- `USER_LIMIT_REACHED` - User has used this coupon max times
- `LIMIT_REACHED` - Global usage limit reached
- `NOT_ELIGIBLE` - User is not eligible (e.g., not a new user)
- `NOT_YET_ACTIVE` - Coupon start date hasn't arrived

---

### 3. **Apply Coupon During Checkout**
```
POST /cart/payment-mode
```

**Request Body:**
```json
{
  "group_uid": "cart-group-uuid",
  "pay_mode": "ONLINE",          // or "COD"
  "item_total": 500,
  "delivery_fee": 30,
  "taxes": 25,
  "price": 555,
  "coupon_code": "WELCOME50",     // ✅ Include coupon code
  "coupon_discount": 200,         // ✅ Calculated discount
  "delivery_address": "123 Main St",
  "distance_km": 5.5,
  "restaurant_lat": 11.9416,
  "restaurant_lng": 79.8083,
  "customer_lat": 11.9500,
  "customer_lng": 79.8100
}
```

**Important**: Backend will validate the coupon again server-side.

---

## 🛠️ **Flutter/Dart Implementation**

### **1. Fetch Available Coupons**

```dart
class CouponService {
  final String baseUrl = 'https://your-api.com';
  
  Future<List<Coupon>> getAvailableCoupons(String userUid) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/coupons?user_uid=$userUid'),
        headers: {
          'Authorization': 'Bearer ${getAccessToken()}',
        },
      );

      if (response.statusCode == 200) {
        List<dynamic> data = json.decode(response.body);
        return data
            .where((c) => c['isValidForUser'] == true)
            .map((c) => Coupon.fromJson(c))
            .toList();
      } else {
        throw Exception('Failed to load coupons');
      }
    } catch (e) {
      print('Error fetching coupons: $e');
      return [];
    }
  }
}
```

---

### **2. Validate Coupon Before Applying**

```dart
class CouponValidationResult {
  final bool isValid;
  final String message;
  final String? reason;
  final double? discountAmount;
  final double? finalAmount;

  CouponValidationResult({
    required this.isValid,
    required this.message,
    this.reason,
    this.discountAmount,
    this.finalAmount,
  });

  factory CouponValidationResult.fromJson(Map<String, dynamic> json) {
    return CouponValidationResult(
      isValid: json['isValidForUser'] ?? false,
      message: json['message'] ?? '',
      reason: json['reason'],
      discountAmount: json['discountAmount']?.toDouble(),
      finalAmount: json['finalAmount']?.toDouble(),
    );
  }
}

Future<CouponValidationResult> validateCoupon({
  required String couponCode,
  required String userUid,
  required double orderAmount,
}) async {
  try {
    final uri = Uri.parse('$baseUrl/coupons/validate').replace(queryParameters: {
      'code': couponCode,
      'user_uid': userUid,
      'orderAmount': orderAmount.toString(),
    });

    print('🎟️ Validating coupon: $couponCode for amount: ₹$orderAmount');

    final response = await http.get(
      uri,
      headers: {
        'Authorization': 'Bearer ${getAccessToken()}',
      },
    );

    if (response.statusCode == 200) {
      final result = CouponValidationResult.fromJson(json.decode(response.body));
      
      if (result.isValid) {
        print('✅ Coupon valid! Discount: ₹${result.discountAmount}');
      } else {
        print('❌ Coupon invalid: ${result.message} (${result.reason})');
      }
      
      return result;
    } else {
      throw Exception('Failed to validate coupon');
    }
  } catch (e) {
    print('Error validating coupon: $e');
    return CouponValidationResult(
      isValid: false,
      message: 'Failed to validate coupon: $e',
    );
  }
}
```

---

### **3. Apply Coupon in Checkout Flow**

```dart
class CheckoutScreen extends StatefulWidget {
  @override
  _CheckoutScreenState createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  String? appliedCouponCode;
  double couponDiscount = 0.0;
  bool isValidatingCoupon = false;

  Future<void> applyCoupon(String couponCode) async {
    setState(() => isValidatingCoupon = true);

    try {
      // Calculate item total (without delivery, taxes, etc.)
      final itemTotal = calculateItemTotal();

      // Validate coupon
      final result = await validateCoupon(
        couponCode: couponCode,
        userUid: getCurrentUserUid(),
        orderAmount: itemTotal,  // ✅ Use item_total, not grand total
      );

      if (result.isValid && result.discountAmount != null) {
        setState(() {
          appliedCouponCode = couponCode;
          couponDiscount = result.discountAmount!;
        });
        
        showSuccessMessage('Coupon applied! You saved ₹${result.discountAmount}');
      } else {
        showErrorMessage(result.message);
      }
    } catch (e) {
      showErrorMessage('Failed to apply coupon: $e');
    } finally {
      setState(() => isValidatingCoupon = false);
    }
  }

  Future<void> placeOrder() async {
    final itemTotal = calculateItemTotal();
    final deliveryFee = calculateDeliveryFee();
    final taxes = calculateTaxes(itemTotal);
    final packingCharge = 10.0; // From restaurant settings
    final grandTotal = itemTotal + deliveryFee + taxes + packingCharge - couponDiscount;

    final orderData = {
      'group_uid': cartGroupUid,
      'pay_mode': selectedPaymentMode, // "ONLINE" or "COD"
      'item_total': itemTotal,
      'delivery_fee': deliveryFee,
      'taxes': taxes,
      'price': grandTotal,
      'coupon_code': appliedCouponCode,     // ✅ Include coupon
      'coupon_discount': couponDiscount,     // ✅ Include discount
      'delivery_address': deliveryAddress,
      'distance_km': distanceInKm,
      'restaurant_lat': restaurantLat,
      'restaurant_lng': restaurantLng,
      'customer_lat': customerLat,
      'customer_lng': customerLng,
    };

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/cart/payment-mode'),
        headers: {
          'Authorization': 'Bearer ${getAccessToken()}',
          'Content-Type': 'application/json',
        },
        body: json.encode(orderData),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final order = json.decode(response.body);
        navigateToOrderSuccess(order);
      } else {
        final error = json.decode(response.body);
        showErrorMessage(error['message'] ?? 'Failed to place order');
      }
    } catch (e) {
      showErrorMessage('Failed to place order: $e');
    }
  }

  double calculateItemTotal() {
    // Sum of (price × quantity) for all items
    return cartItems.fold(0.0, (sum, item) => sum + (item.price * item.qty));
  }
}
```

---

## 🚨 **Common Mistakes to Avoid**

### ❌ **Don't Do This:**

```dart
// 1. Don't validate with grand total (including delivery + taxes)
validateCoupon(
  couponCode: 'WELCOME50',
  orderAmount: grandTotal,  // ❌ WRONG
);

// 2. Don't skip validation before applying
setState(() {
  appliedCouponCode = couponCode;  // ❌ No validation
});

// 3. Don't calculate discount on frontend only
final discount = orderAmount * 0.50;  // ❌ Backend will recalculate

// 4. Don't show coupons without checking isValidForUser
allCoupons.forEach((coupon) {
  showCouponCard(coupon);  // ❌ May show expired/invalid coupons
});
```

### ✅ **Do This Instead:**

```dart
// 1. Validate with item total only
validateCoupon(
  couponCode: 'WELCOME50',
  orderAmount: itemTotal,  // ✅ Correct
);

// 2. Always validate before applying
final result = await validateCoupon(...);
if (result.isValid) {
  setState(() => appliedCouponCode = couponCode);
}

// 3. Use backend-calculated discount
final result = await validateCoupon(...);
couponDiscount = result.discountAmount;  // ✅ Server-side calculation

// 4. Filter valid coupons
coupons
  .where((c) => c.isValidForUser)
  .forEach((coupon) => showCouponCard(coupon));
```

---

## 🎨 **UI/UX Best Practices**

### **1. Show Clear Error Messages**

```dart
String getErrorMessage(String? reason, String message) {
  switch (reason) {
    case 'EXPIRED':
      return '⏰ This coupon has expired';
    case 'INACTIVE':
      return '❌ This coupon is currently inactive';
    case 'MIN_ORDER_NOT_MET':
      return '📦 $message';  // Shows required minimum
    case 'USER_LIMIT_REACHED':
      return '🚫 You\'ve already used this coupon';
    case 'LIMIT_REACHED':
      return '📊 This coupon has reached its usage limit';
    case 'NOT_ELIGIBLE':
      return '⚠️ You\'re not eligible for this coupon';
    case 'NOT_YET_ACTIVE':
      return '🕐 $message';  // Shows when it will be active
    default:
      return message;
  }
}
```

### **2. Show Discount Calculation**

```dart
Widget buildPriceSummary() {
  return Column(
    children: [
      PriceRow(label: 'Item Total', amount: itemTotal),
      PriceRow(label: 'Delivery Fee', amount: deliveryFee),
      PriceRow(label: 'Taxes', amount: taxes),
      PriceRow(label: 'Packing Charge', amount: packingCharge),
      
      if (couponDiscount > 0)
        PriceRow(
          label: '🎟️ Coupon Discount ($appliedCouponCode)',
          amount: -couponDiscount,
          style: TextStyle(color: Colors.green),
        ),
      
      Divider(),
      PriceRow(
        label: 'Grand Total',
        amount: itemTotal + deliveryFee + taxes + packingCharge - couponDiscount,
        isBold: true,
      ),
    ],
  );
}
```

### **3. Loading States**

```dart
ElevatedButton(
  onPressed: isValidatingCoupon ? null : () => applyCoupon(couponCode),
  child: isValidatingCoupon
    ? CircularProgressIndicator()
    : Text('Apply Coupon'),
)
```

---

## 🐛 **Debugging Checklist**

When you get "This coupon has expired or is inactive", check:

1. **✅ Coupon Status in Database**
   ```sql
   SELECT code, status, start_date, end_date FROM coupons WHERE code = 'YOUR_COUPON';
   ```
   - Status should be `'Active'` (case-sensitive)

2. **✅ Date Range**
   - Current date should be between `startDate` and `endDate`
   - Backend uses UTC timezone
   - Dates are inclusive (whole day)

3. **✅ API Call Parameters**
   ```dart
   print('Coupon Code: $couponCode');
   print('User UID: $userUid');
   print('Order Amount: $orderAmount');
   ```

4. **✅ Backend Logs**
   - Check server logs for detailed validation failure reason
   - Look for: `🎟️ Validating coupon:` messages

5. **✅ Network Response**
   ```dart
   print('Response: ${response.body}');
   ```

6. **✅ Discount Type**
   - `"percentage"`: discountValue = 50 (means 50%)
   - `"fixed"`: discountValue = 50 (means ₹50)

---

## 📞 **Need Help?**

1. Check backend logs: Look for coupon validation messages
2. Use `/coupons/validate` endpoint to debug
3. Verify coupon exists and status is "Active" in database
4. Check date/time alignment (UTC vs local)

---

## 🔄 **Backend Changes Made**

### **Fixed Issues:**
1. ✅ Date comparison now uses start-of-day for startDate and end-of-day for endDate
2. ✅ Added detailed logging for debugging
3. ✅ Both percentage and fixed discount types work correctly
4. ✅ Server-side validation prevents tampering

### **New Features:**
- Better error messages with specific reasons
- Debug logging for troubleshooting
- Detailed validation response

---

**Last Updated**: 2026-05-03  
**Backend Version**: 1.0  
**API Base URL**: Configure in your app
