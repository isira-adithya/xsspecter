from bs4 import BeautifulSoup
from modules.form_processor import FormProcessor
from urllib.parse import urljoin, urlparse
from modules.custom_functions import CustomFunctions

class HTMLParser:
    def __init__(self, url, html):
        self.html = html
        self.url = url
        self.url_schema = urlparse(url).scheme
        self.forms = []
        self.forms_data = []  

    def convert_to_absolute_url(self, relative_url: str, domain: str, schema: str = "https") -> str:
        # Clean up the domain by removing any protocol and trailing slashes
        domain = domain.strip().lower()
        domain = domain.replace('http://', '').replace('https://', '').rstrip('/')
        
        # Clean up the relative URL
        relative_url = relative_url.strip()
        
        # Handle protocol-relative URLs (starting with //)
        if relative_url.startswith('//'):
            return f"{schema}:{relative_url}"
        
        # Create base URL
        base_url = f"{schema}://{domain}"
        
        # Handle absolute URLs that were passed as relative
        if urlparse(relative_url).netloc:
            return relative_url
        
        # Ensure relative URL starts with /
        if not relative_url.startswith('/'):
            relative_url = '/' + relative_url
        
        # Join the base URL with the relative URL
        absolute_url = urljoin(base_url, relative_url)
        
        return absolute_url              

    def find_forms(self):
        soup = BeautifulSoup(self.html, 'html.parser')
        # Find all forms in the html content
        self.forms = soup.find_all('form')
        return self.forms
    
    def find_links(self):
        soup = BeautifulSoup(self.html, 'html.parser')
        # Find all links in the html content
        links = soup.find_all('a', href=True)
        for link in links:
            # Only select links with query parameters
            if "?" in link['href']:
                _url = self.convert_to_absolute_url(link['href'], self.url, self.url_schema)
                keys = urlparse(_url).query.split('&')
                
                query_params = {}
                for key in keys:
                    param = key.split('=')
                    if len(param) == 2:
                        query_params[param[0]] = {'type': 'text', 'value': param[1]}

                # Remove keys and values from the _url
                _url = _url.split('?')[0]
                self.forms_data.append({
                        'url': _url,
                        'method': 'GET',
                        'data': query_params
                    })
        return True

    def extract_forms(self):
        # Process the html content
        forms = self.find_forms()
        for form in forms:
            form_processor = FormProcessor(form, self.url)
            try:
                form_processor.process()
            except Exception as e:
                print(f"Error processing form: {e}")
                continue

            # every form's url in form_processor.form_data should be absolute
            form_processor.form_data['url'] = self.convert_to_absolute_url(form_processor.form_data['url'], self.url, self.url_schema)
            
            # Check if form action points to an out of scope URL
            custom_funcs = CustomFunctions()
            if not custom_funcs.is_valid_url(self.url, form_processor.form_data['url']):
                print(f"Form action URL is out of scope: {form_processor.form_data['url']}")
                continue

            self.forms_data.append(form_processor.form_data)
            
        links = self.find_links()

        return self.forms_data

    