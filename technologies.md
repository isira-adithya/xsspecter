 # Technologies Used

 This document lists the main technologies and libraries used across the XSSpecter project.

 ## Server (Callback Handling & Dashboard)

 ### Backend
- Node.js & Express
- Prisma ORM
- PostgreSQL
- express-session & @quixo3/prisma-session-store
- argon2 (password hashing)
- nodemailer (SMTP notifications)
- Global fetch (Node) for webhook requests
- terser (JavaScript payload minification)
- OpenAI SDK (optional) for AI report generation
- html2canvas (screenshot capture)

 ### Frontend (Dashboard UI)
- Vue 3
- PrimeVue UI components
- Tailwind CSS
- Chart.js
- Vite (build tool & development server)

 ## Infrastructure
- Docker & Docker Compose
- Nginx (reverse proxy configuration)

 ## CLI Tool (Payload Spraying)
- Python >= 3.10
- Typer (CLI framework)
- requests (HTTP client)
- beautifulsoup4 (HTML parsing)
- requests_toolbelt (advanced HTTP utilities)
- rich (rich text & progress bars)
- validators (input validation)
- shortuuid (unique ID generation)