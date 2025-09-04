<template>
    <div class="container">
        <h1>My Vue + Express + AI Demo</h1>

        <!-- Original Demo -->
        <div class="demo-section">
            <h2>Original Demo</h2>
            <button @click="fetchMessage">Get Message from Backend</button>
            <p>{{ message }}</p>
        </div>

        <!-- New AI Chat -->
        <div class="demo-section">
            <h2>AI Chat (Claude 3.5 Sonnet)</h2>

            <div class="chat-messages">
                <div v-for="(msg, index) in messages" :key="msg.id || index" :class="['message', msg.role]">
                    <strong>{{ msg.role === 'user' ? 'You' : 'Claude' }}:</strong>

                    <!-- v5 uses parts array instead of content -->
                    <div v-for="(part, partIndex) in msg.parts" :key="partIndex">
                        <span v-if="part.type === 'text'">{{ part.text }}</span>
                    </div>
                </div>
            </div>

            <form @submit="handleSubmit" class="chat-form">
                <input v-model="input" placeholder="Ask Claude anything..." :disabled="isLoading" />
                <button type="submit" :disabled="isLoading">
                    {{ isLoading ? 'Thinking...' : 'Send' }}
                </button>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Original demo state
const message = ref<string>('Click the button!')

// AI Chat state - v5 UIMessage format
interface UIMessage {
    id?: string
    role: 'user' | 'assistant'
    parts: Array<{
        type: 'text'
        text: string
    }>
}

const messages = ref<UIMessage[]>([])
const input = ref<string>('')
const isLoading = ref<boolean>(false)

// Original demo function
const fetchMessage = async (): Promise<void> => {
    try {
        const response = await fetch('http://localhost:8000/api/hello')
        const data = await response.json()
        message.value = data.message
    } catch (error) {
        console.error('Error fetching message:', error)
    }
}

// AI Chat function - v5 format
const handleSubmit = async (e: Event) => {
    e.preventDefault()
    if (!input.value.trim() || isLoading.value) return

    const userMessage = input.value.trim()

    // Add user message in v5 format
    messages.value.push({
        role: 'user',
        parts: [{ type: 'text', text: userMessage }]
    })
    input.value = ''
    isLoading.value = true

    try {
        const response = await fetch('http://localhost:8000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: messages.value
            })
        })

        if (!response.ok) {
            throw new Error('Failed to get response')
        }

        // Read the streaming response
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let assistantMessage = ''

        // Add empty assistant message in v5 format
        messages.value.push({
            role: 'assistant',
            parts: [{ type: 'text', text: '' }]
        })
        const messageIndex = messages.value.length - 1

        while (reader) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            assistantMessage += chunk

            // Update the last message with streaming content
            messages.value[messageIndex].parts[0].text = assistantMessage
        }

    } catch (error) {
        console.error('Chat error:', error)
        messages.value.push({
            role: 'assistant',
            parts: [{ type: 'text', text: 'Sorry, something went wrong. Please try again.' }]
        })
    } finally {
        isLoading.value = false
    }
}
</script>

<style scoped>
.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
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

.chat-form button {
    padding: 8px 16px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.chat-form button:disabled {
    background: #ccc;
    cursor: not-allowed;
}
</style>
