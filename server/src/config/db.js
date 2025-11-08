import { PrismaClient } from "../generated/prisma/client.js";
import logger from "./logger.js";

const prisma = new PrismaClient();

const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info("✅ DB connected successfully");
  } catch (error) {
    prisma.$disconnect();
    console.error("❌ DB connection failed:", error);
  }
};
export { prisma, connectDB };
