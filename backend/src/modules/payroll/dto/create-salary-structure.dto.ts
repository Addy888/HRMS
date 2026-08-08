import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateSalaryStructureDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  basicSalary: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hra?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  conveyance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  medicalAllowance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  specialAllowance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  otherAllowances?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pf?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  esi?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  professionalTax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tds?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  otherDeductions?: number;

  @IsNotEmpty()
  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}



