import axios from "axios";
import { supabase } from "./supabaseClient";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const client = axios.create({ baseURL });

client.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const api = {
  createScan: (formData) =>
    client.post("/api/scan", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  listProducts: (params) => client.get("/api/products", { params }),
  getScanDetail: (scanId) => client.get(`/api/products/${scanId}`),
  getDashboardStats: () => client.get("/api/products/dashboard/stats"),
  getRepeatOffenders: () => client.get("/api/products/companies/repeat-offenders"),
  pdfReportUrl: (scanId) => `${baseURL}/api/reports/${scanId}/pdf`,
  docxReportUrl: (scanId) => `${baseURL}/api/reports/${scanId}/docx`,
};

export default client;
