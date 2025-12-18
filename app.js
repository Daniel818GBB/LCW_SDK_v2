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

// DOM Elements
const chatContainer = document.getElementById('chat-widget-container');
const chatToggle = document.getElementById('chatToggle');
const closeBtn = document.getElementById('closeBtn');
const minimizeBtn = document.getElementById('minimizeBtn');
const downloadBtn = document.getElementById('downloadBtn');
const sendBtn = document.getElementById('sendBtn');
const messageInput = document.getElementById('messageInput');
const chatMessages = document.getElementById('chatMessages');
const attachBtn = document.getElementById('attachBtn');
const emojiBtn = document.getElementById('emojiBtn');
const voiceBtn = document.getElementById('voiceBtn');
const agentNameEl = document.getElementById('agentName');
const agentStatusEl = document.getElementById('agentStatus');

// Initialize Chat SDK
async function initializeChat() {
    try {
        if (!window.OmnichannelChatSDK) {
            console.error('Chat SDK not loaded');
            return;
        }

        // Create SDK instance
        chatSDK = new window.OmnichannelChatSDK.OmnichannelChatSDK(omnichannelConfig);

        // Initialize
        await chatSDK.initialize();
        console.log('Chat SDK initialized successfully');

        // Setup message listeners
        setupMessageListeners();

        // Start chat
        await startChatSession();
    } catch (error) {
        console.error('Error initializing chat:', error);
        addSystemMessage('Failed to initialize chat. Please refresh the page.');
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
        
        // Fetch and display agent details
        await updateAgentInfo();
    } catch (error) {
        console.error('Error starting chat:', error);
        addSystemMessage('Error starting chat session.');
    }
}

// Update agent information from SDK
async function updateAgentInfo() {
    try {
        const conversationDetails = await chatSDK.getConversationDetails();
        console.log('Conversation Details:', conversationDetails);

        if (conversationDetails) {
            // Update agent name if available
            if (conversationDetails.agentName) {
                agentNameEl.textContent = conversationDetails.agentName;
                
                // Update agent avatar with initials
                const initials = getInitials(conversationDetails.agentName);
                document.querySelector('.agent-avatar').textContent = initials;
            }

            // Update agent status if available
            if (conversationDetails.agentPresenceStatus) {
                const statusMap = {
                    'online': 'Online',
                    'away': 'Away',
                    'busy': 'Busy',
                    'dnd': 'Do Not Disturb',
                    'offline': 'Offline'
                };
                agentStatusEl.textContent = statusMap[conversationDetails.agentPresenceStatus] || 'Online';
            }

            // You can also access other details:
            // - conversationDetails.canDownloadTranscript
            // - conversationDetails.isTranscriptDownloadFailedToInitialize
            // - conversationDetails.reconnectContext
            // - conversationDetails.liveChatContext
        }
    } catch (error) {
        console.error('Error fetching agent info:', error);
        // Fallback to default values
        agentNameEl.textContent = 'Support Agent';
        agentStatusEl.textContent = 'Online';
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
        // Agent or Bot message
        const senderInfo = getSenderInfo(message);
        addAgentMessage(message.text, message.timestamp, senderInfo);
    } else if (message.messagetype === 'SystemMessage') {
        // System message
        addSystemMessage(message.text);
    } else if (message.metadata?.tags?.includes('MessageType:RichMessage')) {
        // Rich message (cards, etc.)
        addSystemMessage(message.text);
    }
}

// Get sender information including avatar and type
function getSenderInfo(message) {
    // Message structure based on SDK:
    // message.sender = { displayName: string, id: string, type: PersonType }
    // message.role = "bot" | "agent" | "system" | "user"
    
    const senderInfo = {
        name: message.sender?.displayName || 'Support',
        id: message.sender?.id || '',
        type: message.sender?.type || 'unknown', // 0=Unknown, 1=User, 2=Bot
        role: message.role || 'unknown', // 'bot', 'agent', 'system', 'user'
        avatar: null,
        isBot: message.role === 'bot' || message.sender?.type === 2
    };

    // Determine avatar
    if (senderInfo.isBot) {
        // Bot avatar - you can set a bot icon URL here
        // For now, we'll use bot emoji or initials with bot styling
        senderInfo.avatar = '🤖'; // Copilot/Bot emoji
    } else {
        // Agent avatar - use initials
        senderInfo.avatar = getInitials(senderInfo.name);
    }

    return senderInfo;
}

// Add agent message
function addAgentMessage(text, timestamp, senderInfo = {}) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message agent';
    
    // Use provided sender info or fallback to defaults
    const avatar = senderInfo.avatar || 'AG';
    const isBot = senderInfo.isBot || false;
    const avatarClass = isBot ? 'agent-avatar bot-avatar' : 'agent-avatar';
    
    messageEl.innerHTML = `
        <div class="${avatarClass}" title="${senderInfo.role || 'Agent'}">${avatar}</div>
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

    // Add message to UI
    addCustomerMessage(text);

    // Clear input
    messageInput.value = '';

    try {
        if (chatSDK) {
            await chatSDK.sendMessage({
                content: text
            });
        }
    } catch (error) {
        console.error('Error sending message:', error);
        addSystemMessage('Error sending message. Please try again.');
    }
}

// Toggle widget
function toggleWidget() {
    isWidgetOpen = !isWidgetOpen;

    if (isWidgetOpen) {
        chatContainer.classList.remove('chat-widget-hidden');
        chatToggle.classList.add('hidden');
    } else {
        chatContainer.classList.add('chat-widget-hidden');
        chatToggle.classList.remove('hidden');
        isMinimized = false;
        chatContainer.classList.remove('chat-widget-minimized');
    }
}

// Minimize widget
function minimizeWidget() {
    isMinimized = !isMinimized;
    
    if (isMinimized) {
        chatContainer.classList.add('chat-widget-minimized');
        minimizeBtn.textContent = '+';
    } else {
        chatContainer.classList.remove('chat-widget-minimized');
        minimizeBtn.textContent = '−';
    }
}

// Close widget
function closeWidget() {
    isWidgetOpen = false;
    isMinimized = false;
    chatContainer.classList.add('chat-widget-hidden');
    chatContainer.classList.remove('chat-widget-minimized');
    chatToggle.classList.remove('hidden');
    minimizeBtn.textContent = '−';
}

// Download transcript
async function downloadTranscript() {
    try {
        if (chatSDK) {
            const transcript = await chatSDK.getLiveChat​Transcript();
            // Create download
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
        addSystemMessage('Error downloading transcript.');
    }
}

// Handle attachment
function handleAttachment() {
    console.log('Attachment feature coming soon');
    addSystemMessage('File attachments are not yet supported in this demo.');
}

// Handle emoji
function handleEmoji() {
    console.log('Emoji picker coming soon');
    addSystemMessage('Emoji picker is not yet supported in this demo.');
}

// Handle voice
function handleVoice() {
    console.log('Voice message feature coming soon');
    addSystemMessage('Voice messages are not yet supported in this demo.');
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

// Event Listeners
chatToggle.addEventListener('click', toggleWidget);
closeBtn.addEventListener('click', closeWidget);
minimizeBtn.addEventListener('click', minimizeWidget);
downloadBtn.addEventListener('click', downloadTranscript);
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
attachBtn.addEventListener('click', handleAttachment);
emojiBtn.addEventListener('click', handleEmoji);
voiceBtn.addEventListener('click', handleVoice);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeChat();
});
