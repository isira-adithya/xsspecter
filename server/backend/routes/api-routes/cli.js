import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
const router = express.Router();
const prisma = new PrismaClient();

router.post(
    "/track", 
    body("target").isObject().withMessage("Target is not valid").custom((value) => {
        // target is an object with keys
        // target contains the following
        // {"url": "http://bxss.localtest.me/classic/test-02.php", "method": "POST", "data": {"name": {"value": "", "type": "text"}}, "content_type": "multipart/form-data"}
        // content_type is optional
        
        if (!value.url || typeof value.url !== 'string') {
            return false;
        }
        
        if (!value.data || typeof value.data !== 'object') {
            return false;
        }
        
        // Check if all data fields have value and type properties
        for (const field in value.data) {
            if (!value.data[field].hasOwnProperty('value') || !value.data[field].hasOwnProperty('type')) {
                return false;
            }
        }
        
        // content_type is optional, but if present should be a string
        if (value.content_type !== undefined && typeof value.content_type !== 'string') {
            return false;
        }
        
        if (!value.method || !['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].includes(value.method.toUpperCase())) {
            return false;
        }

        if (!value.data || typeof value.data !== 'object') {
            return false;
        }
        
        // Check if all data fields have value and type properties
        for (const field in value.data) {
            if (!value.data[field].hasOwnProperty('value') || !value.data[field].hasOwnProperty('type')) {
                return false;
            }
        }
        
        // content_type is optional, but if present should be a string
        if (value.content_type !== undefined && typeof value.content_type !== 'string') {
            return false;
        }
        
        return true;
    }),
    body("uid").isLength({min:10,max:10}).withMessage("UID is not valid"),
    async (req, res) => {

        // Validate the request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { target, uid } = req.body;
        const { url, method, data } = target;
        var content_type = null;
        if (target.content_type) {
            content_type = target.content_type;
        }

        const trackedRequest = await prisma.trackingID.create({
            data: {
                trackingId: uid,
                url: url,
                method: method,
                data: JSON.stringify(data),
                contentType: content_type ? content_type : 'application/x-www-form-urlencoded',
            }
        });

        if (trackedRequest) {
            return res.status(200).json({ message: "Request tracked successfully" });
        } else {
            return res.status(500).json({ message: "Error tracking request" });
        }

    }
);

export default router;