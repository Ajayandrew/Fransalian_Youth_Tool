const axios = require('axios');
const memoryStore = require('../store/memoryStore');
const Settings = require('../models/Settings');
const { getIsInMemory } = require('../config/db');

/**
 * Fetch current settings (API keys)
 */
const getActiveSettings = async () => {
  if (getIsInMemory()) {
    return memoryStore.settings || {};
  }
  try {
    const settings = await Settings.findById('org_settings').lean();
    return settings || memoryStore.settings || {};
  } catch (err) {
    return memoryStore.settings || {};
  }
};

/**
 * Clean and format 10-digit Indian mobile number
 */
const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  const digits = phone.toString().replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
};

/**
 * Generate standard SMS receipt text (concise for SMS character limits)
 */
const generateSmsReceiptText = (memberName, months, amount, paymentMode) => {
  const monthsText = Array.isArray(months) ? months.join(', ') : months;
  return `FRANSALIAN YOUTH: Dear ${memberName}, your Rs.${amount} Youth Subscription for ${monthsText} (${paymentMode || 'Cash'}) has been received. Status: PAID. Thank you!`;
};

/**
 * Dispatch SMS via Fast2SMS
 */
const sendFast2SMS = async (apiKey, phoneNumber, message) => {
  const url = 'https://www.fast2sms.com/dev/bulkV2';
  const payload = {
    route: 'q',
    message: message,
    language: 'english',
    flash: 0,
    numbers: phoneNumber
  };

  const response = await axios.post(url, payload, {
    headers: {
      'authorization': apiKey.trim(),
      'Content-Type': 'application/json'
    },
    timeout: 10000
  });

  if (response.data && (response.data.return === true || response.data.status_code === 200)) {
    return {
      success: true,
      provider: 'Fast2SMS',
      data: response.data,
      message: `SMS delivered successfully via Fast2SMS to +91 ${phoneNumber}`
    };
  }

  throw new Error(response.data?.message?.[0] || response.data?.message || 'Fast2SMS API returned an error.');
};

/**
 * Dispatch SMS via Twilio
 */
const sendTwilioSMS = async (accountSid, authToken, fromNumber, toNumber, message) => {
  const formattedTo = toNumber.startsWith('+') ? toNumber : `+91${toNumber}`;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const params = new URLSearchParams();
  params.append('To', formattedTo);
  params.append('From', fromNumber);
  params.append('Body', message);

  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const response = await axios.post(url, params.toString(), {
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    timeout: 10000
  });

  if (response.data && response.data.sid) {
    return {
      success: true,
      provider: 'Twilio',
      sid: response.data.sid,
      message: `SMS delivered successfully via Twilio to ${formattedTo}`
    };
  }

  throw new Error('Twilio API failed to dispatch SMS.');
};

/**
 * Main dispatch function for Subscription Payment Receipt SMS
 */
const dispatchSubscriptionReceiptSMS = async ({ memberName, phone, months, amount, paymentMode }) => {
  const settings = await getActiveSettings();
  const cleanPhone = cleanPhoneNumber(phone);

  if (!cleanPhone || cleanPhone.length < 10) {
    return {
      success: false,
      message: `Cannot send SMS: Member (${memberName}) does not have a valid 10-digit mobile number.`
    };
  }

  const messageText = generateSmsReceiptText(memberName, months, amount, paymentMode);
  const apiKey = (settings.fast2smsApiKey || process.env.FAST2SMS_API_KEY || '').trim();
  const twilioSid = (settings.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID || '').trim();
  const twilioAuth = (settings.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN || '').trim();
  const twilioFrom = (settings.twilioPhoneNumber || process.env.TWILIO_PHONE_NUMBER || '').trim();

  // Try Fast2SMS first if configured
  if (apiKey) {
    try {
      const result = await sendFast2SMS(apiKey, cleanPhone, messageText);
      return result;
    } catch (err) {
      console.error('Fast2SMS dispatch error:', err.response?.data || err.message);
      return {
        success: false,
        provider: 'Fast2SMS',
        message: `Fast2SMS Error: ${err.response?.data?.message?.[0] || err.message}`
      };
    }
  }

  // Try Twilio if configured
  if (twilioSid && twilioAuth && twilioFrom) {
    try {
      const result = await sendTwilioSMS(twilioSid, twilioAuth, twilioFrom, cleanPhone, messageText);
      return result;
    } catch (err) {
      console.error('Twilio dispatch error:', err.response?.data || err.message);
      return {
        success: false,
        provider: 'Twilio',
        message: `Twilio Error: ${err.response?.data?.message || err.message}`
      };
    }
  }

  // If no API keys are configured yet
  return {
    success: false,
    isUnconfigured: true,
    message: 'SMS Gateway not configured yet. Please enter your Fast2SMS or Twilio API Key in Settings to enable automated SMS sending.'
  };
};

/**
 * Send a Test SMS to verify configuration
 */
const sendTestSMS = async (testPhone) => {
  const cleanPhone = cleanPhoneNumber(testPhone);
  if (!cleanPhone || cleanPhone.length < 10) {
    return { success: false, message: 'Please provide a valid 10-digit mobile number to test.' };
  }

  const testMessage = `FRANSALIAN YOUTH: Test SMS Gateway connection successful! Date: ${new Date().toLocaleTimeString()}`;
  const settings = await getActiveSettings();
  const apiKey = (settings.fast2smsApiKey || process.env.FAST2SMS_API_KEY || '').trim();

  if (!apiKey) {
    return {
      success: false,
      isUnconfigured: true,
      message: 'Fast2SMS API Key is empty. Please enter an API key and click Save Settings first.'
    };
  }

  try {
    const result = await sendFast2SMS(apiKey, cleanPhone, testMessage);
    return result;
  } catch (err) {
    return {
      success: false,
      message: `Test Failed: ${err.response?.data?.message?.[0] || err.message}`
    };
  }
};

module.exports = {
  cleanPhoneNumber,
  generateSmsReceiptText,
  dispatchSubscriptionReceiptSMS,
  sendTestSMS
};
