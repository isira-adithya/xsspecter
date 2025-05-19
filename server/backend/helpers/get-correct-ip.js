import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function getCorrectIp(req) {
    const cHeader = await prisma.settings.findFirst({
        where: {
            key: "ip_header"
        }
    })

    // Check if the custom header is present
    const customHeader = req.headers[cHeader.value.toLowerCase()];
    if (customHeader) {
        return customHeader;
    }
    return req.ip;
}

export default getCorrectIp;