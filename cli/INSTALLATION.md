# Installation Guide

## Prerequisites

- Python 3.7 or higher
- pipx (recommended for CLI tool installation)

If you don't have pipx installed, you can install it using pip:

```bash
pip install pipx
pipx ensurepath
```

## Installation Options

### Install using pipx (Recommended)

[pipx](https://pypa.github.io/pipx/) is the recommended way to install CLI tools as it creates isolated environments for Python applications.

```bash
pipx install "git+https://github.com/isira-adithya/xsspecter.git@main#subdirectory=cli"
```

## Verifying Installation

After installation, verify that xsspecter is correctly installed:

```bash
xsspecter --version
```

## Configuration

1. **Locate the configuration file**

   * **Windows**: `C:\Users\%USERNAME%\.config\xsspecter\config.json`
   * **Linux/macOS**: `~/.config/xsspecter/config.json`

2. **Open and update**

   Edit the file in your preferred text editor and replace the placeholder values:

   ```json
   {
     "domain": "your-blind-xss-server.com",
     "api_key": "YOUR_API_TOKEN",
     "max_depth": 2,
     "rate_limit": 5
   }
   ```

   * **domain**: The base URL of your blind XSS server (no protocol or path).
   * **api\_key**: Your personal API token.
   * **max\_depth**: Maximum crawl depth for scanning (default: 2).
   * **rate\_limit**: Maximum number of requests per second (default: 5).

3. **Save the configuration**

   After editing, save the file and ensure it remains valid JSON. If you encounter parsing errors, double‑check for missing commas or incorrect quotation marks.

4. **Obtain your API token**

   Visit your server’s account page in a browser:

   ```plaintext
   https://<your-blind-xss-server.com>/app/account
   ```

   Copy the token displayed and paste it into the `api_key` field in your `config.json` file.


You can get your token by visiting https://example.com/app/account. (replace `example.com` with your domain)

## Uninstallation

To remove xsspecter:

```bash
pipx uninstall xsspecter
```
