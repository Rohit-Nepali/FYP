import winston from "winston";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ------ Get Dir name ------ 
const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);


// create log dir if it doesn't exist 
const logDir = path.join(_dirname, "../../logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

//define log formats 
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(
        (info) => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`
    )
)

const logger = winston.createLogger({
    level: "info",
    format: logFormat,
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.join(logDir, "error.log"), level: "error" }),
        new winston.transports.File({ filename: path.join(logDir, "info.log"), level: "info" }),
    ],
});

export default logger;