import express from "express";
const router = express.Router();
import { PrismaClient } from "@prisma/client";
import generateReport from "../../helpers/generate-report.js";
const prisma = new PrismaClient();

// get alerts
router.get('/', async (req, res) => {
    // check if limit and offset are provided
    var limit = req.query.limit;
    var offset = req.query.offset;

    if (!limit || !offset) {
        return res.status(400).json({ message: 'Limit and offset are required' });
    }

    limit = parseInt(limit);
    offset = parseInt(offset);

    if (limit > 50){
        return res.status(400).json({ message: 'Limit cannot be greater than 50' });
    }

    try {
        const alertsTotalCount = await prisma.xSSAlert.count();
        const alerts = await prisma.xSSAlert.findMany({
            skip: parseInt(offset),
            take: parseInt(limit),
            select: {
                id: true,
                timestamp: true,
                userAgent: true,
                ip: true,
                document: {
                    select: {
                        URL: true
                    }
                }
            },
            orderBy: {
                id: 'desc'
            }
        });
        alerts.totalCount = alertsTotalCount;
        res.status(200).json({
            data: alerts,
            totalCount: alertsTotalCount
        });
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Something went wrong' });
    }
});

// get single alert
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const alert = await prisma.xSSAlert.findUnique({
            where: {
                id: parseInt(id)
            },
            select: {
                id: true,
                ip: true,
                timestamp: true,
                userAgent: true,
                cookies: true,
                document: true,
                location: true,
                timezone: true,
                timezoneName: true,
                currentTime: true,
                isInIframe: true,
                scripts: true,
                metaTags: true,
                DocumentSource: true,
                TrackingID: true,
                Report: true
            }
        });
        const containsScreenshot = await prisma.screenshot.count({
            where: {
                xssAlertId: parseInt(id)
            }
        });
        alert.containsScreenshot = containsScreenshot > 0;

        if (alert != null){
            res.status(200).json(alert);
        } else {
            res.status(404).json({
                message: "Invalid ID"
            })
        }

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Something went wrong' });
    }
})

// get screenshot of alert
router.get('/:id/screenshot', async (req, res) => {
    const { id } = req.params;
    try {
        const alert = await prisma.xSSAlert.findUnique({
            where: {
                id: parseInt(id)
            },
            select: {
                Screenshot: true
            }
        });

        if (alert == null){
            res.status(404).json({
                message: "Invalid ID"
            })
        } 

        res.setHeader('Content-Type', 'image/png');
        res.status(200).write(alert.Screenshot.data);
        res.end()

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Something went wrong' });
    }
})

// generate report for an alert
router.post("/:id/report", async (req, res) => {
    const { id } = req.params;
    const forceGenerate = Object.keys(req.query).includes("force");
    
    try {
        const alert = await prisma.xSSAlert.findUnique({
            where: {
                id: parseInt(id)
            },
            select: {
                id: true,
                Report: true
            }
        });

        if (alert == null){
            return res.status(404).json({
                message: "Invalid ID"
            })
        } 

        if (alert.Report == null || forceGenerate) {

            // check if ai is enabled
            const aiEnabled = await prisma.settings.findFirst({
                where: {
                    key: "ai_enabled"
                }
            });
            if (aiEnabled == null || aiEnabled.value == false){
                return res.status(400).json({
                    message: "AI is disabled"
                })
            }

            // if alert.Report exists, delete it
            if (alert.Report != null){
                await prisma.report.deleteMany({
                    where: {
                        alertId: alert.id
                    }
                });
            }

            const reportContent = await generateReport(alert.id);
            const newReport = await prisma.report.create({
                data: {
                    title: `${alert.id}-${new Date().toISOString()}`,
                    description: reportContent,
                    alert: {
                        connect: {
                            id: alert.id
                        }
                    }
                }
            });
            alert.Report = newReport;
        }

        return res.json({
            report: alert.Report,
        })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Something went wrong' });
    }
})

// delete alert
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {

        // delete foreign key references
        await prisma.document.deleteMany({
            where: {
                alertId: parseInt(id, 10)
            }
        });
        await prisma.location.deleteMany({
            where: {
                alertId: parseInt(id, 10)
            }
        });
        await prisma.permission.deleteMany({
            where: {
                alertId: parseInt(id, 10)
            }
        });
        await prisma.script.deleteMany({
            where: {
                alertId: parseInt(id, 10)
            }
        });
        await prisma.metaTag.deleteMany({
            where: {
                alertId: parseInt(id, 10)
            }
        });
        await prisma.documentSource.deleteMany({
            where: {
                alertId: parseInt(id, 10)
            }
        });
        await prisma.report.deleteMany({
            where: {
                alertId: parseInt(id, 10)
            }
        });

        // delete the alert
        const deletedAlert = await prisma.xSSAlert.delete({
            where: {
                id: parseInt(id, 10)
            }
        });
        res.status(200).json({ message: "Alert deleted successfully", alert: deletedAlert });
    } catch (err) {
        console.error(err)
        res.status(500).json({message: "Something went wrong"})
    }
})

export default router;