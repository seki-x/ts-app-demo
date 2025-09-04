<template>
    <div>
        <h1>My Vue App</h1>
        <button @click="fetchMessage">Get Message from Backend</button>
        <p>{{ message }}</p>
    </div>
</template>

<script>
export default {
    data() {
        return {
            message: 'Click the button!'
        }
    },
    methods: {
        async fetchMessage() {
            const response = await fetch('http://localhost:8000/api/hello')
            const data = await response.json()
            this.message = data.message
        }
    }
}
</script>
