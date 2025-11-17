import axios from "axios";
import { Request, Response } from "express";

const BASE_URL = process.env.BASE_URL;
const API_KEY = process.env.API_KEY;
const DEVICE_ID = process.env.DEVICE_ID;

export const sendSMS = async (req: Request, res: Response) => {
  const { phoneNumber, message } = req.body;

  // Validate inputs
  if (!phoneNumber || !message) {
    res.status(400).json({ message: "Phone number and message are required" });
    return;
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
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error("TextBee API Error:", error.response?.data || error.message);
    res.status(500).json({
      message: "Failed to send SMS",
      error: error.response?.data || error.message,
    });
  }
};
