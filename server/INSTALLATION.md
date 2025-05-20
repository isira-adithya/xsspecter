# Installation Guide

This document provides step-by-step instructions for setting up the application.

## Prerequisites

- A VPS with Ubuntu 24.04 (or similar Linux distribution)
- Basic knowledge of Linux command line
- Root or sudo access to your server

## Installation Steps

### 1. Update Your System

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Docker

Follow the official Docker installation:

```bash
# Download the installation script
curl -fsSL https://get.docker.com -o get-docker.sh

# Preview the script before running (recommended)
sudo sh ./get-docker.sh --dry-run

# Run the installation
sudo sh ./get-docker.sh
```

**Security Note:** It is recommended to configure Docker to run as a non-privileged user. For detailed instructions, see the [Docker Rootless Mode documentation](https://docs.docker.com/go/rootless/).

### 3. Install Docker Compose Plugin

```bash
# Download Docker Compose
curl -SL https://github.com/docker/compose/releases/download/v2.35.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose

# Set executable permissions
chmod +x /usr/local/bin/docker-compose
```

### 4. Clone the Repository

```bash
git clone https://github.com/isira-adithya/xsspecter.git
```

### 5. Run the Setup Script

```bash
# Navigate to the project directory
cd xsspecter

# Make the setup script executable
chmod +x setup.sh

# Run the setup script
./setup.sh
```

The setup script will:
- Generate or help you customize various secrets
- Set the default admin password
- Optionally start the Docker containers

### 6. Start the Application (If Not Started Automatically)

If you chose not to start the containers during setup:

```bash
# Navigate to the server directory
cd xsspecter/server/

# Start Docker containers in detached mode
docker-compose up -d
```

## Verification

After installation, verify that all services are running properly by checking the Docker containers:

```bash
docker ps
```

## Configuration

1. **Access the Application**

   Open your web browser and navigate to:

   ```plaintext
   http://<SERVER_IP>:80/app/
   ```

2. **Log In**

   Sign in to the admin panel using the default credentials:

   * **Username**: `admin`
   * **Password**: The password you provided or generated during the setup process (`setup.sh`/`setup.bat`).

3. **Open Settings**

   Go to the settings page:

   ```plaintext
   http://<SERVER_IP>:80/app/settings
   ```

4. **Configure Notifications**

   Update each of the following notification options as needed:

   * **Email Notifications**:
     * SMTP Host
     * SMTP Port
     * SMTP Username
     * SMTP Password
     * From Email Address

   * **Discord Notifications**:
     * Discord Webhook URL

   * **Slack Notifications**:
     * Slack Webhook URL

   * **Telegram Notifications**:
     * Bot Token
     * Chat ID

5. **Advanced Settings**
   * **IP Header**: If your server is hosted behind a reverse proxy (for example, Cloudflare), enter `CF-Connecting-IP` here. This ensures that blind XSS callbacks report the client’s original IP address rather than the proxy’s IP.

6. **AI Settings**
   * **OpenAI API Key**: Enter your OpenAI API key to enable automatic report generation.


## Troubleshooting

If you encounter any issues during installation:
1. Check the Docker logs: `docker logs [container_name]`
2. Ensure all ports required by the application are open in your firewall
3. Refer to the project's issue tracker or wiki for common problems

## Security Considerations

- Change default credentials immediately after installation
- Consider implementing additional security measures like SSH key authentication
- Keep the system and Docker images updated regularly

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)