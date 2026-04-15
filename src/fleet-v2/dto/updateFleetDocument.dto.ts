import { PartialType } from '@nestjs/swagger';
import { CreateFleetDocumentDto } from './createFleetDocument.dto';
// import { CreateFleetDocumentDto } from 'src/fleet/dto/create-fleet-document.dto';
// import { CreateFleetDocumentDto } from './createFleetDocument.dto';
// CreateFleetDocumentDto
// import { CreateFleetDocumentDto } from './create-fleet-document.dto';
// CreateFleetDocumentDto
/**
 * Update DTO extends Create DTO using PartialType
 * so all fields are optional during updates
 */
export class UpdateFleetDocumentDto extends PartialType(CreateFleetDocumentDto) {}
