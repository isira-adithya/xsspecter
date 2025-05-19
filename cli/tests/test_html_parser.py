import pytest

from modules.html_parser import HTMLParser

def test_convert_to_absolute_url():
    hp = HTMLParser("http://example.com", "")
    assert hp.convert_to_absolute_url("/test", "example.com", "http") == "http://example.com/test"
    assert hp.convert_to_absolute_url("https://other.com/path", "example.com", "https") == "https://other.com/path"
    assert hp.convert_to_absolute_url("//cdn.com/lib.js", "example.com", "https") == "https://cdn.com/lib.js"

def test_find_forms_and_links():
    html = '''
    <html>
      <form action="/submit" method="POST">
        <input name="a" value="1">
      </form>
      <a href="?x=1&y=2">Link</a>
    </html>
    '''
    hp = HTMLParser("http://example.com", html)
    forms = hp.find_forms()
    assert len(forms) == 1
    success = hp.find_links()
    assert success
    assert any(item["method"] == "GET" and item["data"] == {"x": {"value": "1", "type": "text"}, "y": {"value": "2", "type": "text"}} for item in hp.forms_data)

def test_extract_forms():
    html = '''
    <html>
      <form action="/submit" method="POST" enctype="multipart/form-data">
        <input type="text" name="a" value="x">
        <textarea name="b"></textarea>
      </form>
    </html>
    '''
    hp = HTMLParser("http://example.com", html)
    data = hp.extract_forms()
    assert len(data) == 1
    form = data[0]
    assert form["url"] == "http://example.com/submit"
    assert form["method"].upper() == "POST"
    assert "a" in form["data"]
    assert form["data"]["a"]["value"] == "x"
    assert form["data"]["b"]["type"] == "textarea"