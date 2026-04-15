import {
    Controller,
    Post,
    Get,
    Patch,
    Param,
    Body,
    UseGuards,
    Req,
    Query,
} from '@nestjs/common';
import { ShiftChangeRequestService } from './shift-change-request.service';
import { CreateShiftChangeRequestDto } from './dto/create-shift-change-request.dto';
import { ApproveShiftChangeRequestDto } from './dto/approve-shift-change-request.dto';
import { JwtAuthGuard, RolesGuard } from '../guards';
import { RolesDecorator } from '../auth/app.decorator';
import { Roles } from '../constants/app.enums';
import { ShiftChangeRequestStatus } from './entity/shift-change-request.entity';

@Controller('shift-change-requests')
export class ShiftChangeRequestController {
    constructor(private readonly service: ShiftChangeRequestService) { }

    // Delivery partner creates a shift change request
    @Post()
    @UseGuards(JwtAuthGuard)
    async createRequest(@Req() req: any, @Body() dto: CreateShiftChangeRequestDto) {
        const fleetUid = req.user.uid; // Assuming JWT contains fleet UID
        const request = await this.service.createRequest(fleetUid, dto);
        return {
            status: 'success',
            code: 201,
            data: request,
            message: 'Shift change request submitted successfully',
        };
    }

    // Get all shift change requests (Admin only)
    @Get('admin/all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RolesDecorator(Roles.MASTER_ADMIN, Roles.SUPER_ADMIN)
    async getAllRequests(@Query('status') status?: ShiftChangeRequestStatus) {
        const requests = await this.service.getAllRequests(status);
        return {
            status: 'success',
            code: 200,
            data: requests,
            message: 'Shift change requests fetched successfully',
        };
    }

    // Get shift change requests for logged-in delivery partner
    @Get('my-requests')
    @UseGuards(JwtAuthGuard)
    async getMyRequests(@Req() req: any) {
        const fleetUid = req.user.uid;
        const requests = await this.service.getRequestsByFleet(fleetUid);
        return {
            status: 'success',
            code: 200,
            data: requests,
            message: 'Your shift change requests fetched successfully',
        };
    }

    // Get shift change requests for a specific fleet (Admin only)
    @Get('fleet/:fleetUid')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RolesDecorator(Roles.MASTER_ADMIN, Roles.SUPER_ADMIN)
    async getRequestsByFleet(@Param('fleetUid') fleetUid: string) {
        const requests = await this.service.getRequestsByFleet(fleetUid);
        return {
            status: 'success',
            code: 200,
            data: requests,
            message: 'Fleet shift change requests fetched successfully',
        };
    }

    // Get single request by ID
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async getRequestById(@Param('id') id: number) {
        const request = await this.service.getRequestById(id);
        return {
            status: 'success',
            code: 200,
            data: request,
            message: 'Shift change request fetched successfully',
        };
    }

    // Admin approves or rejects a shift change request
    @Patch('admin/:id/process')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @RolesDecorator(Roles.MASTER_ADMIN, Roles.SUPER_ADMIN)
    async processRequest(
        @Param('id') id: number,
        @Body() dto: ApproveShiftChangeRequestDto,
        @Req() req: any,
    ) {
        const adminUid = req.user.uid;
        const request = await this.service.processRequest(id, dto, adminUid);
        return {
            status: 'success',
            code: 200,
            data: request,
            message: `Shift change request ${dto.status} successfully`,
        };
    }
}
