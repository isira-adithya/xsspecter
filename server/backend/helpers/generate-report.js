import { PrismaClient } from "@prisma/client";
import OpenAI from 'openai';
const prisma = new PrismaClient();

const exampleReport = `
## **Vulnerability Report: Blind Cross-Site Scripting (XSS)**

### **Summary**
A **Blind Cross-Site Scripting (XSS)** vulnerability was discovered during a security assessment of the target application. This type of vulnerability allows an attacker to inject malicious scripts that execute in the context of another user (often an administrator) without any immediate feedback to the attacker. The XSS was triggered asynchronously in a different context from where the payload was injected.

---

### **Vulnerability Type**
- **Blind Cross-Site Scripting (XSS)**  
- CWE-79: Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting')

---

### **Injection Point**
The payload was successfully injected in the following location:

- **Endpoint**: \`[INJECTION_ENDPOINT]\`  
- **Method**: [INJECTION_METHOD]  
- **Parameter**: \`[INJECTION_PARAMETERS]\` 
- **Context**: The input field in the support contact form allowed HTML/JS payloads to be submitted without sanitization or encoding.

---

### **Trigger Point**
The payload was triggered **server-side or within a privileged internal admin interface**, specifically when an administrator accessed the following internal panel:

- **Trigger Location**: \`[VULNERABLE_ENDPOINT]\`
- **Execution Evidence**: Out-of-band interaction received on attacker-controlled server:
  - Timestamp: [TIMESTAMP]
  - IP Address: [IPADDRESS]
  - User-Agent: [USERAGENT]

---

### **Impact**
This blind XSS vulnerability could be exploited by an attacker to:

- Steal admin session cookies (session hijacking)
- Perform arbitrary actions on behalf of an admin (CSRF-style attacks via JS)
- Pivot to other internal administrative functions
- Establish persistent access via JavaScript payloads or browser implants

**Business Impact:**
- **Data Exposure**: Attacker could gain full administrative access
- **Account Compromise**: Unauthorized access to sensitive user records and system functions
- **Reputation Damage**: Exploitation could lead to loss of user trust and potential legal consequences if user data is exfiltrated

---

### **Severity**
**CVSS v3.1 Score**: **9.6 (Critical)**  
- **Vector**: \`CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:H\`  
- **Justification**: 
  - Attack is remote and requires no authentication
  - Impact includes complete compromise of administrator accounts
  - Low attack complexity (standard payloads work)
  - Requires interaction (admin views the message)
  - CIA triad is fully compromised (Confidentiality, Integrity, Availability)

---

### **Proof of Concept**
A crafted support request was submitted with the following payload:

\`\`\`http
POST /support/ticket/create HTTP/1.1
Host: developer.bbpos.com
Accept-Encoding: gzip, deflate, br
Accept: */*
Accept-Language: en-US;q=0.9,en;q=0.8
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36
Connection: close
Cache-Control: max-age=0
Content-Type: application/x-www-form-urlencoded
Content-Length: 0

name=PAYLOAD&description=PAYLOAD
\`\`\`

Upon admin review in \`[VULNERABLE_ENDPOINT]\`, the script executed in the admin’s browser, confirming the blind XSS.

Screenshot of the page showing the executed script:
{IMAGE_PLACERHOLDER} 

---

### **Mitigation Recommendations**
1. **Input Sanitization**:
   - Sanitize all user inputs on the server side using a library like DOMPurify (if rendering HTML is required) or escape inputs if not necessary.
2. **Output Encoding**:
   - Apply contextual output encoding (e.g., HTML-encode, JavaScript encode) before rendering user input into the DOM.
3. **Content Security Policy (CSP)**:
   - Enforce a strict CSP to restrict script execution sources.
4. **Use HttpOnly Cookies**:
   - Prevent JavaScript from accessing cookies by setting the \`HttpOnly\` flag.
5. **Audit All Input/Output Channels**:
   - Review all areas where user data is displayed, especially admin interfaces that render untrusted input.
6. **XSS Prevention Frameworks**:
   - Consider leveraging frontend frameworks that auto-sanitize content, such as React or Angular, which escape content by default.

---

### **Conclusion**
A critical blind XSS vulnerability was identified and proven to execute within the administrator's browser context. Due to its high impact and ease of exploitation, remediation should be prioritized immediately.

Please reach out if additional information or live demonstration is needed.

---

Let me know if you'd like to tailor this report to a particular target (e.g., company name, specific admin panel name, or use a more professional tone for official submission).
`

async function generateReport(xssAlertId){
    const alert = await prisma.xSSAlert.findUnique({
        where: {
            id: xssAlertId
        },
        select: {
            id: true,
            ip: true,
            timestamp: true,
            userAgent: true,
            cookies: true,
            document: true,
            location: true,
            TrackingID: true,
        }
    });
    if (!alert) {
        throw new Error('Alert not found');
    }
    alert.injectionPoint = alert.TrackingID;
    alert.vulnerableSite = alert.document;
    alert.vulnerableURL = alert.location;
    delete alert.TrackingID;
    delete alert.document;
    delete alert.location;


    // Get the API key from the db
    const apiKey = await prisma.settings.findFirst({
        where: {
            key: "openai_key"
        }
    })
    const openaiClient = new OpenAI({
        apiKey: apiKey.value
    });

    const response = await openaiClient.responses.create({
        model: 'gpt-4o',
        input: [
            {
                "role": "developer",
                "content": `Generate a detailed vulnerability report from user input based the following report example.\n\n${exampleReport}\n\nThe report should be in markdown format and include the following information:\n- Vulnerability Type\n- Injection Point\n- Trigger Point\n- Impact\n- Severity\n- Proof of Concept\n- Mitigation Recommendations\n- Conclusion\nInclude '{IMAGE_PLACERHOLDER}' in the markdown to attach the screenshot later.\n\nOutput should be in JSON. Ex: {"report": "## XSS Report ..etc"}`
            },
            {
                "role": "user",
                "content": JSON.stringify(alert)
            }
        ],
        text: {
            format: {
                type: 'json_object'
            }
        }
    })
    
    if (response.status == 'completed') {
        const report = JSON.parse(response.output_text)['report'];
        return report;
    }
    else {
        throw new Error('Failed to generate report');
    }
}

export default generateReport;