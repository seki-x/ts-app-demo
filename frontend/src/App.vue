<template>
    <div class="container">
        <!-- Connection Status Header -->
        <div class="status-header">
            <h1>My Vue + Express + AI Demo</h1>
            <div class="connection-status" @click="checkConnection">
                <span class="status-icon">{{ getStatusIcon() }}</span>
                <span class="status-text" :style="{ color: getStatusColor() }">
                    {{ getStatusText() }}
                </span>
                <span v-if="lastChecked" class="last-checked">
                    ({{ formatLastChecked }})
                </span>
                <div v-if="errorMessage && connectionStatus !== 'connected'" class="error-message">
                    {{ errorMessage }}
                </div>
            </div>
        </div>

        <!-- Original Demo -->
        <div class="demo-section">
            <h2>Original Demo</h2>
            <button @click="fetchMessage" :disabled="connectionStatus === 'disconnected'">
                Get Message from Backend
            </button>
            <p>{{ message }}</p>
        </div>

        <!-- AI Chat with Tools -->
        <div class="demo-section">
            <h2>AI Chat with Tools</h2>

            <!-- Connection Warning -->
            <div v-if="connectionStatus !== 'connected'" class="connection-warning"
                :class="`warning-${connectionStatus}`">
                <strong>{{ getStatusIcon() }} {{ getStatusText() }}</strong>
                <span v-if="errorMessage"> - {{ errorMessage }}</span>
                <br>
                <small>Chat may not work properly. Click status to retry connection.</small>
            </div>

            <!-- Tool Examples -->
            <div class="tool-examples">
                <h4>🛠️ Available Tools - Try asking:</h4>
                <div class="example-prompts">
                    <button @click="sendExamplePrompt('What\'s the weather in Tokyo?')" class="example-btn"
                        :disabled="isLoading">
                        🌤️ Weather in Tokyo
                    </button>
                    <button @click="sendExamplePrompt('What time is it in New York?')" class="example-btn"
                        :disabled="isLoading">
                        🕐 Time in New York
                    </button>
                    <button @click="sendExamplePrompt('Calculate 15 * 24 + 100')" class="example-btn"
                        :disabled="isLoading">
                        🔢 Math: 15 × 24 + 100
                    </button>
                    <button @click="sendExamplePrompt('Get weather in London and current time in London')"
                        class="example-btn" :disabled="isLoading">
                        🌍 Weather & Time in London
                    </button>
                </div>
            </div>

            <div class="chat-messages">
                <div v-for="(msg, index) in messages" :key="msg.id || index" :class="['message', msg.role]">
                    <strong>{{ msg.role === 'user' ? 'You' : 'Claude' }}:</strong>

                    <!-- Render message parts -->
                    <div v-for="(part, partIndex) in msg.parts || []" :key="partIndex">
                        <!-- Text parts -->
                        <span v-if="part.type === 'text' && part.text">{{ part.text }}</span>

                        <!-- Tool call parts -->
                        <div v-else-if="part.type && part.type.startsWith('tool-')" class="tool-call">
                            <div class="tool-header">
                                <span class="tool-name">
                                    {{ getToolIcon(part.type) }} <strong>{{ getToolName(part.type) }}</strong>
                                </span>
                                <span class="tool-state" :class="`state-${part.state || 'completed'}`">
                                    {{ part.state || 'completed' }}
                                </span>
                            </div>

                            <!-- Tool input -->
                            <div v-if="part.input" class="tool-section">
                                <strong>Input:</strong>
                                <div class="tool-content">
                                    <pre>{{ JSON.stringify(part.input, null, 2) }}</pre>
                                </div>
                            </div>

                            <!-- Tool output -->
                            <div v-if="part.output" class="tool-section">
                                <strong>Output:</strong>
                                <div class="tool-content">
                                    <pre>{{ JSON.stringify(part.output, null, 2) }}</pre>
                                </div>
                            </div>

                            <!-- Tool error -->
                            <div v-if="part.error" class="tool-error">
                                <strong>Error:</strong>
                                <span>{{ part.error }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Loading indicator -->
                <div v-if="isLoading" class="message assistant loading">
                    <strong>Claude:</strong>
                    <span>{{ chatStatus === 'submitted' ? 'Thinking...' : 'Working...' }}</span>
                </div>
            </div>

            <form @submit="handleSubmit" class="chat-form">
                <input v-model="input" placeholder="Ask about weather, time, math, or anything else..."
                    :disabled="isLoading || connectionStatus === 'disconnected'" />
                <button type="submit" :disabled="isLoading || connectionStatus === 'disconnected'">
                    {{
                        isLoading
                            ? (chatStatus === 'submitted' ? 'Sending...' : 'Processing...')
                            : 'Send'
                    }}
                </button>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOriginalDemo } from './composables/useOriginalDemo'
import { useAiChat } from './composables/useAiChat'
import { useConnectionStatus } from './composables/useConnectionStatus'

// Use composables
const { message, fetchMessage } = useOriginalDemo()
const { messages, input, isLoading, handleSubmit, status: chatStatus, chat } = useAiChat()
const {
    status: connectionStatus,
    lastChecked,
    errorMessage,
    checkConnection,
    getStatusColor,
    getStatusText,
    getStatusIcon
} = useConnectionStatus()

// Helper to send example prompts
const sendExamplePrompt = (prompt: string) => {
    if (isLoading.value) return
    chat.sendMessage({ text: prompt })
}

// Helper to extract tool name from part type
const getToolName = (partType: string): string => {
    const toolName = partType.replace('tool-', '')
    const nameMap: Record<string, string> = {
        'getWeather': 'Weather Lookup',
        'getCurrentTime': 'Time Check',
        'calculate': 'Calculator'
    }
    return nameMap[toolName] || toolName.replace(/([A-Z])/g, ' $1').trim()
}

// Helper to get tool icon
const getToolIcon = (partType: string): string => {
    const toolName = partType.replace('tool-', '')
    const iconMap: Record<string, string> = {
        'getWeather': '🌤️',
        'getCurrentTime': '🕐',
        'calculate': '🔢'
    }
    return iconMap[toolName] || '🛠️'
}

const formatLastChecked = computed(() => {
    if (!lastChecked.value) return ''

    const now = new Date()
    const diff = now.getTime() - lastChecked.value.getTime()
    const seconds = Math.floor(diff / 1000)

    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
})
</script>

<style scoped>
.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

.status-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #eee;
}

.status-header h1 {
    margin: 0;
}

.connection-status {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
}

.connection-status:hover {
    background: rgba(0, 0, 0, 0.05);
    transform: scale(1.02);
}

.status-icon {
    font-size: 1.2em;
    margin-right: 4px;
}

.status-text {
    font-weight: 600;
    font-size: 0.9em;
}

.last-checked {
    font-size: 0.75em;
    color: #666;
    margin-top: 2px;
}

.error-message {
    font-size: 0.75em;
    color: #ef4444;
    margin-top: 2px;
    text-align: right;
}

.connection-warning {
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 15px;
    font-size: 0.9em;
}

.warning-disconnected {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
}

.warning-error {
    background: #fff7ed;
    border: 1px solid #fed7aa;
    color: #ea580c;
}

.warning-checking {
    background: #fffbeb;
    border: 1px solid #fde68a;
    color: #d97706;
}

.demo-section {
    margin: 30px 0;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.tool-examples {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
}

.tool-examples h4 {
    margin: 0 0 10px 0;
    color: #495057;
}

.example-prompts {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.example-btn {
    background: #e9ecef;
    border: 1px solid #ced4da;
    border-radius: 4px;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 0.9em;
    transition: all 0.2s ease;
}

.example-btn:hover:not(:disabled) {
    background: #dee2e6;
    transform: translateY(-1px);
}

.example-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.chat-messages {
    height: 400px;
    overflow-y: auto;
    border: 1px solid #eee;
    padding: 10px;
    margin-bottom: 10px;
    background: #f9f9f9;
}

.message {
    margin: 8px 0;
    padding: 8px;
    border-radius: 4px;
}

.message.user {
    background: #e3f2fd;
    text-align: right;
}

.message.assistant {
    background: #f3e5f5;
}

.message.loading {
    opacity: 0.7;
    font-style: italic;
    animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 0.7;
    }

    50% {
        opacity: 1;
    }
}

.tool-call {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 12px;
    margin: 8px 0;
    font-size: 0.9em;
}

.tool-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 5px;
    border-bottom: 1px solid #dee2e6;
}

.tool-name {
    font-weight: 600;
}

.tool-state {
    font-size: 0.8em;
    padding: 2px 8px;
    border-radius: 12px;
    text-transform: capitalize;
}

.state-completed {
    background: #d4edda;
    color: #155724;
}

.state-streaming {
    background: #fff3cd;
    color: #856404;
}

.state-error {
    background: #f8d7da;
    color: #721c24;
}

.state-done {
    background: #d4edda;
    color: #155724;
}

.tool-section {
    margin: 8px 0;
}

.tool-content {
    margin-top: 4px;
}

.tool-content pre {
    background: #ffffff;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 8px;
    margin: 0;
    font-size: 0.8em;
    overflow-x: auto;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.tool-error {
    color: #dc3545;
    background: #f8d7da;
    border: 1px solid #f5c2c7;
    border-radius: 4px;
    padding: 8px;
    margin: 8px 0;
}

.chat-form {
    display: flex;
    gap: 10px;
}

.chat-form input {
    flex: 1;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.chat-form input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.chat-form button {
    padding: 8px 16px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.chat-form button:hover:not(:disabled) {
    background: #0056b3;
}

.chat-form button:disabled {
    background: #ccc;
    cursor: not-allowed;
}
</style>
