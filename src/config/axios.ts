import axios from "axios";

const BASE_URL = process.env.DATA_INTIGRATION_API;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export default axiosInstance;
