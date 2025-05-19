import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import nodeMailer from 'nodemailer';
const prisma = new PrismaClient();
const router = express.Router();

router.use((req, res, next) => {
    const role = req.session.user.role;
    if (role !== 'ADMIN') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
});

// get settings
router.get('/', async (req, res) => {
    try {
        const settings = await prisma.settings.findMany();
        const jsonObj = {};
        for (const setting of settings) {
            // hide the smtp_pass and openai_key
            if (setting.key === 'smtp_pass') {
                setting.value = '********';
            }
            if (setting.key === 'openai_key') {
                setting.value = '********';
            }
            jsonObj[setting.key] = setting.value;
        }
        return res.status(200).json(jsonObj);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// update settings
const allowedKeys = [
    'notifications_enabled',
    'emails_enabled',
    'smtp_host',
    'smtp_port',
    'smtp_user',
    'smtp_pass',
    'smtp_from',
    'discord_enabled',
    'slack_enabled',
    'telegram_enabled',
    'discord_webhook',
    'slack_webhook',
    'telegram_bot_token',
    'telegram_chat_id',
    'ip_header',
    'ai_enabled',
    'openai_key'
];
router.put(
    '/', 
    body('notifications_enabled').isBoolean(),
    body('emails_enabled').isBoolean(),
    body('smtp_host').isString(),
    body('smtp_port').isInt(),
    body('smtp_user').isString(),
    body('smtp_pass').isString(),
    body('smtp_from').isEmail(),
    body('discord_enabled').isBoolean(),
    body('slack_enabled').isBoolean(),
    body('telegram_enabled').isBoolean(),
    body('discord_webhook').isURL(),
    body('slack_webhook').isURL(),
    body('telegram_bot_token').isString(),
    body('telegram_chat_id').isString(),
    body('ip_header').isString(),
    body('ai_enabled').isBoolean(),
    body('openai_key').isString(),
    async (req, res) => {
        // Validate the request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Update settings in the database
        try {
            const currentSettings = await prisma.settings.findMany();
            for (const setting of currentSettings) {
                if (!allowedKeys.includes(setting.key)) {
                    continue;
                }

                // if smtp_pass and openai_key == '********', then do not update
                if (setting.key === 'smtp_pass' && req.body[setting.key] === '********') {
                    continue;
                }
                if (setting.key === 'openai_key' && req.body[setting.key] === '********') {
                    continue;
                }

                await prisma.settings.update({
                    where: { key: setting.key },
                    data: {
                        value: req.body[setting.key],
                    }
                });
            }
            const updatedSettings = await prisma.settings.findMany();
            const jsonObj = {};
            for (const setting of updatedSettings) {
                // hide smtp_pass and openai_key
                if (setting.key === 'openai_key') {
                    setting.value = '********';
                }
                if (setting.key === 'smtp_pass') {
                    setting.value = '********';
                }
                jsonObj[setting.key] = setting.value;
            }
            
            return res.status(200).json(jsonObj);
        } catch (error) {
            console.error('Error updating settings:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);

// test smtp
router.post('/test-smtp', 
    body('smtp_host').isString(),
    body('smtp_port').isInt(),
    body('smtp_user').isString(),
    body('smtp_pass').isString(),
    body('smtp_from').isEmail(),
    async (req, res) => {

        // Validate the request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        var { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from } = req.body;
        if (smtp_pass === '********') {
            // get the smtp pass from the database
            const pass = await prisma.settings.findUnique({
                where: { key: 'smtp_pass' },
            });
            smtp_pass = pass.value;
        }

        try {
            const transporter = nodeMailer.createTransport({
                host: smtp_host,
                port: smtp_port,
                secure: smtp_port === 465, // true for 465, false for other ports
                auth: {
                    user: smtp_user,
                    pass: smtp_pass,
                },
            });

            const result = await transporter.verify();
            if (!result) {
                return res.status(500).json({ error: 'SMTP settings are invalid.' });
            }

            return res.status(200).json({ message: 'SMTP settings are valid.' });
        } catch (error) {
            console.error('Error testing SMTP settings:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
});

// test discord
router.post("/test-discord",
    body("discord_webhook").isURL(),
    async (req, res) => {
        // Validate the request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        var { discord_webhook } = req.body;

        try {
            const response = await fetch(discord_webhook, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ content: "Test message from the server." }),
            });

            if (!response.ok) {
                throw new Error("Failed to send test message.");
            }

            return res.status(200).json({ message: "Test message sent successfully." });
        } catch (error) {
            console.error("Error testing Discord webhook:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }
);

// test slack
router.post("/test-slack", 
    body("slack_webhook").isURL(),
    async (req, res) => {
        const { slack_webhook } = req.body;

        // Validate the request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const response = await fetch(slack_webhook, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text: "Test message from the server." }),
            });

            if (!response.ok) {
                throw new Error("Failed to send test message.");
            }

            return res.status(200).json({ message: "Test message sent successfully." });
        } catch (error) {
            console.error("Error testing Slack webhook:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }
);

// test telegram
router.post("/test-telegram", body("telegram_bot_token").isString(), body("telegram_chat_id").isString(), async (req, res) => {
    const { telegram_bot_token, telegram_chat_id } = req.body;

    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${telegram_bot_token}/sendMessage`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chat_id: telegram_chat_id,
                text: "Test message from the server.",
            }),
        });

        if (!response.ok) {
            if (response.status === 400) {
                return res.status(400).json({ error: "Response Status: 400" });
            }
            throw new Error("Failed to send test message.");
        }

        return res.status(200).json({ message: "Test message sent successfully." });
    } catch (error) {
        console.error("Error testing Telegram bot:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;