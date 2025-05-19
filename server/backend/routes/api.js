import express from "express";
import expressSession from "express-session";
import { PrismaClient } from "@prisma/client";
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { readFileSync } from "fs";
const router = express.Router();

// If process.env.SESSION_SECRET is not set, load it from process.env.SESSION_SECRET_FILE
if (!process.env.SESSION_SECRET) {
    if (!process.env.SESSION_SECRET_FILE) {
        throw new Error("SESSION_SECRET_FILE is not set");
    }
    console.log(`Loading SESSION_SECRET from ${process.env.SESSION_SECRET_FILE}`);
    process.env.SESSION_SECRET = readFileSync(process.env.SESSION_SECRET_FILE, "utf8").trim();
}

// Session Handler
router.use(
    expressSession({
        cookie: {
         maxAge: 7 * 24 * 60 * 60 * 1000, // ms
         httpOnly: true,
         sameSite: 'strict',
        },
        secret: process.env.SESSION_SECRET,
        resave: true,
        saveUninitialized: false,
        store: new PrismaSessionStore(
          new PrismaClient(),
          {
            checkPeriod: 60 * 1000,  //ms
            dbRecordIdIsSessionId: true,
            dbRecordIdFunction: undefined,
          }
        )
      })
);

// middlewares
import checkAuth from "../middlewares/auth.js";
router.use(checkAuth);

// routes
import alertsRouter from "./api-routes/alerts.js";
import usersRouter from "./api-routes/users.js";
import statsRouter from "./api-routes/stats.js";
import cliRouter from "./api-routes/cli.js";
import settingsRouter from "./api-routes/settings.js";

// mount routes
router.use("/alerts", alertsRouter);
router.use("/users", usersRouter);
router.use("/stats", statsRouter);
router.use("/cli", cliRouter);
router.use("/settings", settingsRouter);

export default router;