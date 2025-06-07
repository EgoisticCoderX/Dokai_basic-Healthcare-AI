pip install -r requirements.txt# Dokai AI Assistant

Dokai is an AI assistant powered by Groq's llama-4-scout model. It provides both a command-line interface and a web-based UI for interacting with the AI.

## Features

- Command-line interface for quick interactions
- Web-based UI with a modern, responsive design
- Powered by Groq's llama-4-scout model for high-quality responses
- Easy setup and configuration

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- A Groq API key (sign up at [groq.com](https://groq.com))

### Installation

1. Clone or download this repository

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set up your environment variables:
   - Rename `.env.example` to `.env`
   - Add your Groq API key to the `.env` file

## Usage

### Command-line Interface

To use the command-line interface:

```
python main.py
```

Type your questions or prompts, and Dokai will respond. Type 'exit' to quit.

### Web Interface

To use the web interface:

```
python app.py
```

Then open your browser and navigate to `http://127.0.0.1:5000`

## Project Structure

- `main.py` - Core AI functionality using the Groq API
- `app.py` - Flask web server for the web interface
- `templates/index.html` - Web UI template
- `requirements.txt` - Project dependencies
- `.env` - Environment variables (API key)

## License

This project is open source and available for personal and commercial use.

## Acknowledgements

- Powered by [Groq](https://groq.com) and the llama-4-scout model
- Built with [Flask](https://flask.palletsprojects.com/)