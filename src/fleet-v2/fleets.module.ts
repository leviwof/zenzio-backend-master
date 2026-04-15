import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FleetsService } from './fleets.service';
import { FleetsController } from './fleets.controller';
import { Fleet } from './entity/fleet.entity';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { FleetContact } from './entity/fleet_contact.entity';
import { SessionService } from 'src/auth/session.service';
import { JwtServiceShared } from 'src/shared/jwt.service';
import { Session } from 'src/auth/session.entity';
import { FleetProfile } from './entity/fleet_profile.entity';
import { FleetAddress } from './entity/fleet_address.entity';
import { FleetBankDetails } from './entity/fleet_bank_details.entity';
import { UtilService } from 'src/utils/util.service';
// import { FleetProfile } from './entity/fleet-document.entity';
import { WorkingHour } from './entity/working-hour.entity';
import { FleetDocument } from './entity/fleet-document.entity';
import { FleetEmergencyContact } from './entity/fleet_emergency_contact.entity';
import { OtpEntity } from 'src/otp/otp.entity';
import { FileService } from 'src/file/file.service';
// import { S3Util } from 'src/aws/s3.util';
import { S3Module } from 'src/aws/s3.module';
import { FFileService } from './res-images.service';
import { DocumentUploadService } from './document-upload.service';
import { WorkType } from 'src/work-type/work-type.entity';
import { ForgotPasswordController } from './forgot-password.controller';
import { MailService } from 'src/mail/mail.service';
import { DeliveryHistory } from './entity/delivery_history.entity';
import { DeliveryHistoryService } from './delivery-history.service';
import { DeliveryHistoryController } from './delivery-history.controller';
import { Order } from 'src/orders/order.entity';
import { NotificationModule } from 'src/notifications/notification.module';
import { ShiftChangeRequest } from './entity/shift-change-request.entity';
import { ShiftChangeRequestService } from './shift-change-request.service';
import { ShiftChangeRequestController } from './shift-change-request.controller';
// import { Vendor } from 'src/vendor/vendor.entity';
// import { Candidate } from 'src/candidate/candidate.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Fleet,
      FleetContact,
      WorkingHour,
      Session,
      FleetProfile,
      FleetAddress,
      FleetBankDetails,
      FleetProfile,
      FleetDocument,
      FleetEmergencyContact,
      OtpEntity,
      WorkType,
      DeliveryHistory,
      Order,
      ShiftChangeRequest,
    ]),
    forwardRef(() => FirebaseModule),
    S3Module,
    NotificationModule,
    // <== ✅,
  ], // Import FirebaseModule, not FirebaseService
  controllers: [
    FleetsController,
    ForgotPasswordController,
    DeliveryHistoryController,
    ShiftChangeRequestController,
  ],
  providers: [
    FleetsService,
    SessionService,
    JwtServiceShared,
    UtilService,
    FileService,
    FFileService,
    DocumentUploadService,
    MailService,
    DeliveryHistoryService,
    ShiftChangeRequestService,
  ],
  exports: [FleetsService], // If needed in other modules
})
export class FleetsModule { }
