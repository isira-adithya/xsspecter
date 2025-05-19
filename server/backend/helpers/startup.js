import { PrismaClient, UserRole } from "@prisma/client";
import { readFileSync } from "fs";
import crypto from "crypto";
const prisma = new PrismaClient();
import * as argon2 from "argon2";

const SETTINGS = {
    // notifications
    notifications_enabled: false,

    // smtp
    emails_enabled: false,
    smtp_host: "smtp.example.com",
    smtp_port: 587,
    smtp_user: "",
    smtp_pass: "",
    smtp_from: "xsspecter@example.com",

    // discord,slack,telegram
    discord_enabled: false,
    slack_enabled: false,
    telegram_enabled: false,

    // webhooks
    discord_webhook: "https://discord.com/api/webhooks/<ID>/<TOKEN>",
    slack_webhook: "https://hooks.slack.com/services/**/**/**",
    telegram_bot_token: "",
    telegram_chat_id: "",

    // ip identification
    ip_header: "X-Forwarded-For",

    // ai
    ai_enabled: false,
    openai_key: "",
}

async function ensureSettings() {
    // Create settings keys if not set
    for (const key in SETTINGS) {
        const setting = await prisma.settings.findUnique({
            where: { key: key }
        });
        if (!setting) {
            await prisma.settings.create({
                data: {
                    key: key,
                    value: SETTINGS[key],
                },
            });
        }
    }
}

async function configureAdmin(){
    // Check if there is atleast one admin account present in the database
    const adminCount = await prisma.user.count({
        where: {
            role: UserRole.ADMIN
        }
    });
    if (adminCount > 0) {
        return;
    } else {

        var password = null;
        // if process.env.ADMIN_PASS_FILE is set, load it from process.env.ADMIN_PASS_FILE
        if (!process.env.ADMIN_PASS_FILE) {
            console.log(`Admin password file not set. Generating a new random password.`);
        }
        else {
            console.log(`Loading admin password from ${process.env.ADMIN_PASS_FILE}`);
            password = readFileSync(process.env.ADMIN_PASS_FILE, "utf8").trim();
        }


        // Create a new admin account
        const username = "admin";
        if (!password) {
            password = crypto.randomBytes(16).toString("hex");
            console.log(`[LOG] Admin account password: ${password}`);
        }
        
        // Hash the password using argon2
        const hashedPassword = await argon2.hash(password, {
            timeCost: 5,
        });
        // Create the user in the database
        const newUser = await prisma.user.create({
            data: {
                username: username,
                password: hashedPassword,
                role: UserRole.ADMIN,
            },
        });
    }
}

async function checkStartup(){
    await ensureSettings();
    await configureAdmin();
    console.log("[LOG] Startup checks completed.");
}

export default checkStartup;