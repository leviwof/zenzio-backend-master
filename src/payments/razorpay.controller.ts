import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

import { RazorpayService } from './razorpay.service';
import { RazorpayOrder } from './types/razorpay.types';
import { RazorpayPaymentStatus } from './utils/razorpay-payment-status.util';
import { VerifyBankDto } from './dto/verify-bank.dto';

@ApiTags('Payments')
@Controller('payments')
export class RazorpayController {
  constructor(private readonly razorpayService: RazorpayService) {}

  
  
  
  @Post('create-order')
  @ApiOperation({ summary: 'Create a Razorpay order' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 500 },
        restaurantUid: { type: 'string', example: 'rest_123' },
        groupUid: { type: 'string', example: 'grp_456' },
        items: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  createOrder(
    @Body() body: { amount: number; restaurantUid: string; groupUid: string; items: any[] },
  ): Promise<RazorpayOrder> {
    return this.razorpayService.createOrder(body.amount, body.restaurantUid, body.groupUid);
  }

  
  
  
  @Post('auto-capture')
  @ApiOperation({ summary: 'Auto-capture a Razorpay payment' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string', example: 'pay_123456' },
        amount: { type: 'number', example: 500 },
      },
    },
  })
  async autoCapture(@Body() body: { paymentId: string; amount: number }) {
    if (!body.paymentId || !body.amount) {
      throw new BadRequestException('paymentId and amount are required');
    }

    return this.razorpayService.autoCapturePayment(body.paymentId, body.amount);
  }

  
  
  
  @Post('status')
  @ApiOperation({ summary: 'Check Razorpay payment status' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string', example: 'pay_123456' },
        orderId: { type: 'string', example: 'order_ABC123' },
      },
    },
  })
  async checkStatus(
    @Body() body: { paymentId: string; orderId: string },
  ): Promise<RazorpayPaymentStatus> {
    if (!body.paymentId) {
      throw new BadRequestException('paymentId is required');
    }

    if (!body.orderId) {
      throw new BadRequestException('orderId is required');
    }

    return this.razorpayService.checkPaymentStatus(body.paymentId, body.orderId);
  }

  
  
  
  @Post('verify')
  @ApiOperation({ summary: 'Verify Razorpay payment signature' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderId: { type: 'string', example: 'order_123' },
        paymentId: { type: 'string', example: 'pay_123' },
        signature: { type: 'string', example: 'generated_signature_hash' },
      },
    },
  })
  async verifyPayment(@Body() body: { orderId: string; paymentId: string; signature: string }) {
    const verified = await this.razorpayService.verifyPayment(
      body.orderId,
      body.paymentId,
      body.signature,
    );

    return { verified };
  }

  
  
  
  @Post('refund-partial')
  @ApiOperation({ summary: 'Initiate partial refund' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string', example: 'pay_123456' },
        amount: { type: 'number', example: 150 },
      },
    },
  })
  async refundPartial(@Body() body: { paymentId: string; amount: number }) {
    if (!body.paymentId || !body.amount) {
      throw new BadRequestException('paymentId and amount are required');
    }

    return this.razorpayService.refundPartialPayment(body.paymentId, body.amount);
  }

  
  
  
  @Post('refund-full')
  @ApiOperation({ summary: 'Initiate full refund' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string', example: 'pay_123456' },
      },
    },
  })
  async refundFull(@Body() body: { paymentId: string }) {
    if (!body.paymentId) {
      throw new BadRequestException('paymentId is required');
    }

    return this.razorpayService.refundFullPayment(body.paymentId);
  }

  
  
  
  @Post('create-customer')
  @ApiOperation({ summary: 'Create Razorpay Customer' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john@example.com' },
        contact: { type: 'string', example: '9876543210' },
      },
    },
  })
  async createCustomer(@Body() body: { name: string; email: string; contact: string }) {
    const { name, email, contact } = body;

    if (!name || !email || !contact) {
      throw new BadRequestException('Name, email & contact are required');
    }

    return this.razorpayService.createCustomer(name, email, contact);
  }

  @Get('customers')
  @ApiOperation({ summary: 'List Razorpay customers' })
  async listCustomers() {
    return this.razorpayService.listCustomers();
  }

  
  
  
  @Post('add-bank')
  @ApiOperation({ summary: 'Add Bank Account for Customer (Fund Account)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        customerId: { type: 'string', example: 'cust_LhXxzF9BQ01AEt' },
        name: { type: 'string', example: 'John Doe' },
        ifsc: { type: 'string', example: 'HDFC0001234' },
        accountNumber: { type: 'string', example: '123456789012' },
      },
      required: ['customerId', 'name', 'ifsc', 'accountNumber'],
    },
  })
  async addBankAccount(
    @Body()
    body: {
      customerId: string;
      name: string;
      ifsc: string;
      accountNumber: string;
    },
  ) {
    const { customerId, name, ifsc, accountNumber } = body;

    if (!customerId || !name || !ifsc || !accountNumber) {
      throw new BadRequestException('customerId, name, ifsc, and accountNumber are required');
    }

    return this.razorpayService.addBankAccount(customerId, name, ifsc, accountNumber);
  }

  
  
  
  @Post('add-bank-contact')
  async addBankAccountToContact(
    @Body() body: { contactId: string; name: string; ifsc: string; accountNumber: string },
  ) {
    return this.razorpayService.addBankAccountForContact(
      body.contactId,
      body.name,
      body.ifsc,
      body.accountNumber,
    );
  }

  @Post('create-contact')
  @ApiOperation({ summary: 'Create Razorpay Contact (for Payouts)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john@example.com' },
        contact: { type: 'string', example: '9876543210' },
        reference_id: { type: 'string', example: 'delivery_partner_001' },
        notes: {
          type: 'object',
          example: {
            role: 'delivery_partner',
            zone: 'south-area',
          },
        },
      },
    },
  })
  async createContact(
    @Body()
    body: {
      name: string;
      email?: string;
      contact?: string;
      reference_id?: string;
      notes?: Record<string, any>;
    },
  ) {
    return this.razorpayService.createContact(body);
  }

  @Get('contact/:contactId')
  @ApiOperation({ summary: 'Get Razorpay contact by ID' })
  async getContactById(@Param('contactId') contactId: string) {
    if (!contactId) {
      throw new BadRequestException('contactId is required');
    }

    return this.razorpayService.getContactById(contactId);
  }

  @Get('fund-accounts/:contactId')
  @ApiOperation({ summary: 'Get fund accounts for a contact ID' })
  async getFundAccounts(@Param('contactId') contactId: string) {
    if (!contactId) {
      throw new BadRequestException('contactId is required');
    }

    return this.razorpayService.getFundAccounts(contactId);
  }

  @Post('bank/verify')
  async verifyBankAccount(@Body() dto: VerifyBankDto) {
    return this.razorpayService.verify(dto);
  }

  // ==========================================
  // MASTER ADMIN PAYOUT APIS 
  // ==========================================

  @Post('admin/verify-and-link')
  @ApiOperation({ summary: 'Master API to Create Contact, Fund Account, and Verify Bank' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        uid: { type: 'string', example: 'fleet_123' },
        userType: { type: 'string', example: 'fleet' },
      },
    },
  })
  async masterVerifyAndLink(@Body() body: { uid: string; userType: 'fleet' | 'restaurant' }) {
    if (!body.uid || !body.userType) {
      throw new BadRequestException('uid and userType (fleet or restaurant) are required');
    }
    return this.razorpayService.masterVerifyAndLink(body.uid, body.userType);
  }

  @Post('admin/payout')
  @ApiOperation({ summary: 'Initiate Payout to a Verified Bank Account' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        uid: { type: 'string', example: 'fleet_123' },
        userType: { type: 'string', example: 'fleet' },
        amount: { type: 'number', example: 500 },
      },
    },
  })
  async initiateAdminPayout(@Body() body: { uid: string; userType: 'fleet' | 'restaurant'; amount: number }) {
    if (!body.uid || !body.userType || !body.amount) {
      throw new BadRequestException('uid, userType, and amount are required');
    }
    return this.razorpayService.initiateAdminPayout(body.uid, body.userType, body.amount);
  }
}
