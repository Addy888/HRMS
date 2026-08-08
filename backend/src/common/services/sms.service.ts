import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly provider: string;
  private readonly apiKey: string;
  private readonly senderId: string;
  private readonly devMode: boolean;

  constructor(private configService: ConfigService) {
    this.provider = this.configService.get<string>('SMS_PROVIDER') || 'console';
    this.apiKey = this.configService.get<string>('SMS_API_KEY') || '';
    this.senderId = this.configService.get<string>('SMS_SENDER_ID') || 'FCSHRM';
    this.devMode = this.configService.get<string>('OTP_DEV_MODE') === 'true';
  }

  /**
   * Send OTP via SMS
   * In development mode, logs OTP to console
   * In production mode, integrates with actual SMS provider
   */
  async sendOtp(phoneNumber: string, otp: string): Promise<void> {
    try {
      // Development mode - log OTP to console
      if (this.devMode) {
        this.logger.warn('═══════════════════════════════════════════');
        this.logger.warn('🔐 DEVELOPMENT OTP (DO NOT USE IN PRODUCTION)');
        this.logger.warn(`   Mobile: ${phoneNumber}`);
        this.logger.warn(`   OTP: ${otp}`);
        this.logger.warn('═══════════════════════════════════════════');
        return;
      }

      // Production mode - send via SMS provider
      await this.sendViaSmsProvider(phoneNumber, otp);
    } catch (error: any) {
      this.logger.error(`Failed to send OTP to ${phoneNumber}: ${error.message}`);
      throw new Error('Failed to send OTP. Please try again.');
    }
  }

  /**
   * Send OTP via configured SMS provider
   * Add your SMS provider integration here (Twilio, AWS SNS, Fast2SMS, etc.)
   */
  private async sendViaSmsProvider(phoneNumber: string, otp: string): Promise<void> {
    const message = `Your FCS HRMS verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;

    switch (this.provider.toLowerCase()) {
      case 'twilio':
        await this.sendViaTwilio(phoneNumber, message);
        break;
      
      case 'aws-sns':
        await this.sendViaAwsSns(phoneNumber, message);
        break;
      
      case 'fast2sms':
        await this.sendViaFast2SMS(phoneNumber, message);
        break;

      case 'console':
      default:
        // Fallback to console logging if no provider configured
        this.logger.log(`[SMS] To: ${phoneNumber} | Message: ${message}`);
        break;
    }
  }

  /**
   * Twilio SMS integration
   */
  private async sendViaTwilio(phoneNumber: string, message: string): Promise<void> {
    // Example Twilio integration
    // Requires: npm install twilio
    // const twilio = require('twilio');
    // const client = twilio(accountSid, authToken);
    // await client.messages.create({
    //   body: message,
    //   from: this.senderId,
    //   to: phoneNumber
    // });
    
    throw new Error('Twilio SMS provider not configured. Please add Twilio credentials.');
  }

  /**
   * AWS SNS SMS integration
   */
  private async sendViaAwsSns(phoneNumber: string, message: string): Promise<void> {
    // Example AWS SNS integration
    // Requires: npm install @aws-sdk/client-sns
    // const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
    // const sns = new SNSClient({ region: 'us-east-1' });
    // await sns.send(new PublishCommand({
    //   Message: message,
    //   PhoneNumber: phoneNumber
    // }));
    
    throw new Error('AWS SNS SMS provider not configured. Please add AWS credentials.');
  }

  /**
   * Fast2SMS integration (India)
   */
  private async sendViaFast2SMS(phoneNumber: string, message: string): Promise<void> {
    // Example Fast2SMS integration
    // Requires: npm install axios
    // const axios = require('axios');
    // await axios.post('https://www.fast2sms.com/dev/bulkV2', {
    //   route: 'v3',
    //   sender_id: this.senderId,
    //   message: message,
    //   language: 'english',
    //   flash: 0,
    //   numbers: phoneNumber.replace('+91', '')
    // }, {
    //   headers: {
    //     'authorization': this.apiKey
    //   }
    // });
    
    throw new Error('Fast2SMS provider not configured. Please add Fast2SMS API key.');
  }

  /**
   * Mask phone number for display
   * Example: +919876543210 -> ******3210
   */
  maskPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber || phoneNumber.length < 4) {
      return '****';
    }
    const lastFour = phoneNumber.slice(-4);
    return `******${lastFour}`;
  }
}
