from bs4 import BeautifulSoup

from modules.form_processor import FormProcessor

def test_organize_forms_input_textarea_select():
    html = '''
    <form action="/submit" method="POST" enctype="multipart/form-data">
      <input type="text" name="a" value="x">
      <textarea name="b"></textarea>
      <select name="c">
        <option value="1">One</option>
        <option value="2" selected>Two</option>
      </select>
    </form>
    '''
    soup = BeautifulSoup(html, 'html.parser')
    form = soup.find('form')
    processor = FormProcessor(form, "http://example.com/page")
    processor.process()
    data = processor.form_data
    assert data["url"] == "/submit"
    assert data["method"].lower() == "post"
    assert data["content_type"] == "multipart/form-data"
    assert data["data"]["a"]["value"] == "x"
    assert data["data"]["b"]["type"] == "textarea"
    assert data["data"]["c"]["value"] == "2"
    assert data["data"]["c"]["type"] == "select"