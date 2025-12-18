// Omnichannel Chat SDK Configuration
const omnichannelConfig = {
    orgUrl: "https://your-org.omnichannelengagement.dynamics.com", // Replace with your org URL
    orgId: "your-org-id", // Replace with your org ID
    widgetId: "your-widget-id" // Replace with your widget ID
};

let chatSDK = null;
let isWidgetOpen = false;
let isMinimized = false;
let messages = [];

// DOM Elements - will be initialized on DOMContentLoaded
let chatContainer, chatToggle, chatToggleWrapper, closeBtn, minimizeBtn, downloadBtn;
let sendBtn, messageInput, chatMessages, attachBtn, fileInput, voiceVideoBtn;
let agentNameEl, agentStatusEl;
let voiceVideoCallingSDK = null;

// Initialize Chat SDK
async function initializeChat() {
    try {
        if (!window.OmnichannelChatSDK) {
            console.warn('Chat SDK not loaded - this may be due to browser tracking prevention. Widget UI will still work.');
            return;
        }

        chatSDK = new window.OmnichannelChatSDK.OmnichannelChatSDK(omnichannelConfig);
        await chatSDK.initialize();
        console.log('Chat SDK initialized successfully');

        setupMessageListeners();
        await startChatSession();
        await initializeVoiceVideoCalling();
    } catch (error) {
        console.error('Error initializing chat:', error);
    }
}

// Setup message listeners
function setupMessageListeners() {
    if (chatSDK) {
        chatSDK.onNewMessage((message) => {
            handleNewMessage(message);
        });

        chatSDK.onTypingEvent((typingEvent) => {
            console.log('Agent typing...', typingEvent);
        });

        chatSDK.onAgentEndSession(() => {
            addSystemMessage('Agent has ended the session.');
        });
    }
}

// Start chat session
async function startChatSession() {
    try {
        await chatSDK.startChat();
        console.log('Chat session started');
        addSystemMessage('Chat session started. An agent will be with you shortly.');
        await updateAgentInfo();
    } catch (error) {
        console.error('Error starting chat:', error);
    }
}

// Update agent information from SDK
async function updateAgentInfo() {
    try {
        const conversationDetails = await chatSDK.getConversationDetails();
        if (conversationDetails && conversationDetails.agentName) {
            agentNameEl.textContent = conversationDetails.agentName;
            const initials = getInitials(conversationDetails.agentName);
            document.querySelector('.agent-avatar').textContent = initials;
        }
    } catch (error) {
        console.error('Error fetching agent info:', error);
    }
}

// Get initials from name
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.map(part => part[0].toUpperCase()).slice(0, 2).join('');
}

// Handle new messages
function handleNewMessage(message) {
    messages.push(message);
    if (message.messagetype === 'UserMessage' || message.messagetype === 'Message') {
        const senderInfo = getSenderInfo(message);
        addAgentMessage(message.text, message.timestamp, senderInfo);
    } else if (message.messagetype === 'SystemMessage') {
        addSystemMessage(message.text);
    }
}

// Get sender information
function getSenderInfo(message) {
    const senderInfo = {
        name: message.sender?.displayName || 'Support',
        role: message.role || 'unknown',
        avatar: null,
        isBot: message.role === 'bot' || message.sender?.type === 2
    };

    if (senderInfo.isBot) {
        senderInfo.avatar = '🤖';
    } else {
        senderInfo.avatar = getInitials(senderInfo.name);
    }

    return senderInfo;
}

// Add agent message
function addAgentMessage(text, timestamp, senderInfo = {}) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message agent';
    const avatar = senderInfo.avatar || 'AG';
    const isBot = senderInfo.isBot || false;
    const avatarClass = isBot ? 'message-avatar bot-avatar' : 'message-avatar';
    
    messageEl.innerHTML = `
        <div class="${avatarClass}">${avatar}</div>
        <div>
            <div class="message-bubble">${escapeHtml(text)}</div>
            <div class="message-time">${formatTime(timestamp)}</div>
        </div>
    `;
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add customer message
function addCustomerMessage(text, timestamp = null) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message customer';
    messageEl.innerHTML = `
        <div class="message-avatar customer-avatar">You</div>
        <div>
            <div class="message-bubble">${escapeHtml(text)}</div>
            <div class="message-time">${formatTime(timestamp || new Date())}</div>
        </div>
    `;
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add system message
function addSystemMessage(text) {
    if (!chatMessages) return;
    const messageEl = document.createElement('div');
    messageEl.className = 'system-message';
    messageEl.innerHTML = `<p>${escapeHtml(text)}</p>`;
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    addCustomerMessage(text);
    messageInput.value = '';

    try {
        if (chatSDK) {
            await chatSDK.sendMessage({ content: text });
        }
    } catch (error) {
        console.error('Error sending message:', error);
        addSystemMessage('Error sending message. Please try again.');
    }
}

// Download transcript
async function downloadTranscript() {
    try {
        if (chatSDK) {
            const transcript = await chatSDK.getLiveChatTranscript();
            const element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(transcript));
            element.setAttribute('download', 'chat-transcript.txt');
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }
    } catch (error) {
        console.error('Error downloading transcript:', error);
    }
}

// Initialize Voice/Video Calling
async function initializeVoiceVideoCalling() {
    try {
        if (!chatSDK) return;
        
        voiceVideoCallingSDK = await chatSDK.getVoiceVideoCalling();
        console.log('Voice/Video Calling SDK loaded');

        const chatToken = await chatSDK.getChatToken();
        
        await voiceVideoCallingSDK.initialize({
            chatToken,
            selfVideoHTMLElementId: 'selfVideo',
            remoteVideoHTMLElementId: 'remoteVideo',
            OCClient: chatSDK.OCClient
        });

        // Handle incoming calls
        voiceVideoCallingSDK.onCallAdded(() => {
            console.log('Incoming call...');
            addSystemMessage('Incoming voice/video call from agent...');
        });

        voiceVideoCallingSDK.onCallDisconnected(() => {
            console.log('Call disconnected');
            addSystemMessage('Voice/video call ended.');
        });

        console.log('Voice/Video Calling initialized');
    } catch (error) {
        console.log('Voice/Video Calling not available:', error.message);
        if (error.message === 'UnsupportedPlatform') {
            console.log('Voice/Video not supported on this platform');
        } else if (error.message === 'FeatureDisabled') {
            console.log('Voice/Video feature is disabled');
        }
    }
}

// Handle file attachment
async function handleAttachment() {
    fileInput.click();
}

// Handle file selection
async function handleFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    addSystemMessage(`Uploading file: ${file.name}...`);

    try {
        if (chatSDK) {
            await chatSDK.uploadFileAttachment(file);
            addSystemMessage(`File "${file.name}" uploaded successfully.`);
        } else {
            addSystemMessage('Cannot upload file - Chat SDK not connected.');
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        addSystemMessage(`Failed to upload file: ${error.message}`);
    }

    // Clear the input
    fileInput.value = '';
}

// Handle Voice/Video Call
async function handleVoiceVideoCall() {
    if (!voiceVideoCallingSDK) {
        addSystemMessage('Voice/Video calling is not available. Please ensure you are connected to an agent.');
        return;
    }

    try {
        // Check if there's an active call
        const isMuted = voiceVideoCallingSDK.isMicrophoneMuted();
        
        // If no call, show message
        addSystemMessage('Requesting voice/video call with agent...');
        
        // Note: The agent initiates the call, customer can accept/reject
        // This button is typically for accepting incoming calls
    } catch (error) {
        console.error('Voice/Video call error:', error);
        addSystemMessage('Voice/Video calling requires an active agent connection.');
    }
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utility: Format timestamp
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing chat widget...');
    
    // Get DOM Elements
    chatContainer = document.getElementById('chat-widget-container');
    chatToggle = document.getElementById('chatToggle');
    chatToggleWrapper = document.querySelector('.chat-toggle-wrapper');
    closeBtn = document.getElementById('closeBtn');
    minimizeBtn = document.getElementById('minimizeBtn');
    downloadBtn = document.getElementById('downloadBtn');
    sendBtn = document.getElementById('sendBtn');
    messageInput = document.getElementById('messageInput');
    chatMessages = document.getElementById('chatMessages');
    attachBtn = document.getElementById('attachBtn');
    fileInput = document.getElementById('fileInput');
    voiceVideoBtn = document.getElementById('voiceVideoBtn');
    agentNameEl = document.getElementById('agentName');
    agentStatusEl = document.getElementById('agentStatus');

    // Toggle widget
    function toggleWidget() {
        console.log('Toggle clicked!');
        isWidgetOpen = !isWidgetOpen;

        if (isWidgetOpen) {
            chatContainer.classList.remove('chat-widget-hidden');
            chatToggleWrapper.classList.add('hidden');
        } else {
            chatContainer.classList.add('chat-widget-hidden');
            chatToggleWrapper.classList.remove('hidden');
            isMinimized = false;
            chatContainer.classList.remove('chat-widget-minimized');
        }
    }

    // Close widget
    function closeWidget() {
        isWidgetOpen = false;
        isMinimized = false;
        chatContainer.classList.add('chat-widget-hidden');
        chatContainer.classList.remove('chat-widget-minimized');
        chatToggleWrapper.classList.remove('hidden');
        minimizeBtn.textContent = '-';
    }

    // Minimize widget
    function minimizeWidget() {
        isMinimized = !isMinimized;
        if (isMinimized) {
            chatContainer.classList.add('chat-widget-minimized');
            minimizeBtn.textContent = '+';
        } else {
            chatContainer.classList.remove('chat-widget-minimized');
            minimizeBtn.textContent = '-';
        }
    }

    // Event Listeners
    if (chatToggle) chatToggle.addEventListener('click', toggleWidget);
    if (closeBtn) closeBtn.addEventListener('click', closeWidget);
    if (minimizeBtn) minimizeBtn.addEventListener('click', minimizeWidget);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadTranscript);
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    if (attachBtn) attachBtn.addEventListener('click', handleAttachment);
    if (fileInput) fileInput.addEventListener('change', handleFileSelected);
    if (voiceVideoBtn) voiceVideoBtn.addEventListener('click', handleVoiceVideoCall);

    console.log('Chat widget UI initialized successfully');
    
    // Initialize chat SDK (optional - widget will still open without it)
    initializeChat();
});
