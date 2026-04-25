import os from "os";

const DEFAULT_FRONTEND_PORT = process.env.FRONTEND_PORT || 8081;

const isPrivateIPv4 = (address) => {
  if (!address) {
    return false;
  }

  return (
    address.startsWith("10.") ||
    address.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(address)
  );
};

export const getLanIPv4Address = () => {
  const interfaces = os.networkInterfaces();
  const addresses = Object.values(interfaces).flatMap((networkInterface) => networkInterface || []);

  const preferredAddress = addresses.find(
    (address) =>
      address &&
      address.family === "IPv4" &&
      !address.internal &&
      isPrivateIPv4(address.address)
  );

  if (preferredAddress) {
    return preferredAddress.address;
  }

  const anyExternalAddress = addresses.find(
    (address) => address && address.family === "IPv4" && !address.internal
  );

  return anyExternalAddress?.address || "127.0.0.1";
};

export const getFrontendBaseUrl = () => {
  // Prefer the invite-specific base URL when configured.
  const configuredFrontendUrl =
    process.env.INVITE_WEB_BASE_URL?.trim().replace(/\/+$/, "") ||
    process.env.FRONTEND_URL?.trim().replace(/\/+$/, "");

  if (configuredFrontendUrl) {
    return configuredFrontendUrl;
  }

  const lanAddress = getLanIPv4Address();
  return `http://${lanAddress}:${DEFAULT_FRONTEND_PORT}`;
};