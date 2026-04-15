import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual } from 'typeorm';
import * as admin from 'firebase-admin';
import { FcmToken, UserType } from './fcm-token.entity';
import { User } from '../users/user.entity';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}


const FIREBASE_APP_CUSTOMER = 'customer-app';
const FIREBASE_APP_RESTAURANT = 'restaurant-app';
const FIREBASE_APP_DELIVERY = 'delivery-app';

import { Notification } from './notification.entity';

@Injectable()
export class NotificationService implements OnModuleInit {
  private customerApp: admin.app.App | null = null;
  private restaurantApp: admin.app.App | null = null;
  private deliveryApp: admin.app.App | null = null;

  constructor(
    @InjectRepository(FcmToken)
    private readonly fcmTokenRepo: Repository<FcmToken>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) { }

  onModuleInit() {
    this.initializeFirebaseApps();
  }

  private initializeFirebaseApps() {
    
    const customerConfigPath = join(process.cwd(), 'src', 'config', 'firebase-adminsdk.json');
    if (existsSync(customerConfigPath)) {
      try {
        const customerConfig = JSON.parse(readFileSync(customerConfigPath, 'utf8'));
        this.customerApp = admin.initializeApp(
          {
            credential: admin.credential.cert(customerConfig),
          },
          FIREBASE_APP_CUSTOMER,
        );
        console.log(
          '✅ Firebase Customer App initialized (project: ' + customerConfig.project_id + ')',
        );
      } catch (error) {
        console.error('❌ Failed to initialize Firebase Customer App:', error);
      }
    }

    
    const restaurantConfigPath = join(
      process.cwd(),
      'src',
      'config',
      'firebase-adminsdk-restaurant.json',
    );
    if (existsSync(restaurantConfigPath)) {
      try {
        const restaurantConfig = JSON.parse(readFileSync(restaurantConfigPath, 'utf8'));
        this.restaurantApp = admin.initializeApp(
          {
            credential: admin.credential.cert(restaurantConfig),
          },
          FIREBASE_APP_RESTAURANT,
        );
        console.log(
          '✅ Firebase Restaurant App initialized (project: ' + restaurantConfig.project_id + ')',
        );
      } catch (error) {
        console.error('❌ Failed to initialize Firebase Restaurant App:', error);
      }
    }

    
    const deliveryConfigPath = join(
      process.cwd(),
      'src',
      'config',
      'firebase-adminsdk-delivery.json',
    );
    if (existsSync(deliveryConfigPath)) {
      try {
        const deliveryConfig = JSON.parse(readFileSync(deliveryConfigPath, 'utf8'));
        this.deliveryApp = admin.initializeApp(
          {
            credential: admin.credential.cert(deliveryConfig),
          },
          FIREBASE_APP_DELIVERY,
        );
        console.log(
          '✅ Firebase Delivery App initialized (project: ' + deliveryConfig.project_id + ')',
        );
      } catch (error) {
        console.error('❌ Failed to initialize Firebase Delivery App:', error);
      }
    }

    
    if (!this.customerApp && !this.restaurantApp && !this.deliveryApp) {
      console.warn('⚠️ No Firebase apps initialized. Push notifications will not work.');
    }
  }

  
  private getMessagingForUserType(userType: UserType): admin.messaging.Messaging | null {
    switch (userType) {
      case UserType.RESTAURANT:
        return this.restaurantApp?.messaging() || this.customerApp?.messaging() || null;
      case UserType.USER:
        return this.customerApp?.messaging() || null;
      case UserType.DELIVERY_PARTNER:
        return this.deliveryApp?.messaging() || this.customerApp?.messaging() || null;
      case UserType.ADMIN:
        return this.customerApp?.messaging() || null;
      default:
        return this.customerApp?.messaging() || null;
    }
  }

  
  
  
  async registerToken(
    userType: UserType,
    userId: string,
    token: string,
    deviceId?: string,
    platform = 'android',
  ): Promise<FcmToken> {
    
    let existingToken = await this.fcmTokenRepo.findOne({
      where: { userType, userId, token },
    });

    if (existingToken) {
      
      existingToken.isActive = true;
      existingToken.updatedAt = new Date();
      return this.fcmTokenRepo.save(existingToken);
    }

    
    if (deviceId) {
      await this.fcmTokenRepo.update({ userType, userId, deviceId }, { isActive: false });
    }

    
    const fcmToken = this.fcmTokenRepo.create({
      userType,
      userId,
      token,
      deviceId,
      platform,
      isActive: true,
    });

    console.log(`\n📱 [FCM] Token registered for ${userType}: ${userId}`);
    return this.fcmTokenRepo.save(fcmToken);
  }

  
  
  
  async removeToken(token: string): Promise<void> {
    await this.fcmTokenRepo.update({ token }, { isActive: false });
    console.log(`\n📱 [FCM] Token deactivated: ${token.substring(0, 20)}...`);
  }

  
  
  
  async sendToUser(
    userType: UserType,
    userId: string,
    payload: NotificationPayload,
  ): Promise<{ success: boolean; sent: number; failed: number }> {
    
    try {
      await this.notificationRepo.save({
        userType,
        userId,
        title: payload.title,
        body: payload.body,
        data: payload.data,
      });
    } catch (e) {
      console.error('❌ Failed to save notification to DB:', e);
    }

    
    if (userType === UserType.USER) {
      const user = await this.userRepo.findOne({ where: { uid: userId } });
      if (user && user.notificationsEnabled === false) {
        console.log(`🔕 Notifications disabled for user: ${userId}`);
        return { success: false, sent: 0, failed: 0 };
      }
    }

    const tokens = await this.fcmTokenRepo.find({
      where: { userType, userId, isActive: true },
    });

    if (tokens.length === 0) {
      console.log(`\n⚠️ [FCM] No active tokens for ${userType}: ${userId}`);
      return { success: false, sent: 0, failed: 0 };
    }

    
    const channelId = this.getChannelIdForUserType(userType);

    return this.sendToTokens(
      tokens.map((t) => t.token),
      payload,
      channelId,
      userType,
    );
  }

  
  
  
  async sendToUsers(
    userType: UserType,
    userIds: string[],
    payload: NotificationPayload,
  ): Promise<{ success: boolean; sent: number; failed: number }> {
    let targetUserIds = userIds;

    
    if (userType === UserType.USER) {
      const users = await this.userRepo.find({
        where: { uid: In(userIds) },
        select: ['uid', 'notificationsEnabled'],
      });

      
      targetUserIds = users.filter((u) => u.notificationsEnabled !== false).map((u) => u.uid);

      if (targetUserIds.length < userIds.length) {
        console.log(
          `🔕 Skipped ${userIds.length - targetUserIds.length} users (notifications disabled)`,
        );
      }

      if (targetUserIds.length === 0) {
        return { success: false, sent: 0, failed: 0 };
      }
    }

    const tokens = await this.fcmTokenRepo.find({
      where: { userType, userId: In(targetUserIds), isActive: true },
    });

    if (tokens.length === 0) {
      console.log(`\n⚠️ [FCM] No active tokens for ${userType} users`);
      return { success: false, sent: 0, failed: 0 };
    }

    const channelId = this.getChannelIdForUserType(userType);

    return this.sendToTokens(
      tokens.map((t) => t.token),
      payload,
      channelId,
      userType,
    );
  }

  
  
  
  async sendToAllOfType(
    userType: UserType,
    payload: NotificationPayload,
  ): Promise<{ success: boolean; sent: number; failed: number }> {
    
    try {
      await this.notificationRepo.save({
        userType,
        userId: 'ALL', 
        title: payload.title,
        body: payload.body,
        data: payload.data,
      });
    } catch (e) {
      console.error('❌ Failed to save broadcast notification to DB:', e);
    }

    const tokens = await this.fcmTokenRepo.find({
      where: { userType, isActive: true },
    });

    if (tokens.length === 0) {
      console.log(`\n⚠️ [FCM] No active tokens for ${userType}`);
      return { success: false, sent: 0, failed: 0 };
    }

    const channelId = this.getChannelIdForUserType(userType);

    return this.sendToTokens(
      tokens.map((t) => t.token),
      payload,
      channelId,
      userType,
    );
  }

  
  
  
  private getChannelIdForUserType(userType: UserType): string {
    switch (userType) {
      case UserType.RESTAURANT:
        return 'zenzio_restaurant_orders_ringtone_v4'; 
      case UserType.DELIVERY_PARTNER:
        return 'zenzio_delivery_ringtone';
      case UserType.USER:
        return 'zenzio_orders';
      case UserType.ADMIN:
        return 'zenzio_admin_notifications';
      default:
        return 'zenzio_orders';
    }
  }

  
  
  
  private async sendToTokens(
    tokens: string[],
    payload: NotificationPayload,
    channelId: string = 'zenzio_orders',
    userType: UserType = UserType.USER,
  ): Promise<{ success: boolean; sent: number; failed: number }> {
    if (tokens.length === 0) {
      return { success: false, sent: 0, failed: 0 };
    }

    
    const messaging = this.getMessagingForUserType(userType);
    if (!messaging) {
      console.error(`❌ [FCM] No messaging instance available for ${userType}`);
      return { success: false, sent: 0, failed: 0 };
    }

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data || {},
      android: {
        priority: 'high',
        notification: {
          sound:
            userType === UserType.RESTAURANT || userType === UserType.DELIVERY_PARTNER
              ? 'new_order'
              : 'default',
          channelId: channelId,
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    try {
      const response = await messaging.sendEachForMulticast(message);

      console.log(`\n🔔 [FCM] Notification sent: "${payload.title}"`);
      console.log(`   ✅ Success: ${response.successCount}`);
      console.log(`   ❌ Failed: ${response.failureCount}`);

      
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            console.log(`   ⚠️ Failed token: ${tokens[idx].substring(0, 20)}...`);
          }
        });

        
        if (failedTokens.length > 0) {
          await this.fcmTokenRepo.update({ token: In(failedTokens) }, { isActive: false });
        }
      }

      return {
        success: response.successCount > 0,
        sent: response.successCount,
        failed: response.failureCount,
      };
    } catch (error) {
      console.error('\n❌ [FCM] Error sending notification:', error);
      return { success: false, sent: 0, failed: tokens.length };
    }
  }

  
  
  

  
  async notifyOrderConfirmed(userId: string, orderId: string): Promise<void> {
    await this.sendToUser(UserType.USER, userId, {
      title: '🎉 Order Confirmed!',
      body: 'Your order has been placed successfully. The restaurant will start preparing soon.',
      data: {
        type: 'ORDER_CONFIRMED',
        orderId,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    });
  }

  
  async notifyRestaurantNewOrder(
    restaurantId: string,
    orderId: string,
    customerName: string,
    totalAmount: number,
  ): Promise<void> {
    await this.sendToUser(UserType.RESTAURANT, restaurantId, {
      title: '🔔 New Order Received!',
      body: `New order from ${customerName} - ₹${totalAmount.toFixed(2)}`,
      data: {
        type: 'NEW_ORDER',
        orderId,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    });
  }

  
  async notifyOrderAccepted(
    userId: string,
    orderId: string,
    restaurantName: string,
  ): Promise<void> {
    await this.sendToUser(UserType.USER, userId, {
      title: '✅ Order Accepted!',
      body: `${restaurantName} has accepted your order and is preparing it now.`,
      data: {
        type: 'ORDER_ACCEPTED',
        orderId,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    });
  }

  
  async notifyDeliveryPartnersNewJob(
    orderId: string,
    restaurantName: string,
    pickupAddress: string,
  ): Promise<void> {
    await this.sendToAllOfType(UserType.DELIVERY_PARTNER, {
      title: '🚗 New Delivery Available!',
      body: `Pickup from ${restaurantName}`,
      data: {
        type: 'NEW_DELIVERY',
        orderId,
        restaurantName,
        pickupAddress,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    });
  }

  
  async notifyDeliveryAssigned(
    userId: string,
    orderId: string,
    partnerName: string,
  ): Promise<void> {
    await this.sendToUser(UserType.USER, userId, {
      title: '🛵 Delivery Partner Assigned!',
      body: `${partnerName} will deliver your order.`,
      data: {
        type: 'DELIVERY_ASSIGNED',
        orderId,
        partnerName,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    });
  }

  
  async notifyRestaurantDeliveryAssigned(
    restaurantId: string,
    orderId: string,
    partnerName: string,
  ): Promise<void> {
    await this.sendToUser(UserType.RESTAURANT, restaurantId, {
      title: '🛵 Delivery Partner Assigned',
      body: `${partnerName} will pick up order #${orderId.substring(0, 8)}`,
      data: {
        type: 'DELIVERY_ASSIGNED',
        orderId,
        partnerName,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    });
  }

  
  async notifyOrderOutForDelivery(userId: string, orderId: string): Promise<void> {
    await this.sendToUser(UserType.USER, userId, {
      title: '🚀 Order Out for Delivery!',
      body: 'Your order is on the way. Track it in real-time!',
      data: {
        type: 'OUT_FOR_DELIVERY',
        orderId,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    });
  }

  
  async notifyOrderDelivered(userId: string, orderId: string): Promise<void> {
    await this.sendToUser(UserType.USER, userId, {
      title: '✅ Order Delivered!',
      body: "Enjoy your meal! Don't forget to rate your experience.",
      data: {
        type: 'ORDER_DELIVERED',
        orderId,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    });
  }

  
  
  
  async getUserNotifications(userType: UserType, userId: string): Promise<Notification[]> {
    let accountCreatedAt = new Date(0); // Default to epoch

    // Dynamically fetch account creation date to prevent leaking old broadcast notifications
    try {
      if (userType === UserType.USER) {
        const user = await this.userRepo.findOne({ where: { uid: userId }, select: ['createdAt'] });
        if (user) accountCreatedAt = user.createdAt;
      } else if (userType === UserType.DELIVERY_PARTNER) {
        const result = await this.notificationRepo.manager.query(`SELECT "createdAt" FROM fleets WHERE "uid" = $1 LIMIT 1`, [userId]);
        if (result && result.length > 0) accountCreatedAt = result[0].createdAt;
      } else if (userType === UserType.RESTAURANT) {
        const result = await this.notificationRepo.manager.query(`SELECT "createdAt" FROM restaurants WHERE "uid" = $1 LIMIT 1`, [userId]);
        if (result && result.length > 0) accountCreatedAt = result[0].createdAt;
      }
    } catch (e) {
      console.warn(`[Notifications] Could not fetch account creation date for ${userType} ${userId}`, e);
    }

    return this.notificationRepo.find({
      where: [
        { userId, userType }, // Specific notifications for this user
        { 
          userId: 'ALL', 
          userType,
          createdAt: MoreThanOrEqual(accountCreatedAt) // Only broadcasts sent AFTER they joined
        }, 
      ],
      order: { createdAt: 'DESC' },
      take: 50, 
    });
  }

  
  
  
  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationRepo.update(notificationId, { isRead: true });
  }

  
  
  

  
  async notifyUserDeliveryCancelledByAdmin(
    userId: string,
    orderId: string,
    reason?: string,
  ): Promise<void> {
    await this.sendToUser(UserType.USER, userId, {
      title: '⚠️ Delivery Cancelled',
      body:
        reason ||
        'Your order delivery has been cancelled by admin. Please contact support for more details.',
      data: {
        type: 'DELIVERY_CANCELLED_ADMIN',
        orderId,
        reason: reason || '',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    });
  }

  
  async notifyRestaurantDeliveryCancelledByAdmin(
    restaurantId: string,
    orderId: string,
    reason?: string,
  ): Promise<void> {
    await this.sendToUser(UserType.RESTAURANT, restaurantId, {
      title: '⚠️ Delivery Cancelled by Admin',
      body: `Order #${orderId.substring(0, 8)} delivery has been cancelled. ${reason || 'Contact admin for details.'}`,
      data: {
        type: 'DELIVERY_CANCELLED_ADMIN',
        orderId,
        reason: reason || '',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    });
  }

  
  async notifyDeliveryPartnerCancelledByAdmin(
    partnerId: string,
    orderId: string,
    reason?: string,
  ): Promise<void> {
    await this.sendToUser(UserType.DELIVERY_PARTNER, partnerId, {
      title: '⚠️ Delivery Cancelled by Admin',
      body: `Your delivery assignment for order #${orderId.substring(0, 8)} has been cancelled. ${reason || 'Contact admin for details.'}`,
      data: {
        type: 'DELIVERY_CANCELLED_ADMIN',
        orderId,
        reason: reason || '',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    });
  }

  
  async notifyDeliveryPartnerStatusChangedByAdmin(
    partnerId: string,
    orderId: string,
    newStatus: string,
  ): Promise<void> {
    await this.sendToUser(UserType.DELIVERY_PARTNER, partnerId, {
      title: '📋 Delivery Status Updated',
      body: `Order #${orderId.substring(0, 8)} status has been updated to ${newStatus.replace(/_/g, ' ').toUpperCase()} by admin.`,
      data: {
        type: 'DELIVERY_STATUS_CHANGED_ADMIN',
        orderId,
        newStatus,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    });
  }

  
  async notifyDeliveryPartnerAssignedJob(
    partnerId: string,
    orderId: string,
    restaurantName: string,
    pickupAddress: string,
  ): Promise<void> {
    await this.sendToUser(UserType.DELIVERY_PARTNER, partnerId, {
      title: '🛵 New Delivery Assigned!',
      body: `You have been assigned to pick up from ${restaurantName}`,
      data: {
        type: 'NEW_DELIVERY_ASSIGNED',
        orderId,
        restaurantName,
        pickupAddress,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    });
  }

  
  
  

  
  async notifyAdmin(payload: NotificationPayload): Promise<void> {
    
    await this.sendToAllOfType(UserType.ADMIN, payload);
  }

  
  async notifyNewRestaurantRegistered(restaurantName: string, email: string): Promise<void> {
    await this.notifyAdmin({
      title: '🏪 New Restaurant Registered',
      body: `${restaurantName} has just registered and is pending approval.`,
      data: {
        type: 'NEW_RESTAURANT_REGISTRATION',
        restaurantName,
        email,
      },
    });
  }

  
  async notifyNewPartnerRegistered(partnerName: string, email: string): Promise<void> {
    await this.notifyAdmin({
      title: '🛵 New Delivery Partner Registered',
      body: `${partnerName} has just joined the fleet and is pending review.`,
      data: {
        type: 'NEW_PARTNER_REGISTRATION',
        partnerName,
        email,
      },
    });
  }
}
