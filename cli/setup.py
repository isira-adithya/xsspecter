from setuptools import setup, find_packages

with open("requirements.txt") as f:
    requirements = f.read().splitlines()

with open("README.md") as f:
    long_description = f.read()

setup(
    name="xsspecter",
    version="0.1.0",
    description="XSSpecter - XSS detection tool",  # Update with your actual description
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Isira Adithya",
    author_email="me@isiraadithya.com",
    url="https://github.com/username/package",
    packages=["xsspecter", "modules"],
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "xsspecter=xsspecter.main:main",
        ],
    },
    classifiers=[
        "Programming Language :: Python :: 3",
    ],
    python_requires=">=3.10",
)