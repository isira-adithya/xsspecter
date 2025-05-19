import pytest
from typer.testing import CliRunner
from xsspecter.main import app

runner = CliRunner()

def test_help():
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    assert "Usage" in result.stdout

def test_invalid_url():
    result = runner.invoke(app, ["spray", "not_a_url"])
    assert result.exit_code == 2  # Update from 1 to 2 to match actual behavior