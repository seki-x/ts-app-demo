<template>
    <div class="container">
        <!-- ... existing header and original demo ... -->

        <!-- AI Chat -->
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
                    <button v-for="(prompt, index) in examplePrompts" :key="index"
                        @click="sendExamplePrompt(prompt.text)" class="example-btn" :disabled="isLoading">
                        {{ prompt.icon }} {{ prompt.text }}
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
                        <div v-else-if="isToolPart(part)" class="tool-call">
                            <ToolCallDisplay :toolData="getToolData(part)" />
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
                <input v-model="input" placeholder="Ask about weather, time, or math..."
                    :disabled="isLoading || connectionStatus === 'disconnected'" />
                <button type="submit" :disabled="isLoading || connectionStatus === 'disconnected'">
                    {{ isLoading ? (chatStatus === 'submitted' ? 'Sending...' : 'Processing...') : 'Send' }}
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
import { useToolDisplay } from './composables/useToolDisplay'
import ToolCallDisplay from './components/ToolCallDisplay.vue'

// Use composables
useOriginalDemo()
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

const {
    examplePrompts,
    isToolPart,
    getToolData
} = useToolDisplay()

// Helper to send example prompts
const sendExamplePrompt = (prompt: string) => {
    if (isLoading.value) return
    chat.sendMessage({ text: prompt })
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

<!-- Simplified styles, tool styles moved to component -->
<style scoped>
.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

.tool-examples {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
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

/* ... rest of existing styles ... */
</style>
