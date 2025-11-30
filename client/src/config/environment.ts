const apiBase = process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.1.81:5000";
console.log(apiBase);

export const config = {
  API_BASE_URL: apiBase.replace(/\/+$/, "") + "/api",
};
