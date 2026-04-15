import { PartialType } from '@nestjs/swagger';
import { CreateRestaurantDocumentDto } from './create-restaurant-document.dto';
// import { CreateRestaurantDocumentDto } from './create-restaurant-document.dto';

/**
 * Update DTO extends Create DTO using PartialType
 * so all fields are optional during updates
 */
export class UpdateRestaurantDocumentDto extends PartialType(CreateRestaurantDocumentDto) {}
