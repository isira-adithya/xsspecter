import requests
from typing import List
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from datetime import datetime
from rich.console import Console
from modules.custom_functions import CustomFunctions
from rich.progress import Progress, TaskID
from typing import Optional, Set, Dict
from modules.html_parser import HTMLParser
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import deque
import threading

class WebCrawler:
    def __init__(self, base_url: str, max_depth: int = 2, max_pages: int = 100, should_crawl: bool = False, proxy: str = None, insecure: bool = False, headers: List[str] = [], cookies: str = None, thread_count: int = 5):
        self.base_url = base_url
        self.max_depth = max_depth
        self.max_pages = max_pages
        self.visited_urls: Set[str] = set()
        self.in_progress_urls: Set[str] = set()
        self.url_lock = threading.Lock()
        self.results = []
        self.console = Console()
        self.progress: Optional[Progress] = None
        self.tasks: Dict[str, TaskID] = {}
        self.identified_forms = []
        self.should_crawl = should_crawl

        # Threading related stuff
        self.thread_count = thread_count
        self.executor = ThreadPoolExecutor(max_workers=self.thread_count)

        # HTTP Session Related Stuff
        self.http_session = requests.Session()
        self.http_session.proxies.update({
            'http': proxy,
            'https': proxy
        })
        if insecure:
            requests.packages.urllib3.disable_warnings(requests.packages.urllib3.exceptions.InsecureRequestWarning)
        self.http_session.verify = not insecure
        self.http_session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        })
        if len(headers) > 0:
            for header in headers:
                key, value = header.split(':', 1)
                # Validate header format
                if not key or not value:
                    raise ValueError(f"Invalid header format: {header}. Expected 'Key: Value'.")
                # Add header to session
                self.http_session.headers[key.strip()] = value.strip()
        if cookies:
            cookies = cookies.strip()
            c_key_pairs = cookies.split(';')
            for c_key_pair in c_key_pairs:
                if not c_key_pair or '=' not in c_key_pair:
                    continue
                ckey, cval = c_key_pair.split('=', 1)
                # Validate cookie format
                if not ckey or not cval:
                    raise ValueError(f"Invalid cookie format: {c_key_pair}. Expected 'Key=Value'.")
                # Add cookie to session
                self.http_session.cookies[ckey.strip()] = cval.strip()
        
    
    def get_links(self, response: requests.Response, url) -> set:
        """Extract all links from a webpage."""
        try:
            soup = BeautifulSoup(response.text, 'html.parser')
            links = set()
            
            for link in soup.find_all('a', href=True):
                href = link['href']
                absolute_url = urljoin(url, href)
                
                custom_funcs = CustomFunctions()
                if custom_funcs.is_valid_url(self.base_url, absolute_url):
                    links.add(absolute_url)
            
            return links
        except Exception as e:
            self.console.print(f"[red]Error processing {url}: {str(e)}[/red]")
            return set()
    
    def get_depth(self, url: str) -> int:
        """Get the depth of a URL."""
        # parse the url
        parsed_url = urlparse(url)

        # get the path of the url
        path = parsed_url.path

        # check if the path is empty
        if not path:
            return 0
        else:
            # split the path into parts
            parts = path.split('/')
            return len(parts) - 1
    
    def extract_page_info(self, url: str, response: requests.Response) -> dict:
        """Extract relevant information from a webpage."""
        soup = BeautifulSoup(response.text, 'html.parser')
        return {
            'url': url,
            'title': soup.title.string if soup.title else 'No title',
            'meta_description': soup.find('meta', {'name': 'description'})['content']
                if soup.find('meta', {'name': 'description'}) else 'No description',
            'headers': [h.text for h in soup.find_all(['h1', 'h2', 'h3'])],
            'status_code': response.status_code,
            'crawled_at': datetime.now().isoformat()
        }

    def _process_url(self, url: str) -> Set[str]:
        """Process a single URL and return new discovered URLs."""
        try:
            # Update progress for the console
            if self.progress:
                task_id = self.progress.add_task(
                    description=f"Crawling {url}", 
                    total=None,
                    visible=True
                )
                self.tasks[url] = task_id

            response = self.http_session.get(url, timeout=10, allow_redirects=False)
            response.raise_for_status()

            # Identify forms
            html_parser = HTMLParser(url, response.text)
            identified_forms = html_parser.extract_forms()
            self.identified_forms.extend(identified_forms)
            
            # Extract page information
            page_info = self.extract_page_info(url, response)
            self.results.append(page_info)
            
            # Mark as done in progress for the console
            if self.progress and url in self.tasks:
                self.progress.update(self.tasks[url], visible=False)
            
            # Get links
            links = self.get_links(response=response, url=url)
            
            # Return discovered links for further crawling if we're below max_depth
            current_depth = self.get_depth(url)
            if current_depth < self.max_depth:
                return links
            
            return set()
            
        except Exception as e:
            self.console.print(f"[red]Error processing {url}: {str(e)}[/red]")
            self.visited_urls.add(url)
            if self.progress and url in self.tasks:
                self.progress.update(self.tasks[url], visible=False)
            return set()

    def crawl(self, url: str = None, depth: int = 0):
        # Default to base_url if none provided
        if url is None:
            url = self.base_url
        
        # Only crawl if explicitly enabled
        if not self.should_crawl:
            if url not in self.visited_urls:
                self.visited_urls.add(url)
                self._process_url(url)
            return
        
        # Queue-based crawling to prevent deadlocks
        to_crawl = deque([url])
        
        while to_crawl and len(self.visited_urls) < self.max_pages:
            # Take a batch of URLs to process in parallel
            batch = []
            for _ in range(min(self.thread_count, len(to_crawl))):
                if not to_crawl:
                    break
                    
                current_url = to_crawl.popleft()
                
                # Use a lock to safely check and update tracking sets
                with self.url_lock:
                    if current_url not in self.visited_urls and current_url not in self.in_progress_urls:
                        batch.append(current_url)
                        self.visited_urls.add(current_url)
                        self.in_progress_urls.add(current_url)
            
            if not batch:
                continue
                
            # Process the batch in parallel
            futures = {self.executor.submit(self._process_url, url): url for url in batch}
            
            # Collect results and new URLs to crawl
            for future in as_completed(futures):
                current_url = futures[future]
                try:
                    new_urls = future.result()
                    
                    # Mark URL as no longer in progress
                    with self.url_lock:
                        self.in_progress_urls.remove(current_url)
                    
                    # Add new URLs to the crawl queue if they haven't been visited
                    for new_url in new_urls:
                        with self.url_lock:
                            if new_url not in self.visited_urls and new_url not in self.in_progress_urls and len(self.visited_urls) < self.max_pages:
                                current_depth = self.get_depth(current_url) + 1
                                
                                # Only add URLs that don't exceed max_depth
                                if current_depth <= self.max_depth:
                                    to_crawl.append(new_url)
                except Exception as e:
                    # Make sure to remove URL from in_progress even if there's an error
                    with self.url_lock:
                        if current_url in self.in_progress_urls:
                            self.in_progress_urls.remove(current_url)
                    self.console.print(f"[red]Error handling result for {current_url}: {str(e)}[/red]")