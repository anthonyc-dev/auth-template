import axios from "axios";

const BASE_URL = process.env.BASE_URL;
const API_KEY = process.env.API_KEY;
const DEVICE_ID = process.env.DEVICE_ID;

interface SendSMSOptions {
  phoneNumber: string;
  message: string;
}

interface SendBulkSMSOptions {
  recipients: string[];
  message: string;
}

/**
 * Send SMS to a single recipient
 * @param options - Phone number and message
 * @returns Promise with success status
 */
export const sendSMS = async (
  options: SendSMSOptions
): Promise<{ success: boolean; error?: string }> => {
  const { phoneNumber, message } = options;

  if (!phoneNumber || !message) {
    return {
      success: false,
      error: "Phone number and message are required",
    };
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/gateway/devices/${DEVICE_ID}/send-sms`,
      {
        recipients: [phoneNumber],
        message: message,
      },
      { headers: { "x-api-key": API_KEY } }
    );

    console.log(`✅ SMS sent to ${phoneNumber}`);
    return { success: true };
  } catch (error: any) {
    console.error(
      `❌ SMS Error for ${phoneNumber}:`,
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};

/**
 * Send SMS to multiple recipients
 * @param options - Array of phone numbers and message
 * @returns Promise with results summary
 */
export const sendBulkSMS = async (
  options: SendBulkSMSOptions
): Promise<{
  successCount: number;
  failureCount: number;
  total: number;
  errors: Array<{ phoneNumber: string; error: string }>;
}> => {
  const { recipients, message } = options;

  if (!recipients || recipients.length === 0) {
    return {
      successCount: 0,
      failureCount: 0,
      total: 0,
      errors: [],
    };
  }

  const results = {
    successCount: 0,
    failureCount: 0,
    total: recipients.length,
    errors: [] as Array<{ phoneNumber: string; error: string }>,
  };

  // Send SMS to all recipients
  const smsPromises = recipients.map(async (phoneNumber) => {
    const result = await sendSMS({ phoneNumber, message });
    if (result.success) {
      results.successCount++;
    } else {
      results.failureCount++;
      results.errors.push({
        phoneNumber,
        error: result.error || "Unknown error",
      });
    }
  });

  await Promise.allSettled(smsPromises);

  return results;
};
