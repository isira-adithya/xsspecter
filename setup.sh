#!/bin/bash

# Set colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to create directories if they don't exist
create_directories() {
    if [ ! -d "./server" ]; then
        mkdir -p ./server
        echo -e "${BLUE}Created directory:${NC} ./server"
    fi
    
    if [ ! -d "./server/secrets" ]; then
        mkdir -p ./server/secrets
        echo -e "${BLUE}Created directory:${NC} ./server/secrets"
    fi
}

# Function to generate a strong random password
generate_password() {
    # Generate a 32-character random string with alphanumeric and special characters
    < /dev/urandom tr -dc 'A-Za-z0-9!@#$%^&*()-_=+[]{}|;:,.<>?' | head -c 32
}

# Function to check if a secret file exists and ask for removal
check_existing_secret() {
    local file_path=$1
    local secret_name=$2
    
    if [ -f "$file_path" ]; then
        echo -e "${YELLOW}A secret file for ${secret_name} already exists at ${file_path}${NC}"
        echo -e "${YELLOW}Do you want to remove it and create a new one? (y/N)${NC}"
        read -r remove_existing
        
        if [[ $remove_existing =~ ^[Yy]$ ]]; then
            rm "$file_path"
            echo -e "${BLUE}Existing secret removed.${NC}"
            return 0 # Secret was removed, create a new one
        else
            echo -e "${GREEN}Keeping the existing secret for ${secret_name}.${NC}"
            return 1 # Secret was kept, don't create a new one
        fi
    fi
    
    return 0 # No existing secret, create a new one
}

# Function to get user input for a password or generate one
get_password() {
    local secret_name=$1
    local file_path=$2
    
    # Check if secret already exists
    check_existing_secret "$file_path" "$secret_name"
    if [ $? -eq 1 ]; then
        # User chose to keep the existing secret
        return
    fi
    
    echo -e "${YELLOW}Do you want to use a custom password for ${secret_name}? (y/N)${NC}"
    read -r use_custom
    
    if [[ $use_custom =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Enter your custom password for ${secret_name}:${NC}"
        read -r -s custom_password
        echo
        
        if [ -z "$custom_password" ]; then
            echo -e "${RED}Empty password not allowed. Generating a random one instead.${NC}"
            password=$(generate_password)
        else
            password=$custom_password
        fi
    else
        echo -e "${GREEN}Generating a strong random password for ${secret_name}...${NC}"
        password=$(generate_password)
        echo -e "${GREEN}Generated password: ${password}${NC}"
    fi
    
    # Save the password to the file
    echo -n "$password" > "$file_path"
    chmod 600 "$file_path" # Secure file permissions
    
    echo -e "${GREEN}Password for ${secret_name} saved to ${file_path}${NC}"
}

# Function to run docker-compose if the user wants
run_docker_compose() {
    echo -e "${YELLOW}Do you want to run the application using docker-compose? (y/N)${NC}"
    read -r run_docker
    
    if [[ $run_docker =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Changing directory to ./server and running docker-compose up...${NC}"
        cd ./server || { echo -e "${RED}Failed to change directory to ./server${NC}"; return; }
        
        if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
            echo -e "${GREEN}Starting the application with docker-compose...${NC}"
            docker-compose up -d
        else
            echo -e "${RED}Error: docker-compose.yml file not found in ./server directory${NC}"
        fi
    else
        echo -e "${BLUE}Skipping docker-compose startup.${NC}"
    fi
}

# Main script execution
echo -e "${BLUE}=== Security Credential Generator ===${NC}"
echo -e "${BLUE}This script will create secure passwords for your application.${NC}"
echo

# Create necessary directories
create_directories

# Generate Express session secret
express_secret_path="./server/secrets/express-session-secret.txt"
get_password "Express Session Secret" "$express_secret_path"

echo

# Generate PostgreSQL database password
db_pass_path="./server/secrets/db-pass.txt"
get_password "PostgreSQL Database Password" "$db_pass_path"

echo

# Generate Admin password
admin_pass_path="./server/secrets/admin-pass.txt"
get_password "Admin User" "$admin_pass_path"
echo -e "${YELLOW}NOTE: It is strongly recommended to change the admin password after first login.${NC}"

echo -e "${GREEN}All secrets have been generated successfully!${NC}"
echo -e "${YELLOW}IMPORTANT: Keep these secret files secure and do not commit them to version control.${NC}"

# Ask if the user wants to run docker-compose
echo
run_docker_compose