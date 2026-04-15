import { PartialType } from '@nestjs/mapped-types';
import { CreateCartTransactionDto } from './createTransaction.dto';

export class UpdateCartTransactionDto extends PartialType(CreateCartTransactionDto) {}
