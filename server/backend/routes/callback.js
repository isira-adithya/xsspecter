import express from "express";
const router = express.Router();
import sendNotifications from "../helpers/send-notifications.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import ratelimit from "express-rate-limit";
import getCorrectIp from "../helpers/get-correct-ip.js";

const limiter = ratelimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 100 requests per windowMs
    keyGenerator: async (req) => {
        return await getCorrectIp(req);
    },
});

router.options('/', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).send();
});

router.post('/', limiter, async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Getting the correct IP
    var correctIp = await getCorrectIp(req);

    try {
        var trackingId = null;
        const alertData = req.body;
        const xssAlert = await prisma.xSSAlert.create({
            data: {
                timestamp: new Date(),
                userAgent: alertData.userAgent,
                cookies: alertData.cookies,
                timezone: alertData.timezone,
                timezoneName: alertData.timezoneName,
                currentTime: alertData.currentTime,
                isInIframe: alertData.isInIframe,
                ip: correctIp,

                document: {
                    create: {
                        title: alertData.document.title,
                        URL: alertData.document.URL,
                        domain: alertData.document.domain,
                        referrer: alertData.document.referrer,
                        lastModified: alertData.document.lastModified,
                        readyState: alertData.document.readyState,
                        characterSet: alertData.document.characterSet,
                        contentType: alertData.document.contentType,
                        designMode: alertData.document.designMode,
                        children: alertData.document.children,
                    },
                },

                location: {
                    create: {
                        href: alertData.location.href,
                        protocol: alertData.location.protocol,
                        host: alertData.location.host,
                        hostname: alertData.location.hostname,
                        port: alertData.location.port,
                        pathname: alertData.location.pathname,
                        search: alertData.location.search,
                        hash: alertData.location.hash,
                        origin: alertData.location.origin,
                    },
                },

                permissions: {
                    create: Object.entries(alertData.permissions).map(([name, status]) => ({
                        name: name,
                        status: status,
                    })),
                },

                scripts: {
                    create: alertData.scripts.map(script => ({
                        src: script.src,
                        type: script.type,
                        async: script.async,
                        defer: script.defer,
                    })),
                },

                metaTags: {
                    create: alertData.metaTags.map(meta => ({
                        name: meta.name,
                        content: meta.content,
                        httpEquiv: meta.httpEquiv,
                        property: meta.property,
                    })),
                },

                DocumentSource: {
                    create: {
                        document: alertData.documentSource,
                    },
                }
            },
        });

        // Store the screenshot
        // remove data:image/png;base64, from the screenshot string
        alertData.screenshot = alertData.screenshot.replace(/^data:image\/png;base64,/, '');
        const screenshot_name = `${alertData.document.URL.replace(/[^a-zA-Z]/g, "_")}-${new Date().toISOString()}.png`;
        const screenshot = await prisma.screenshot.create({
            data: {
                XSSAlert: {
                    connect: {
                        id: xssAlert.id
                    }
                },
                data: Buffer.from(alertData.screenshot, 'base64'),
                name: screenshot_name
            },
        });

        if (alertData.uniqueIdentifier !== "null") {
            // Check if the uniqueIdentifier is present in TrackingID model
            trackingId = await prisma.trackingID.findFirst({
                where: {
                    trackingId: alertData.uniqueIdentifier,
                },
            });
        }

        if (trackingId) {
            // Update the trackingId with the xSSAlert ID
            await prisma.xSSAlert.update({
                where: {
                    id: xssAlert.id,
                },
                data: {
                    TrackingID: {
                        connect: {
                            id: trackingId.id,
                        },
                    },
                },
            })
        }

        // Send notifications
        try {
            sendNotifications(xssAlert.id);
        } catch (error) {
            console.error('Error sending notifications:', error);
        }

        console.log(`Successfully stored data from ${alertData.document.URL} - ${alertData.userAgent}`)
        res.status(200).send();
    } catch (error) {
        console.error('Error storing data:', error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;