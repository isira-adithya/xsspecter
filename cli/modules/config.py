from pathlib import Path
import os
import json

class Config:
    def __init__(self):
        # Default values
        self.IGNORE_KEYS = ['csrf_token', 'session_id', 'cookie', 'token', 'authenticity_token', 'auth_token', 'authenticity']
        self.DEFAULT_EMAIL = 'example@example.com'
        self.DEFAULT_PHONE = '1234567890'
        self.DEFAULT_URL = 'http://example.com'
        self.DEFAULT_NUMBER = '1234567890'

        # Customizable
        self.config_location = None
        self.domain = ''
        self.api_key = ''
        self.max_depth = 2
        self.rate_limit = 5 # requests per second
        self.load(self.config_location)
    
    def is_configured(self):
        # check if the domain and the api_key are set
        if self.domain == '':
            return False
        if self.api_key == '':
            return False
        return True

    def load(self, config_file=None):
        if (config_file is None):
            # ~/.config/xsspecter/config.json
            config_file = os.path.join(Path.home(), '.config', 'xsspecter', 'config.json')
            self.config_location = config_file

        if not os.path.exists(config_file):
            # Create the config directory and file if they don't exist
            try:
                os.makedirs(os.path.dirname(config_file), exist_ok=True)
                with open(config_file, 'w') as f:
                    json.dump({
                        "domain": self.domain,
                        "api_key": "",
                        "max_depth": self.max_depth,
                        "rate_limit": self.rate_limit
                    }, f, indent=4)
            except Exception:
                # Ignore errors (e.g., permission issues)
                pass
            return
        
        with open(config_file, 'r') as f:
            _tobj = json.load(f)
            self.domain = _tobj['domain']
            self.max_depth = _tobj['max_depth']
            self.rate_limit = _tobj['rate_limit']
            self.api_key = _tobj['api_key']