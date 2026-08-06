import {
  IsString,
  IsOptional,
  IsEmail,
  Matches,
  Length,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  // Personal Info
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fatherName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  motherName?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dob?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bloodGroup?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  maritalStatus?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nationality?: string;

  // Contact Info
  @ApiPropertyOptional()
  @Matches(/^[6-9]\d{9}$/, {
    message:
      'Primary mobile number must be a valid 10-digit Indian mobile number',
  })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @Matches(/^[6-9]\d{9}$/, {
    message:
      'Alternate mobile number must be a valid 10-digit Indian mobile number',
  })
  @IsOptional()
  alternatePhone?: string;

  @ApiPropertyOptional()
  @IsEmail({}, { message: 'Personal email must be a valid email address' })
  @IsOptional()
  personalEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  permanentAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currentAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @ApiPropertyOptional()
  @Matches(/^[6-9]\d{9}$/, {
    message:
      'Emergency contact number must be a valid 10-digit Indian mobile number',
  })
  @IsOptional()
  emergencyContactPhone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  emergencyContactRelation?: string;

  // Professional Info
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reportingManager?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  employmentType?: string; // e.g. FULL_TIME, CONTRACT, INTERN

  // Bank Details
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankAccountHolder?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankBranch?: string;

  @ApiPropertyOptional()
  @Matches(/^\d{9,18}$/, {
    message: 'Bank account number must be between 9 and 18 digits',
  })
  @IsOptional()
  bankAccountNumber?: string;

  @ApiPropertyOptional()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, {
    message: 'IFSC code must be a valid Indian bank IFSC (e.g. SBIN0001234)',
  })
  @IsOptional()
  bankIfsc?: string;

  @ApiPropertyOptional()
  @Matches(/^[\w.-]+@[\w.-]+$/, {
    message: 'UPI ID must be a valid format (e.g. user@bank)',
  })
  @IsOptional()
  upiId?: string;

  // Government Details
  @ApiPropertyOptional()
  @Matches(/^\d{12}$/, { message: 'Aadhaar number must be exactly 12 digits' })
  @IsOptional()
  aadhaarNumber?: string;

  @ApiPropertyOptional()
  @Matches(/^[A-Z]{5}\d{4}[A-Z]$/, {
    message:
      'PAN Card number must be a valid Indian PAN format (e.g. ABCDE1234F)',
  })
  @IsOptional()
  panNumber?: string;

  @ApiPropertyOptional()
  @Matches(/^[A-Z]{1}\d{7}$/, {
    message:
      'Passport number must be a valid Indian Passport format (e.g. Z1234567)',
  })
  @IsOptional()
  passportNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  drivingLicenseNumber?: string;
}
