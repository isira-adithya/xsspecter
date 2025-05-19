import fs from "fs";
import { minify } from "terser";

async function preparePayload(req){
    // Get unique identifier if present
    var uniqueIdentifier = null;
    if (req.path.match(/\/[a-zA-Z0-9]{10}/)) {
        uniqueIdentifier = req.path.split("/").pop();
    }

    // Prepare the response
    const domain = req.headers.host ?? 'localhost';
    let result = fs.readFileSync("assets/base.js", "utf-8");
    result = result.replace("{{DOMAIN}}", domain);
    result = result.replace("{{UID}}", uniqueIdentifier ? uniqueIdentifier : "null");

    // Load html2canvas.min.js
    result = result.replace("{HTML2CANVAS}", fs.readFileSync("assets/html2canvas.min.js", "utf-8"));

    result = await minify(result);
    result = result.code;  

    return result;
}

export {
    preparePayload
}