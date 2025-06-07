from flask import Flask, render_template, request, jsonify
from main import generate_response

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/dokai')
def dokai_page():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    web_search_enabled = data.get('webSearchEnabled', False)
    
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400
    
    # Generate response using the function from main.py, passing the web search state
    ai_response = generate_response(user_message, web_search_enabled)
    
    return jsonify({
        'response': ai_response
    })

@app.route('/index.html')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    import os
    if not os.path.exists('templates'):
        os.makedirs('templates')
    
    # Create static directory if it doesn't exist
    if not os.path.exists('static'):
        os.makedirs('static')
    
    app.run(debug=True)