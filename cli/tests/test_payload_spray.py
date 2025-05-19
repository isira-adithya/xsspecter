import urllib.parse

import pytest

import modules.payload_spray as ps_mod
from modules.config import Config

def test_generate_query(monkeypatch):
    cfg = Config()
    cfg.IGNORE_KEYS = ['csrf_token']
    cfg.DEFAULT_EMAIL = 'email@example.com'
    cfg.DEFAULT_NUMBER = '123'
    cfg.DEFAULT_PHONE = '999'
    monkeypatch.setattr(ps_mod, "Config", lambda: cfg)
    payload = "<XSS>"
    data = {
        "a": {"value": "v", "type": "csrf_token"},
        "b": {"value": "", "type": "email"},
        "c": {"value": "", "type": "url"},
        "d": {"value": "", "type": "number"},
        "e": {"value": "", "type": "tel"},
        "f": {"value": "", "type": "text"},
    }
    ps = ps_mod.PayloadSpray(payload, {"url": "http://example.com", "data": data, "method": "GET", "content_type": "application/x-www-form-urlencoded"}, None)
    query = ps.generate_query(data)
    params = dict(urllib.parse.parse_qsl(query))
    assert params["a"] == "v"
    assert params["b"] == "email@example.com"
    assert params["c"] == "123"
    assert params["d"] == "123"
    assert params["e"] == "999"
    assert params["f"] == payload