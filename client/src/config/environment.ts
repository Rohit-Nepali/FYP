const apiBase = process.env.EXPO_PUBLIC_API_URL ?? "https://464adf92395b.ngrok-free.app";

export const config = {
  API_BASE_URL: apiBase.replace(/\/+$/, "") + "/api",
};