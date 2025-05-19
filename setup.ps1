#!/usr/bin/env pwsh

# Set colors for better readability
$Colors = @{
    RED    = "$([char]0x1b)[91m"
    GREEN  = "$([char]0x1b)[92m"
    BLUE   = "$([char]0x1b)[94m"
    YELLOW = "$([char]0x1b)[93m"
    NC     = "$([char]0x1b)[0m"
}

# Function to create directories if they don't exist
function Create-Directories {
    if (-not (Test-Path -Path "./server")) {
        New-Item -Path "./server" -ItemType Directory | Out-Null
        Write-Host "$($Colors.BLUE)Created directory:$($Colors.NC) ./server"
    }
    
    if (-not (Test-Path -Path "./server/secrets")) {
        New-Item -Path "./server/secrets" -ItemType Directory | Out-Null
        Write-Host "$($Colors.BLUE)Created directory:$($Colors.NC) ./server/secrets"
    }
}

# Function to generate a strong random password
function Generate-Password {
    $CharSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{};:,.<>?'
    $SecurePassword = -join ((1..32) | ForEach-Object { $CharSet[(Get-Random -Maximum $CharSet.Length)] })
    return $SecurePassword
}

# Function to check if a secret file exists and ask for removal
function Check-ExistingSecret {
    param(
        [string]$FilePath,
        [string]$SecretName
    )
    
    if (Test-Path -Path $FilePath) {
        Write-Host "$($Colors.YELLOW)A secret file for $SecretName already exists at $FilePath$($Colors.NC)"
        Write-Host "$($Colors.YELLOW)Do you want to remove it and create a new one$($Colors.NC)? (y/N)"
        $RemoveExisting = Read-Host
        
        if ($RemoveExisting -match '^[Yy]$') {
            Remove-Item -Path $FilePath -Force
            Write-Host "$($Colors.BLUE)Existing secret removed.$($Colors.NC)"
            return $true # Secret was removed, create a new one
        } else {
            Write-Host "$($Colors.GREEN)Keeping the existing secret for $SecretName.$($Colors.NC)"
            return $false # Secret was kept, don't create a new one
        }
    }
    
    return $true # No existing secret, create a new one
}

# Function to get user input for a password or generate one
function Get-SecurePassword {
    param(
        [string]$SecretName,
        [string]$FilePath
    )
    
    # Check if secret already exists
    $CreateNew = Check-ExistingSecret -FilePath $FilePath -SecretName $SecretName
    if (-not $CreateNew) {
        return
    }
    
    Write-Host "$($Colors.YELLOW)Do you want to use a custom password for $SecretName$($Colors.NC)? (y/N)"
    $UseCustom = Read-Host
    
    if ($UseCustom -match '^[Yy]$') {
        Write-Host "$($Colors.YELLOW)Enter your custom password for $SecretName$($Colors.NC):"
        $CustomPassword = Read-Host -AsSecureString
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($CustomPassword)
        $PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
        
        if ([string]::IsNullOrEmpty($PlainPassword)) {
            Write-Host "$($Colors.RED)Empty password not allowed$($Colors.NC). Generating a random one instead."
            $Password = Generate-Password
        } else {
            $Password = $PlainPassword
        }
    } else {
        Write-Host "$($Colors.GREEN)Generating a strong random password for $SecretName$($Colors.NC)..."
        $Password = Generate-Password
        Write-Host "$($Colors.GREEN)Generated password: $Password$($Colors.NC)"
    }
    
    # Save the password to the file
    $Password | Out-File -FilePath $FilePath -Force -Encoding ASCII -NoNewline
    
    Write-Host "$($Colors.GREEN)Password for $SecretName saved to $FilePath$($Colors.NC)"
}

# Function to run docker-compose if the user wants
function Run-DockerCompose {
    Write-Host "$($Colors.YELLOW)Do you want to run the application using docker-compose$($Colors.NC)? (y/N)"
    $RunDocker = Read-Host
    
    if ($RunDocker -match '^[Yy]$') {
        Write-Host "$($Colors.BLUE)Changing directory to ./server and running docker-compose up...$($Colors.NC)"
        try {
            Push-Location -Path "./server"
            
            if ((Test-Path -Path "docker-compose.yml") -or (Test-Path -Path "docker-compose.yaml")) {
                Write-Host "$($Colors.GREEN)Starting the application with docker-compose...$($Colors.NC)"
                & docker-compose up -d
            } else {
                Write-Host "$($Colors.RED)Error: docker-compose.yml file not found in ./server directory$($Colors.NC)"
            }
        } catch {
            Write-Host "$($Colors.RED)Failed to change directory to ./server$($Colors.NC)"
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "$($Colors.BLUE)Skipping docker-compose startup.$($Colors.NC)"
    }
}

# Main script execution
Write-Host "$($Colors.BLUE)===== Security Credential Generator =====$($Colors.NC)"
Write-Host "$($Colors.BLUE)This script will create secure passwords for your application.$($Colors.NC)"
Write-Host ""

# Create necessary directories
Create-Directories

# Generate Express session secret
$ExpressSecretPath = "./server/secrets/express-session-secret.txt"
Get-SecurePassword -SecretName "Express Session Secret" -FilePath $ExpressSecretPath

Write-Host ""

# Generate PostgreSQL database password
$DbPassPath = "./server/secrets/db-pass.txt"
Get-SecurePassword -SecretName "PostgreSQL Database Password" -FilePath $DbPassPath

Write-Host ""

# Generate Admin password
$AdminPassPath = "./server/secrets/admin-pass.txt"
Get-SecurePassword -SecretName "Admin Password" -FilePath $AdminPassPath
Write-Host "$($Colors.YELLOW)IMPORTANT: It is strongly recommended to change the admin password after first login.$($Colors.NC)"

Write-Host "$($Colors.GREEN)All secrets have been generated successfully!$($Colors.NC)"
Write-Host "$($Colors.YELLOW)IMPORTANT: Keep these secret files secure and do not commit them to version control.$($Colors.NC)"

# Ask if the user wants to run docker-compose
Write-Host ""
Run-DockerCompose