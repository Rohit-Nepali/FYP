import { PrismaClient } from "../generated/prisma/client.js";
import logger from "./logger.js";

const prisma = new PrismaClient();

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("✅ DB connected successfully");
        logger.info("✅ DB connected successfully");
    } catch (error) {
        console.error("❌ DB connection failed:", error);
    }
}
export { prisma, connectDB }