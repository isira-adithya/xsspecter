import os
import json
from pathlib import Path

import pytest

from modules.config import Config

def test_config_default_creation(tmp_path, monkeypatch):
    monkeypatch.setenv("HOME", str(tmp_path))
    cfg = Config()
    config_file = tmp_path / ".config" / "xsspecter" / "config.json"
    assert config_file.exists()
    data = json.loads(config_file.read_text())
    assert "domain" in data
    assert "api_key" in data
    assert data["max_depth"] == cfg.max_depth
    assert data["rate_limit"] == cfg.rate_limit

def test_config_load_existing(tmp_path, monkeypatch):
    monkeypatch.setenv("HOME", str(tmp_path))
    config_dir = tmp_path / ".config" / "xsspecter"
    config_dir.mkdir(parents=True)
    config_file = config_dir / "config.json"
    input_data = {"domain": "example.com", "api_key": "key", "max_depth": 5, "rate_limit": 10}
    config_file.write_text(json.dumps(input_data))
    cfg = Config()
    assert cfg.domain == "example.com"
    assert cfg.api_key == "key"
    assert cfg.max_depth == 5
    assert cfg.rate_limit == 10