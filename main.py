import os
import groq
from dotenv import load_dotenv
import httpx  # Import httpx
import requests
from bs4 import BeautifulSoup

# Load environment variables from .env file
load_dotenv()

# Get API key from environment variables
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY not found in environment variables")

# Initialize httpx client with SSL verification disabled for troubleshooting
http_client = httpx.Client(verify=False)

# Initialize Groq client with the custom http_client
client = groq.Client(api_key=api_key, http_client=http_client)

def generate_response(
    prompt, 
    web_search_enabled=False, 
    model="llama-3.3-70b-versatile", 
    max_tokens=500
):
    """
    Generate a response using the Groq API with the specified model.
    
    Args:
        prompt (str): The user's input prompt
        web_search_enabled (bool): Whether to perform a web search before generating the response.
        model (str): The model to use (default: llama-4-scout)
        max_tokens (int): Maximum number of tokens to generate
        
    Returns:
        str: The generated response
    """
    
    scraped_info = ""
    if web_search_enabled:
        scraped_info = search_web(prompt)
        if scraped_info:
            prompt = f"Based on the following information: {scraped_info}\n\n{prompt}"

    try:
        # Call the Groq API
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are Dokai, a helpful AI assistant powered by Groq's llama-4-scout model. Provide concise and summarized responses."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens
        )
        
        # Extract and return the response text
        return response.choices[0].message.content
    
    except Exception as e:
        return f"Error generating response: {str(e)}"

def search_web(query):
    """
    Perform a basic web search and return scraped text.
    """
    


    try:
        # Use a search engine like DuckDuckGo Lite for simplicity
        search_url = f"https://lite.duckduckgo.com/lite/?q={requests.utils.quote(query)}"
        response = requests.get(search_url)
        response.raise_for_status() # Raise an exception for bad status codes
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract text from relevant parts of the page (e.g., paragraphs)
        paragraphs = soup.find_all('p')
        scraped_text = '\n'.join([p.get_text() for p in paragraphs])
        
        # Limit the amount of scraped text to avoid exceeding token limits
        return scraped_text[:1000] # Limit to first 1000 characters
        
    except Exception as e:
        print(f"Web search error: {e}")
        return ""


if __name__ == "__main__":

    # Simple command-line interface for testing
    print("Welcome to Dokai AI Assistant (powered by Groq's llama-4-scout)")
    print("Type 'exit' to quit")
    print("Choose an option: (1) AI Search Only, (2) Web Search + AI")
    
    while True:
        choice = input("Enter choice (1 or 2): ")
        if choice not in ['1', '2']:
            print("Invalid choice. Please enter 1 or 2.")
            continue
            
        user_input = input("\nYou: ")
        if user_input.lower() in ["exit", "quit"]:
            break
        
        web_search_enabled = (choice == '2')
        
        response = generate_response(user_input, web_search_enabled=web_search_enabled)
        print(f"\nDokai: {response}")
        print("\nEnter your next query (or 'exit' to quit):")
    
    print("\nThank you for using Dokai AI Assistant. Goodbye!")