document.addEventListener('DOMContentLoaded', function() {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const typingIndicator = document.getElementById('typing-indicator');
    const body = document.body;
    const voiceInputButton = document.getElementById('voice-input-button');
    const voiceOutputButton = document.getElementById('voice-output-button');
    const toggleDarkModeButton = document.getElementById('toggle-dark-mode');
    const toggleWebSearchButton = document.getElementById('toggle-web-search');

    // Helper function to add messages to the chat
    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', isUser ? 'user-message' : 'ai-message');
        messageDiv.textContent = content;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Show/Hide typing indicator (assuming these functions exist elsewhere or need to be added)
    function showTypingIndicator() {
        if (typingIndicator) typingIndicator.style.display = 'flex';
    }

    function hideTypingIndicator() {
        if (typingIndicator) typingIndicator.style.display = 'none';
    }

    // Load saved theme from localStorage and apply
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        if (toggleDarkModeButton) toggleDarkModeButton.checked = true;
    } else {
        body.classList.remove('dark-mode');
        if (toggleDarkModeButton) toggleDarkModeButton.checked = false;
    }

    // Theme switch event listener
    if (toggleDarkModeButton) {
        toggleDarkModeButton.addEventListener('change', function() {
            if (this.checked) {
                body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // Load saved web search state from localStorage and apply
    const savedWebSearchState = localStorage.getItem('webSearchEnabled');
    let webSearchEnabled = savedWebSearchState === 'true';
    if (toggleWebSearchButton) {
        toggleWebSearchButton.checked = webSearchEnabled;
    }

    // Web search switch event listener
    if (toggleWebSearchButton) {
        toggleWebSearchButton.addEventListener('change', function() {
            webSearchEnabled = this.checked;
            localStorage.setItem('webSearchEnabled', webSearchEnabled);
            console.log('Web Search Enabled:', webSearchEnabled);
        });
    }

    // Modify sendMessage to include webSearchEnabled state
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
    
        // Add user message to chat
        addMessage(message, true);
        userInput.value = '';
    
        // Show typing indicator
        showTypingIndicator();
    
        try {
            // Send message to backend, including webSearchEnabled state
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message, web_search_enabled: webSearchEnabled })
            });
    
            const data = await response.json();
            
            // Hide typing indicator and add AI response
            hideTypingIndicator();
            addMessage(data.response);
        } catch (error) {
            console.error('Error:', error);
            hideTypingIndicator();
            addMessage('Sorry, there was an error processing your request.');
        }
    }

    // Event listeners for sending message
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }
    if (userInput) {
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // Speech Synthesis setup
    if (voiceOutputButton) {
        voiceOutputButton.addEventListener('click', () => {
            // Find the last AI message and speak it
            const aiMessages = chatContainer.querySelectorAll('.ai-message');
            if (aiMessages.length > 0) {
                const lastAIMessage = aiMessages[aiMessages.length - 1].textContent;
                speakText(lastAIMessage);
            }
        });
    }

    function speakText(text) {
        if (window.speechSynthesis.speaking) {
            console.log('SpeechSynthesis is already speaking.');
            return;
        }
        if (text !== '') {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US'; // Set language
            window.speechSynthesis.speak(utterance);
        }
    }

    // Modify addMessage to speak AI responses if voice output is enabled
    const originalAddMessage = addMessage;
    addMessage = function(content, isUser = false) {
        originalAddMessage(content, isUser);
        if (!isUser && voiceOutputButton && !voiceOutputButton.disabled) { // Only speak AI messages if output is enabled
             // Add a small delay before speaking to allow message to appear
             setTimeout(() => {
                 speakText(content);
             }, 500);
        }
    }

    // Voice Input setup (assuming Web Speech API)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;
    let silenceTimeout = null;
    let audioContext = null;
    let microphone = null;

    if (recognition && voiceInputButton) {
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        voiceInputButton.addEventListener('click', () => {
            if (recognition.recognizing) {
                recognition.stop();
                voiceInputButton.classList.remove('active');
                userInput.classList.remove('voice-active');
                userInput.placeholder = 'Type your message here...';
                voiceInputButton.disabled = false;
            } else {
                try {
                    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
                        microphone = { mediaStream: stream }; // Store stream reference
                        audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        const source = audioContext.createMediaStreamSource(stream);
                        const processor = audioContext.createScriptProcessor(4096, 1, 1);

                        source.connect(processor);
                        processor.connect(audioContext.destination);

                        processor.onaudioprocess = function(e) {
                            const input = e.inputBuffer.getChannelData(0);
                            const sum = input.reduce((acc, val) => acc + Math.abs(val), 0);
                            if (sum / input.length < 0.01) { // Silence threshold
                                if (!silenceTimeout) {
                                    silenceTimeout = setTimeout(() => {
                                        recognition.stop();
                                    }, 2000);
                                } else {
                                    clearTimeout(silenceTimeout);
                                    silenceTimeout = null;
                                }
                            }
                        };

                        recognition.start();
                        voiceInputButton.classList.add('active');
                        userInput.classList.add('voice-active');
                        userInput.placeholder = 'Listening...';
                        voiceInputButton.disabled = false;

                    }).catch(err => {
                        console.error('Error accessing microphone:', err);
                        voiceInputButton.classList.remove('active');
                        userInput.classList.remove('voice-active');
                        userInput.placeholder = 'Type your message here...';
                        voiceInputButton.disabled = false;
                    });
                } catch (err) {
                    console.error('Error initializing voice input:', err);
                    voiceInputButton.disabled = true;
                    userInput.placeholder = 'Voice input not available';
                }
            }
        });

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            voiceInputButton.classList.remove('active'); // Remove active class
            userInput.classList.remove('voice-active'); // Remove voice-active class
            userInput.placeholder = 'Type your message here...'; // Restore placeholder
            voiceInputButton.disabled = false;
            // Optionally send message automatically after recognition
            // sendMessage();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            voiceInputButton.classList.remove('active'); // Remove active class
            userInput.classList.remove('voice-active'); // Remove voice-active class
            userInput.placeholder = 'Type your message here...'; // Restore placeholder
            voiceInputButton.disabled = false;
        };

        recognition.onstart = () => {
            console.log('Speech recognition started.');
            // Reset silence timeout when recognition starts
            clearTimeout(silenceTimeout);
        };

        recognition.onend = () => {
            console.log('Speech recognition ended.');
            voiceInputButton.classList.remove('active'); // Remove active class
            userInput.classList.remove('voice-active'); // Remove voice-active class
            userInput.placeholder = 'Type your message here...'; // Restore placeholder
            voiceInputButton.disabled = false;

            // Stop audio stream and close context
            if (microphone && microphone.mediaStream) {
                microphone.mediaStream.getTracks().forEach(track => track.stop());
            }
            if (audioContext && audioContext.state !== 'closed') {
                audioContext.close().catch(e => console.error('Error closing audio context:', e));
            }
            clearTimeout(silenceTimeout);
        };
    } else if (voiceInputButton) {
         voiceInputButton.disabled = true;
         userInput.placeholder = 'Voice input not available';
    }

});