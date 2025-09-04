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

        <!-- AI Chat -->
        <div class="demo-section">
            <h2>AI Chat (Claude)</h2>

            <!-- Connection Warning -->
            <div v-if="connectionStatus !== 'connected'" class="connection-warning"
                :class="`warning-${connectionStatus}`">
                <strong>{{ getStatusIcon() }} {{ getStatusText() }}</strong>
                <span v-if="errorMessage"> - {{ errorMessage }}</span>
                <br>
                <small>Chat may not work properly. Click status to retry connection.</small>
            </div>

            <div class="chat-messages">
                <div v-for="(msg, index) in messages" :key="msg.id || index" :class="['message', msg.role]">
                    <strong>{{ msg.role === 'user' ? 'You' : 'Claude' }}:</strong>

                    <!-- Render text content from message parts -->
                    <div v-for="(part, partIndex) in msg.parts || []" :key="partIndex">
                        <span v-if="part.type === 'text' && part.text">{{ part.text }}</span>
                    </div>
                </div>

                <!-- Loading indicator -->
                <div v-if="isLoading" class="message assistant loading">
                    <strong>Claude:</strong>
                    <span>{{ chatStatus === 'submitted' ? 'Thinking...' : 'Typing...' }}</span>
                </div>
            </div>

            <form @submit="handleSubmit" class="chat-form">
                <input v-model="input" placeholder="Ask Claude anything..."
                    :disabled="isLoading || connectionStatus === 'disconnected'" />
                <button type="submit" :disabled="isLoading || connectionStatus === 'disconnected'">
                    {{
                        isLoading
                            ? (chatStatus === 'submitted' ? 'Sending...' : 'Receiving...')
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
import { useOfficialAiChat } from './composables/useOfficialAiChat'
import { useConnectionStatus } from './composables/useConnectionStatus'

// Use composables
const { message, fetchMessage } = useOriginalDemo()
const { messages, input, isLoading, handleSubmit, status: chatStatus } = useOfficialAiChat()
const {
    status: connectionStatus,
    lastChecked,
    errorMessage,
    checkConnection,
    getStatusColor,
    getStatusText,
    getStatusIcon
} = useConnectionStatus()

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

.chat-messages {
    height: 300px;
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
