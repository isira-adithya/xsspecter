import typer
from typing import List
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
import validators
from pathlib import Path
from datetime import datetime
from modules.web_crawler import WebCrawler
from modules.result_exporter import ResultExporter
from modules.config import Config
from modules.payload_generator import PayloadGenerator
from modules.payload_spray import PayloadSpray

config = Config()
app = typer.Typer(help="XSSpecter - CLI")

@app.command()
def spray(
    url: str = typer.Argument(..., help="URL / file containing URLs to spray payloads"),
    depth: int = typer.Option(2, help="Maximum crawling depth"),
    max_pages: int = typer.Option(100, help="Maximum number of pages to crawl"),
    output: Path = typer.Option(
        "results.json",
        help="Output file path"
    ),
    crawl: bool = typer.Option(
        False, help="Crawl the website"
    ),
    proxy: str = typer.Option(
        None, help="Proxy to use for requests (format: http://user:pass@host:port)."
    ),
    insecure: bool = typer.Option(
        False, help="Ignore SSL certificate warnings."
    ),
    headers: List[str] = typer.Option(
        [], help="Custom headers to include in requests (format: key1:value1). Use multiple times for multiple headers. (e.g. --headers key1:value1 --headers key2:value2)"
    ),
    cookies: str = typer.Option(
        None, help="Cookies to include in requests (format: \"key1=value1;key2=value2;\")."
    ),
    threads: int = typer.Option(
        5, help="Number of threads to use for payload spraying."
    ),
):
    """
    Spray payloads to the given URL and save the results to a JSON file.
    """
    console = Console()
    
    payload_generator = PayloadGenerator()
    all_results = []
    
    urls_to_process = []

    # Check if the config file ready
    if not config.is_configured():
        console.print("[red]Configuration error: Missing required values[/red]")
        console.print("[yellow]Please set domain and api_key in your configuration file:[/yellow]")
        console.print(f"[blue]~/.config/xsspecter/config.json[/blue]")
        raise typer.Exit(1)
    
    if not validators.url(url):
        # Check if the URL is a file
        if Path(url).is_file():
            with open(url, 'r') as file:
                urls = file.readlines()
                urls_to_process = [line.strip() for line in urls if validators.url(line.strip())]
            if not urls_to_process:
                console.print("[red]No valid URLs found in the file.[/red]")
                raise typer.Exit(1)
            console.print(f"[green]Found {len(urls_to_process)} URLs in file to process[/green]")
        else:
            console.print("[red]Invalid URL provided. Please enter a valid URL.[/red]")
            raise typer.Exit(1)
    else:
        # Single URL case
        urls_to_process = [url]

    # Process all URLs
    for current_url in urls_to_process:
        console.print(f"[green]Processing URL: {current_url}[/green]")
        console.print(f"[green]Starting with the following configuration:[/green]")
        console.print(f"URL: {current_url}")
        if (crawl):
            console.print(f"Crawling: [yellow]Enabled[/yellow]")
            console.print(f"Max Depth: {depth}")
            console.print(f"Max Pages: {max_pages}")
        else:
            console.print(f"Crawling: [red]Disabled[/red]")
        console.print(f"Output File: {output}")
        
        crawler = WebCrawler(base_url=current_url, max_depth=depth, max_pages=max_pages, should_crawl=crawl, 
                             proxy=proxy, insecure=insecure, headers=headers, cookies=cookies, thread_count=threads)
        
        # Create a single progress instance for the entire crawling process
        progress = Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            console=console
        )
        
        with progress:
            crawler.progress = progress  # Assign the progress instance to the crawler
            crawler.crawl(current_url)
            
        console.print(f"\n[green]Scan completed! Found {len(crawler.results)} pages.[/green]")

        # identified forms
        identified_forms = crawler.identified_forms
        console.print(f"[green]Identified {len(identified_forms)} forms. Sending payloads...[/green]")
        
        # spray payloads
        for target in identified_forms:
            unique_id, payloads = payload_generator.get_payloads(target)
            for payload in payloads:
                payloadSprayObj = PayloadSpray(current_url=current_url, payload=payload, target=target, http_session=crawler.http_session)
                try:
                    result = payloadSprayObj.run()
                except Exception as e:
                    if ('out of scope' in str(e)):
                        continue
                    console.print(f"[red]Error sending payload [blue]{payload}[/blue] to [blue]{target['url']}[/blue]: {e}[/red]")
                    continue
                if (result.status_code != 200):
                    console.print(f"[red]Payload [blue]{payload}[/blue] sent to [blue]{target['url']}[/blue] - Status {result.status_code}[/red]")
                else:
                    console.print(f"[green]Payload [blue]{payload}[/blue] sent to [blue]{target['url']}[/blue] - Status {result.status_code}[/green]")
                # Add result to crawler results
                crawler.results.append({
                    'target': target['url'],
                    'payload': payload,
                    'status_code': result.status_code,
                    'response': result.text
                })
        
        # Collect all results
        all_results.extend(crawler.results)
        
    # Export results
    ResultExporter.export_json(all_results, output)
    console.print(f"[green]Results exported to {output}[/green]")

def main():
    app()

if __name__ == "__main__":
    main()