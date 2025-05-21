from urllib.parse import urlparse
import validators

class CustomFunctions:
    def is_valid_url(self, base_url:str, url: str) -> bool:
        """Check if URL is valid and belongs to the same domain."""
        # Do not crawl external links which are out of scope! 
        if not validators.url(url):
            return False
        return urlparse(url).netloc == urlparse(base_url).netloc