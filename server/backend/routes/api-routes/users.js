import express from "express";
import { PrismaClient } from "@prisma/client";
import {body, validationResult} from "express-validator";
import crypto from "crypto";
import * as argon2 from "argon2";
const router = express.Router();
const prisma = new PrismaClient();
import rateLimit from "express-rate-limit";
import getCorrectIp from "../../helpers/get-correct-ip.js";

// admin priv check middleware
const adminCheck = (req, res, next) => {
    const user = req.session.user;
    if (!user || user.role !== "ADMIN") {
        return res.status(401).json({ message: "Permission denied" });
    }
    next();
}

const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 5 requests per windowMs
    message: "Too many login attempts, please try again later.",
    keyGenerator: async (req) => {
        return await getCorrectIp(req);
    },
});

router.post("/login", loginLimiter, 
    body("username").isString().notEmpty().withMessage("Username is required"),
    body("password").isString().notEmpty().withMessage("Password is required"),
    async (req, res) => {

        // Validate request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;
        try {
            const user = await prisma.user.findUnique({
                where: {
                    username: username,
                },
            });
            if (!user) {
                return res.status(403).json({ message: "Invalid credentials" });
            }
            const isPasswordValid = await argon2.verify(user.password, password)
            if (!isPasswordValid) {
                return res.status(403).json({ message: "Invalid credentials" });
            }

            // Check if user is active
            if (!user.isActive) {
                return res.status(403).json({ message: "User is disabled" });
            }

            req.session.isLoggedIn = true;
            req.session.user = user;
            req.session.user.lastUpdatedDB = new Date();
            req.session.user.lastLogin = new Date();
            
            // Remove password from user object
            delete req.session.user.password; 

            // update lastLoggedIn 
            await prisma.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    lastLogin: new Date(),
                },
            });

            res.status(200).json({ message: "Login successful", user: req.session.user });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Something went wrong" });
        }
});

// Userdata retrieval
router.get("/me", async (req, res) => {
    const user = req.session.user;
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(req.session.user);
});

// update account
router.put("/me", 
    body("email").isEmail().withMessage("Invalid email format"),
    body("firstName").isString().notEmpty().withMessage("First name is required"),
    body("lastName").isString().notEmpty().withMessage("Last name is required"),
    body("isActive").isBoolean().withMessage("isActive must be a boolean"),
    body("isNotificationsEnabled").isBoolean().withMessage("isNotificationsEnabled must be a boolean"),
    body("role").isString().notEmpty().custom((role) => {
        const validRoles = ["ADMIN", "USER", "VIEWER"];
        if (!validRoles.includes(role)) {
            throw new Error(`Role must be one of: ${validRoles.join(", ")}`);
        }
        return true;
    }).withMessage("Role is required"),
    async (req, res) => {
        const { email, firstName, lastName, isActive, isNotificationsEnabled, role } = req.body;
        const currentUser = req.session.user;

        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (currentUser.role !== "ADMIN" && role !== currentUser.role) {
            return res.status(401).json({ message: "Permission denied" });
        }
        
        const result = await prisma.user.update({
            where: {
                id: currentUser.id,
            },
            data: {
                email,
                firstName,
                lastName,
                isNotificationsEnabled,
                isActive: currentUser.role === "ADMIN" ? isActive : currentUser.isActive,
                role: currentUser.role === "ADMIN" ? role : currentUser.role
            },
        })

        if (!result) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update session user data
        req.session.user = {
            ...req.session.user,
            email,
            firstName,
            lastName,
            isNotificationsEnabled,
            isActive: currentUser.role === "ADMIN" ? isActive : currentUser.isActive,
            role: currentUser.role === "ADMIN" ? role : currentUser.role
        };

        
        // Remove password from user object
        delete req.session.user.password;
        res.status(200).json({ message: "User updated successfully" });
    }
);

// change pass
router.post("/change-password",
    body("oldPassword").isString().notEmpty().withMessage("Old password is required"),
    body("newPassword").isString().notEmpty().withMessage("New password is required"),
    async (req, res) => {

        // Validate request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { oldPassword, newPassword } = req.body;
        const currentUser = req.session.user;

        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: currentUser.id,
            },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isOldPasswordValid = await argon2.verify(user.password, oldPassword);
        if (!isOldPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const hashedNewPassword = await argon2.hash(newPassword);

        await prisma.user.update({
            where: {
                id: currentUser.id,
            },
            data: {
                password: hashedNewPassword,
            },
        });

        res.status(200).json({ message: "Password changed successfully" });
    }
)

// generate token
router.post("/generate-token", async (req, res) => {
    const user = req.session.user;
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    // Generate a token for the user
    const token = crypto.randomBytes(16).toString("hex");
    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            apiToken: token,
        },
    });
    // Update session user data
    req.session.user.apiToken = token;

    res.status(200).json({ apiToken: token });
});

// logout
router.delete("/logout", async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Something went wrong" });
        }
        res.status(200).json({ message: "Logout successful" });
    });
});

// delete
router.delete("/me", async (req, res) => {
    const user = req.session.user;
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // default 'admin' user cannot be deleted
    if (user.username === "admin") {
        return res.status(401).json({ message: "Default admin user cannot be deleted" });
    }

    const result = await prisma.user.delete({
        where: {
            id: user.id,
        },
    });

    if (!result) {
        return res.status(404).json({ message: "User not found" });
    }

    try {
        await req.session.destroy();
    } catch (e) {   
        return res.status(500).json({ message: "Something went wrong" });
    }

    res.status(200).json({ message: "Account deleted successfully" });
});

// admin endpoints

// Users 

// create user
router.post("/", 
    adminCheck, 
    body("username").isString().notEmpty().withMessage("Username is required"),
    body("password").isString().notEmpty().withMessage("Password is required"),
    body("email").isEmail().withMessage("Invalid email format"),
    body("firstName").isString().notEmpty().withMessage("First name is required"),
    body("lastName").isString().notEmpty().withMessage("Last name is required"),
    async (req, res) => {
    const { username, password, email, firstName, lastName } = req.body;

    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: {
            username: username,
        },
    });

    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await argon2.hash(password, {
        timeCost: 5,
    });

    const user = await prisma.user.create({
        data: {
            username,
            password: hashedPassword,
            email,
            firstName,
            lastName,
            role: "USER",
            isActive: true,
            isNotificationsEnabled: true,
        },
    });

    res.status(201).json({ message: "User created successfully" });
});

// get users
router.get("/", adminCheck, async (req, res) => {
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

    const users = await prisma.user.findMany({
        skip: parseInt(offset),
        take: parseInt(limit),
        select: {
            id: true,
            username: true,
            email: true,
            isActive: true,
            role: true,
            lastLogin: true,
        },
        orderBy: {
            id: 'desc'
        }
    });
    if (!users) {
        return res.status(404).json({ message: "No users found" });
    }
    res.status(200).json(users);
});

// delete route admin
router.delete("/:id", adminCheck, async (req, res) => {
    const userId = req.params.id;
    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }
    if (parseInt(userId) <= 0) {
        return res.status(400).json({ message: "User ID must be a positive integer" });
    }

    const user = await prisma.user.findUnique({
        where: {
            id: parseInt(userId),
        },
        select: {
            username: true
        }
    })

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // default 'admin' user cannot be deleted
    if (user.username === "admin") {
        return res.status(401).json({ message: "Default admin user cannot be deleted" });
    }

    const result = await prisma.user.delete({
        where: {
            id: parseInt(userId),
        },
    });

    res.status(200).json({ message: "User deleted successfully" });
});

// get user by id
router.get("/:id", adminCheck, async (req, res) => {
    const userId = req.params.id;
    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }
    if (parseInt(userId) <= 0) {
        return res.status(400).json({ message: "User ID must be a positive integer" });
    }

    const user = await prisma.user.findUnique({
        where: {
            id: parseInt(userId),
        }
    })

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // remove the password from the user object
    delete user.password;
    delete user.apiToken;

    res.status(200).json(user);
});

// update user by id
router.put("/:id", adminCheck, 
    body("email").isEmail().withMessage("Invalid email format"),
    body("firstName").isString().notEmpty().withMessage("First name is required"),
    body("lastName").isString().notEmpty().withMessage("Last name is required"),
    body("isActive").isBoolean().withMessage("isActive must be a boolean"),
    body("isNotificationsEnabled").isBoolean().withMessage("isNotificationsEnabled must be a boolean"),
    body("role").isString().notEmpty().custom((role) => {
        const validRoles = ["ADMIN", "USER", "VIEWER"];
        if (!validRoles.includes(role)) {
            throw new Error(`Role must be one of: ${validRoles.join(", ")}`);
        }
        return true;
    }).withMessage("Role is required"),
    async (req, res) => {

        // Validate request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userId = req.params.id;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }
        if (parseInt(userId) <= 0) {
            return res.status(400).json({ message: "User ID must be a positive integer" });
        }

        const { email, firstName, lastName, isActive, isNotificationsEnabled, role } = req.body;

        const result = await prisma.user.update({
            where: {
                id: parseInt(userId),
            },
            data: {
                email,
                firstName,
                lastName,
                isNotificationsEnabled,
                isActive,
                role
            },
        })

        if (!result) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User updated successfully" });
    }
);

export default router;