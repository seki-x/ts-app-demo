<template>
    <div class="container">
        <h1>My Vue + Express + AI Demo</h1>

        <!-- Original Demo -->
        <div class="demo-section">
            <h2>Original Demo</h2>
            <button @click="fetchMessage">Get Message from Backend</button>
            <p>{{ message }}</p>
        </div>

        <!-- AI Chat -->
        <div class="demo-section">
            <h2>AI Chat</h2>

            <div class="chat-messages">
                <div v-for="(msg, index) in messages" :key="msg.id || index" :class="['message', msg.role]">
                    <strong>{{ msg.role === 'user' ? 'You' : 'Claude' }}:</strong>

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
import { useOriginalDemo } from './composables/useOriginalDemo'
import { useAiChat } from './composables/useAiChat'

// Use composables
const { message, fetchMessage } = useOriginalDemo()
const { messages, input, isLoading, handleSubmit } = useAiChat()
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
