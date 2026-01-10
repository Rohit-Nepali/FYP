const apiBase = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000";
console.log(apiBase);

export const config = {
  API_BASE_URL: apiBase.replace(/\/+$/, "") + "/api",
};