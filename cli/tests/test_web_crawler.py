from modules.web_crawler import WebCrawler

def test_is_valid_url():
    wc = WebCrawler("http://example.com", should_crawl=False)
    assert wc.is_valid_url("http://example.com/page")
    assert not wc.is_valid_url("http://other.com")

def test_get_depth():
    wc = WebCrawler("http://example.com")
    assert wc.get_depth("http://example.com") == 0
    assert wc.get_depth("http://example.com/a/b") == 2

def test_get_links():
    html = '<a href="/a">A</a><a href="http://other.com/b">B</a>'
    class DummyResponse:
        text = html
    wc = WebCrawler("http://example.com", should_crawl=False)
    links = wc.get_links(DummyResponse(), "http://example.com")
    assert "http://example.com/a" in links
    assert "http://other.com/b" not in links