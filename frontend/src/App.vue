<template>
    <div>
        <h1>My Vue + TypeScript App</h1>
        <button @click="fetchMessage">Get Message from Backend</button>
        <p>{{ message }}</p>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// TypeScript knows these are strings!
const message = ref<string>('Click the button!')

// Define the API response type
interface ApiResponse {
    message: string
}

const fetchMessage = async (): Promise<void> => {
    try {
        const response = await fetch('http://localhost:8000/api/hello')
        const data: ApiResponse = await response.json()
        message.value = data.message
    } catch (error) {
        console.error('Error fetching message:', error)
    }
}
</script>