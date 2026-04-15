import { Body, Controller, Delete, Get, HttpException, HttpStatus, Post } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from './firebase.service';

@Controller('firebase')
export class FirebaseController {
  constructor(private readonly authService: FirebaseService) {}

  /**
   * ✅ Send Email Verification
   */
  @Post('send-verification')
  async sendVerification(@Body('email') email: string, @Body('redirectUrl') redirectUrl: string) {
    if (!email || !redirectUrl) {
      throw new HttpException('Email and redirectUrl are required', HttpStatus.BAD_REQUEST);
    }

    const link = await this.authService.sendEmailVerification(email, redirectUrl);
    return { message: 'Verification link generated successfully', link };
  }

  /**
   * ✅ View all Firebase users (paginated)
   */
  @Get('users')
  async getAllUsers() {
    try {
      const users = await this.listAllUsers();
      return {
        total: users.length,
        users: users.map((u) => ({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          phoneNumber: u.phoneNumber,
          disabled: u.disabled,
          metadata: u.metadata,
        })),
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to fetch Firebase users: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ✅ Delete ALL Firebase users — requires explicit confirmation
   */
  @Delete('users')
  async deleteAllUsers(@Body() body: { confirm?: boolean }) {
    try {
      if (!body?.confirm) {
        throw new HttpException(
          '❌ Confirmation required. Pass { "confirm": true } in the body to delete all users.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const deletedCount = await this.deleteAllFirebaseUsers();

      return {
        message: `✅ Deleted ${deletedCount} Firebase users successfully.`,
        deletedCount,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to delete Firebase users: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ✅ Delete specific Firebase users by UID
   */
  @Delete('users/by-id')
  async deleteUsersById(@Body() body: { ids: string[] }) {
    try {
      if (!body?.ids || body.ids.length === 0) {
        throw new HttpException('No user IDs provided', HttpStatus.BAD_REQUEST);
      }

      const deleteResult = await admin.auth().deleteUsers(body.ids);

      return {
        message: `Firebase users deletion complete.`,
        successCount: deleteResult.successCount,
        failureCount: deleteResult.failureCount,
        errors: deleteResult.errors?.map((e) => ({
          index: e.index,
          uid: body.ids[e.index],
          error: e.error.message,
        })),
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to delete Firebase users: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 🔹 Helper: List all Firebase users recursively
   */
  private async listAllUsers(
    nextPageToken?: string,
    allUsers: admin.auth.UserRecord[] = [],
  ): Promise<admin.auth.UserRecord[]> {
    const result = await admin.auth().listUsers(1000, nextPageToken);
    allUsers.push(...result.users);

    if (result.pageToken) {
      return this.listAllUsers(result.pageToken, allUsers);
    }

    return allUsers;
  }

  /**
   * 🔹 Helper: Delete all Firebase users recursively
   */
  private async deleteAllFirebaseUsers(nextPageToken?: string, totalDeleted = 0): Promise<number> {
    const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
    const uids = listUsersResult.users.map((user) => user.uid);

    if (uids.length > 0) {
      const deleteResult = await admin.auth().deleteUsers(uids);
      totalDeleted += deleteResult.successCount;
      console.log(
        `Deleted ${deleteResult.successCount} users, failed: ${deleteResult.failureCount}`,
      );
    }

    if (listUsersResult.pageToken) {
      return this.deleteAllFirebaseUsers(listUsersResult.pageToken, totalDeleted);
    }

    return totalDeleted;
  }
}
