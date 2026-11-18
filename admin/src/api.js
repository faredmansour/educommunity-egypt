import axios from "axios";

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(/\/+$/, "");
const http = axios.create({ baseURL: BASE_URL });
let refreshRequest;

function clearAdminSession() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_refresh_token");
  localStorage.removeItem("admin_user");
}

http.interceptors.request.use((config) => {
  // This client only reads admin credentials; student tokens are never sent.
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const body = error.response?.data;
    if (body?.message || body?.error) error.message = body.message || body.error;

    if (error.response?.status !== 401 || !original || original._retried || original.url?.includes("/auth/")) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("admin_refresh_token");
    if (!refreshToken) {
      clearAdminSession();
      if (window.location.pathname !== "/login") window.location.assign("/login");
      return Promise.reject(error);
    }

    original._retried = true;
    try {
      refreshRequest ||= axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      const response = await refreshRequest;
      const { token, refreshToken: nextRefreshToken, user } = response.data?.data || {};
      if (!token || !nextRefreshToken || user?.role !== "admin") {
        throw new Error("جلسة الأدمن غير صالحة");
      }

      localStorage.setItem("admin_token", token);
      localStorage.setItem("admin_refresh_token", nextRefreshToken);
      localStorage.setItem("admin_user", JSON.stringify(user));
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${token}`;
      return http(original);
    } catch (refreshError) {
      clearAdminSession();
      if (window.location.pathname !== "/login") window.location.assign("/login");
      return Promise.reject(refreshError);
    } finally {
      refreshRequest = undefined;
    }
  }
);

function unwrap(response) {
  const body = response.data || {};
  return { ...(body.data || {}), meta: body.meta, message: body.message };
}

export const api = {
  login: (body) => http.post("/auth/login", body).then(unwrap),
  getStats: () => http.get("/admin/stats").then(unwrap),
  getUsers: (params) => http.get("/admin/users", { params }).then(unwrap),
  deleteUser: (id) => http.delete(`/admin/users/${encodeURIComponent(id)}`).then(unwrap),
  getMaterials: () => http.get("/materials?limit=100").then(unwrap),
  getAllMaterials: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""));
    const query = new URLSearchParams(clean).toString();
    return http.get("/materials/all" + (query ? `?${query}` : "")).then(unwrap);
  },
  getPendingMaterials: () => http.get("/materials/pending").then(unwrap),
  approveMaterial: (id) => http.patch(`/materials/${encodeURIComponent(id)}/approve`).then(unwrap),
  deleteMaterial: (id) => http.delete(`/materials/${encodeURIComponent(id)}`).then(unwrap),
  getSubjects: (grade) => http.get("/subjects" + (grade ? `?grade=${encodeURIComponent(grade)}` : "")).then(unwrap),
  createMaterial: (formData) => http.post("/materials", formData).then(unwrap),
  getRewards: () => http.get("/rewards").then(unwrap),
  grantReward: (body) => http.post("/rewards", body).then(unwrap),
  getLessons: () => http.get("/lessons").then(unwrap),
  getChallenges: () => http.get("/challenges").then(unwrap),
  getPendingChallenges: () => http.get("/challenges/pending").then(unwrap),
  approveChallenge: (id) => http.patch(`/challenges/${encodeURIComponent(id)}/approve`).then(unwrap),
  rejectChallenge: (id) => http.patch(`/challenges/${encodeURIComponent(id)}/reject`).then(unwrap),
  getTasks: () => http.get("/soft-skills/tasks").then(unwrap),
  getAttendance: () => http.get("/attendance").then(unwrap),
  getShifts: () => http.get("/shifts").then(unwrap),
  createShift: (body) => http.post("/shifts", body).then(unwrap),
  deleteShift: (id) => http.delete(`/shifts/${encodeURIComponent(id)}`).then(unwrap),
};
