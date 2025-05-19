import json

from pathlib import Path

import pytest

from modules.result_exporter import ResultExporter

def test_export_json(tmp_path):
    results = [{"foo": "bar"}]
    output_file = tmp_path / "out.json"
    ResultExporter.export_json(results, output_file)
    assert output_file.exists()
    data = json.loads(output_file.read_text(encoding="utf-8"))
    assert data == results