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
            <h2>AI Chat</h2>

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

// AI Chat interfaces
interface TextPart {
    type: 'text'
    text: string
}

interface UIMessage {
    id?: string
    role: 'user' | 'assistant'
    parts: TextPart[]
}

// AI Chat state
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

// ✅ Fixed: Parse SSE format properly
const handleSubmit = async (e: Event) => {
    e.preventDefault()
    if (!input.value.trim() || isLoading.value) return

    const userMessage = input.value.trim()

    // Add user message
    const userMsg: UIMessage = {
        role: 'user',
        parts: [{ type: 'text', text: userMessage }]
    }
    messages.value.push(userMsg)
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

        // Add empty assistant message
        const assistantMsg: UIMessage = {
            role: 'assistant',
            parts: [{ type: 'text', text: '' }]
        }
        messages.value.push(assistantMsg)
        const messageIndex = messages.value.length - 1

        // ✅ Parse Server-Sent Events properly
        const reader = response.body?.getReader()
        if (!reader) throw new Error('No reader available')

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            // Add new chunk to buffer
            buffer += decoder.decode(value, { stream: true })

            // Process complete lines
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // Keep incomplete line in buffer

            for (const line of lines) {
                // Parse SSE format: "data: {...}"
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6) // Remove "data: " prefix

                    // Skip special markers
                    if (dataStr === '[DONE]') {
                        console.log('✅ Stream completed')
                        continue
                    }

                    try {
                        const data = JSON.parse(dataStr)
                        console.log('📨 SSE Event:', data.type, data)

                        // Handle different event types
                        switch (data.type) {
                            case 'text-delta':
                                // Append text delta to the message
                                messages.value[messageIndex].parts[0].text += data.delta
                                break

                            case 'text-start':
                                console.log('🟢 Text stream started')
                                break

                            case 'text-end':
                                console.log('🔴 Text stream ended')
                                break

                            case 'finish':
                                console.log('🏁 Generation finished')
                                break

                            default:
                                console.log('ℹ️ Other event:', data.type)
                        }

                    } catch (parseError) {
                        console.warn('⚠️ Failed to parse SSE data:', dataStr, parseError)
                    }
                }
            }
        }

    } catch (error) {
        console.error('Chat error:', error)
        const errorMsg: UIMessage = {
            role: 'assistant',
            parts: [{ type: 'text', text: 'Sorry, something went wrong. Please try again.' }]
        }
        messages.value.push(errorMsg)
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
