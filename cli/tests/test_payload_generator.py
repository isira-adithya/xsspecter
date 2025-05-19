from types import SimpleNamespace

import modules.payload_generator as pg_mod

def test_get_payloads(monkeypatch):
    def fake_post(url, json, headers):
        return SimpleNamespace(status_code=200)
    monkeypatch.setattr(pg_mod.requests, "post", fake_post)
    pg = pg_mod.PayloadGenerator()
    pg.config.domain = "test.com"
    pg.config.api_key = "key"
    target = {"url": "http://example.com", "method": "GET", "data": {"x": {"value": "1", "type": "text"}, "y": {"value": "2", "type": "text"}}}
    uniqueid, payloads = pg.get_payloads(target)
    assert len(payloads) == 3