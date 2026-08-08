# OTP-Based Mobile Verification Implementation Guide

## Overview
This document describes the OTP-based mobile verification system implemented for Employee authentication in the FCS HRMS application.

## Features Implemented

### ✅ Employee Login with OTP
1. Employee enters email and password
2. If credentials are valid, OTP is sent to registered mobile number
3. Employee enters 6-digit OTP
4. After successful OTP verification, employee gains access to dashboard
5. HR/Admin login continues to work without OTP

### ✅ Employee Password Reset with OTP
1. Employee enters registered email
2. OTP is sent to registered mobile number
3. Employee enters 6-digit OTP
4. After successful OTP verification, employee can set new password
5. HR/Admin password reset continues to use token-based system

## Files Changed/Created

### Backend Files

#### Created:
1. `backend/src/common/services/sms.service.ts` - SMS provider abstraction
2. `backend/src/common/services/otp.service.ts` - OTP generation, verification, and management
3. `backend/src/modules/auth/dto/otp.dto.ts` - OTP-related DTOs

#### Modified:
1. `backend/src/modules/auth/auth.service.ts` - Added OTP verification to login and password reset flows
2. `backend/src/modules/auth/auth.controller.ts` - Added OTP endpoints
3. `backend/src/modules/auth/auth.module.ts` - Registered OTP and SMS services
4. `backend/.env.example` - Added SMS/OTP configuration variables

### Frontend Files

#### Created:
1. `frontend/src/components/auth/OtpVerification.tsx` - Reusable OTP verification component

#### Modified:
1. `frontend/src/app/login/employee/page.tsx` - Integrated OTP verification flow
2. `frontend/src/app/forgot-password/page.tsx` - Added OTP verification for employees
3. `frontend/src/app/reset-password/page.tsx` - Updated to handle OTP-based reset tokens

### Database Migration:
1. `backend/prisma/migrations/20260808102317_add_otp_verification/migration.sql`

**Note:** The `OtpVerification` model already exists in `schema.prisma`, so no database changes are required if you've already run previous migrations.

## API Endpoints

### Employee Login with OTP
```
POST /api/v1/auth/login
POST /api/v1/auth/verify-otp
POST /api/v1/auth/resend-otp
```

### Employee Password Reset with OTP
```
POST /api/v1/auth/forgot-password
POST /api/v1/auth/verify-reset-otp
POST /api/v1/auth/resend-reset-otp
POST /api/v1/auth/reset-password
```

## Environment Variables Required

Add these to your `.env` file:

```env
# SMS/OTP Configuration
# SMS_PROVIDER options: console, twilio, aws-sns, fast2sms
SMS_PROVIDER=console
SMS_API_KEY=your-sms-provider-api-key-here
SMS_SENDER_ID=FCSHRM

# OTP Development Mode (NEVER use in production!)
# When set to true, OTP will be logged to console instead of sending SMS
OTP_DEV_MODE=true
```

## SMS Provider Configuration

The system supports multiple SMS providers. Currently configured providers:

### 1. Console (Development Only)
- **Provider:** `console`
- **Setup:** No setup required
- **Usage:** OTPs are logged to console (when `OTP_DEV_MODE=true`)

### 2. Twilio
- **Provider:** `twilio`
- **Setup:** 
  1. Install: `npm install twilio`
  2. Set `SMS_PROVIDER=twilio`
  3. Set `SMS_API_KEY=your_twilio_auth_token`
  4. Set `SMS_SENDER_ID=your_twilio_phone_number`
  5. Update `sendViaTwilio()` method in `sms.service.ts` with your Account SID

### 3. AWS SNS
- **Provider:** `aws-sns`
- **Setup:**
  1. Install: `npm install @aws-sdk/client-sns`
  2. Set `SMS_PROVIDER=aws-sns`
  3. Configure AWS credentials
  4. Update `sendViaAwsSns()` method in `sms.service.ts` with your AWS region

### 4. Fast2SMS (India)
- **Provider:** `fast2sms`
- **Setup:**
  1. Install: `npm install axios` (if not already installed)
  2. Set `SMS_PROVIDER=fast2sms`
  3. Set `SMS_API_KEY=your_fast2sms_api_key`
  4. Set `SMS_SENDER_ID=your_sender_id`
  5. Update `sendViaFast2SMS()` method in `sms.service.ts`

## Setup Instructions

### 1. Database Migration
```bash
cd backend
npx prisma migrate dev
# or
npx prisma db push
```

### 2. Install Dependencies
```bash
# Backend - already installed
cd backend
npm install

# Frontend - already installed
cd frontend
npm install
```

### 3. Configure Environment Variables
Copy the values from `.env.example` to your `.env` file and configure:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set:
```env
OTP_DEV_MODE=true          # For development
SMS_PROVIDER=console       # For development
```

### 4. Start the Application
```bash
# Backend
cd backend
npm run start:dev

# Frontend
cd frontend
npm run dev
```

## Testing Instructions

### Test Scenario 1: Employee Login with OTP
1. Navigate to http://localhost:3000/login
2. Click "Employee Self-Service"
3. Enter employee credentials:
   - Email: any employee email
   - Password: their password
4. Click "Sign In as Employee"
5. **Check backend terminal** - you should see the OTP printed (in development mode)
6. Enter the 6-digit OTP from the terminal
7. Click "Verify OTP"
8. You should be redirected to the Employee Dashboard

### Test Scenario 2: Wrong OTP
1. Follow steps 1-5 from Test Scenario 1
2. Enter an incorrect OTP (e.g., 123456)
3. You should see an error message showing remaining attempts

### Test Scenario 3: Resend OTP
1. Follow steps 1-5 from Test Scenario 1
2. Click "Resend OTP"
3. Wait for the 60-second cooldown
4. Click "Resend OTP" again
5. **Check backend terminal** for the new OTP
6. The old OTP should no longer work

### Test Scenario 4: Employee Password Reset with OTP
1. Navigate to http://localhost:3000/forgot-password
2. Enter employee email
3. Click "Request Password Reset"
4. **Check backend terminal** for the OTP
5. Enter the 6-digit OTP
6. Click "Verify OTP"
7. You should be redirected to reset password page
8. Enter new password twice
9. Click "Save New Password"
10. Login again with new password (OTP will be required again)

### Test Scenario 5: HR Login (No OTP Required)
1. Navigate to http://localhost:3000/login
2. Click "HR Administrator"
3. Enter HR credentials:
   - Email: adityashastri76@gmail.com
   - Password: 12345678
4. Click "Sign In as HR"
5. You should be logged in directly **without OTP verification**

### Test Scenario 6: Employee without Phone Number
1. Create a test employee without a phone number in the database
2. Try to login with that employee's credentials
3. You should see an error: "Your account does not have a registered mobile number"

### Test Scenario 7: Expired OTP
1. Start employee login process
2. Wait for 6+ minutes (OTP expires after 5 minutes)
3. Try to verify the OTP
4. You should see "OTP has expired" error

### Test Scenario 8: Max Attempts Exceeded
1. Start employee login process
2. Enter wrong OTP 5 times
3. On the 5th attempt, you should see "Maximum attempts exceeded" error
4. Request a new OTP to continue

## Security Features

### ✅ Implemented Security Measures:
1. **OTP Hashing** - OTPs are stored as bcrypt hashes, never in plain text
2. **Expiration** - OTPs expire after 5 minutes
3. **One-Time Use** - Each OTP can only be used once
4. **Attempt Limiting** - Maximum 5 verification attempts per OTP
5. **Resend Cooldown** - 60-second cooldown between OTP resends
6. **Auto-Invalidation** - Previous OTPs are invalidated when new OTP is generated
7. **Secure Random Generation** - OTPs are generated using crypto.randomInt()
8. **No OTP Exposure** - OTPs are never returned in API responses
9. **No Console Logging in Production** - OTPs are only logged when `OTP_DEV_MODE=true`
10. **Short-Lived Reset Tokens** - Password reset tokens expire in 10 minutes after OTP verification

## Architecture Decisions

### Why Separate OTP Service?
- **Single Responsibility**: OTP logic is isolated from auth logic
- **Reusability**: Can be used for other features (e.g., 2FA, email verification)
- **Testability**: Easy to unit test OTP generation and verification

### Why Separate SMS Service?
- **Provider Abstraction**: Easy to switch between SMS providers
- **Environment-Based**: Different providers for dev/staging/production
- **Extensibility**: Easy to add new SMS providers

### Why Store OTP Hash Instead of Plain Text?
- **Security**: Even if database is compromised, OTPs cannot be used
- **Compliance**: Follows security best practices
- **Consistency**: Matches password storage strategy

### Why Use Existing OtpVerification Table?
- **Schema Consistency**: Table already existed in schema.prisma
- **No Breaking Changes**: No database migration required
- **Clean Architecture**: Follows existing database design patterns

## Known Limitations

1. **SMS Provider Integration**: Currently set to console mode for development. Production deployment requires configuring a real SMS provider.

2. **International Phone Numbers**: Phone number validation is basic. May need enhancement for international numbers.

3. **Rate Limiting**: No global rate limiting on OTP generation endpoints. Consider adding rate limiting in production.

4. **Audit Trail**: OTP verification is logged in audit logs, but could be enhanced with more detailed tracking.

## Production Deployment Checklist

### Before Deploying to Production:

- [ ] Set `OTP_DEV_MODE=false` in production environment
- [ ] Configure a real SMS provider (Twilio, AWS SNS, or Fast2SMS)
- [ ] Set strong `SMS_API_KEY` credentials
- [ ] Test SMS delivery with real phone numbers
- [ ] Enable rate limiting on OTP endpoints
- [ ] Set up monitoring for SMS delivery failures
- [ ] Configure SMS provider fallbacks for high availability
- [ ] Test OTP flow with different phone number formats
- [ ] Review and update SMS message templates
- [ ] Enable audit logging for OTP operations
- [ ] Test all error scenarios in production environment
- [ ] Document SMS provider costs and quotas
- [ ] Set up alerts for failed OTP delivery
- [ ] Review security policies and compliance requirements

## Troubleshooting

### Issue: "User or phone number not found"
**Solution:** Ensure the employee has a phone number registered in their profile.

### Issue: "Maximum OTP verification attempts exceeded"
**Solution:** Request a new OTP using the "Resend OTP" button.

### Issue: "Please wait X seconds before requesting a new OTP"
**Solution:** Wait for the cooldown period to expire (60 seconds).

### Issue: OTP not received in development
**Solution:** Check the backend terminal/console logs. When `OTP_DEV_MODE=true`, OTPs are printed to the console.

### Issue: "Reset token is invalid, expired, or already used"
**Solution:** Request a new password reset. Reset tokens expire after 10 minutes.

### Issue: HR login asking for OTP
**Solution:** OTP is only required for EMPLOYEE role. Ensure the user's role is set to 'HR' or 'ADMIN' in the database.

## Support

For issues or questions:
1. Check this documentation first
2. Review the test scenarios above
3. Check backend console logs for OTP values (in development)
4. Verify database has OtpVerification records
5. Ensure employee has a valid phone number

## Future Enhancements

Potential improvements for future versions:
1. SMS delivery status tracking
2. Support for email OTP as alternative
3. Biometric authentication support
4. Remember device feature (skip OTP for trusted devices)
5. Multi-factor authentication (MFA) settings
6. OTP analytics dashboard
7. Customizable OTP expiry times per user/role
8. WhatsApp/Telegram OTP delivery
9. Voice call OTP delivery
10. Internationalization for SMS messages
