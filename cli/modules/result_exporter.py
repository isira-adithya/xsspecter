import json
from pathlib import Path

class ResultExporter:
    @staticmethod
    def export_json(results: list, output_file: Path):
        """Export crawling results to a JSON file."""
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)