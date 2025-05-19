class FormProcessor:
    def __init__(self, form, url):
        self.form = form
        self.form_data = {}
        self.form_url = url

    def organize_forms(self, form):
        try:
            url = form.get('action', '')
            if (url == ''):
                url = self.form_url
            method = form.get('method', 'GET')
            inputs = form.find_all('input')
            textareas = form.find_all('textarea')
            selects = form.find_all('select')
            content_type = form.get('enctype', 'application/x-www-form-urlencoded')
            if (content_type == '' or content_type is None):
                content_type = 'application/x-www-form-urlencoded'
            form_data = {}
            for inp in inputs:
                name = inp.get('name')
                value = inp.get('value', '')
                type = inp.get('type', 'text')
                form_data[name] = {
                    'value': value,
                    'type': type
                }
            for textarea in textareas:
                name = textarea.get('name')
                form_data[name] = {
                    'value': '',
                    'type': 'textarea'
                }
            for select in selects:
                name = select.get('name')
                options = select.find_all('option')
                selected_value = ''
                for option in options:
                    if option.has_attr('selected'):
                        selected_value = option.get('value', '')
                form_data[name] = {
                    'value': selected_value,
                    'type': 'select'
                }
            self.form_data = {
                'url': url,
                'method': method,
                'data': form_data,
                'content_type': content_type
            }
        except Exception as e:
            print(f"Error organizing form: {e}")

    def process(self):
        self.organize_forms(self.form)
        pass