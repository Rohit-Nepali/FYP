const apiBase = process.env.EXPO_PUBLIC_API_URL ?? "https://awake-jaybird-neat.ngrok-free.app";
console.log(apiBase);

export const config = {
  API_BASE_URL: apiBase.replace(/\/+$/, "") + "/api",
};