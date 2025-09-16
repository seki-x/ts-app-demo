<template>
    <div class="tool-call">
        <div class="tool-header">
            <span class="tool-name">
                {{ toolData.icon }} <strong>{{ toolData.displayName }}</strong>
            </span>
            <span class="tool-state" :class="`state-${toolData.state}`">
                {{ toolData.state }}
            </span>
        </div>

        <!-- Tool input -->
        <div v-if="toolData.input" class="tool-section">
            <strong>Input:</strong>
            <div class="tool-content">
                <pre>{{ JSON.stringify(toolData.input, null, 2) }}</pre>
            </div>
        </div>

        <!-- Tool output -->
        <div v-if="toolData.output" class="tool-section">
            <strong>Output:</strong>
            <div class="tool-content">
                <pre>{{ JSON.stringify(toolData.output, null, 2) }}</pre>
            </div>
        </div>

        <!-- Tool error -->
        <div v-if="toolData.error" class="tool-error">
            <strong>Error:</strong>
            <span>{{ toolData.error }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
interface ToolData {
    name: string
    displayName: string
    icon: string
    state: string
    input?: any
    output?: any
    error?: string
}

defineProps<{
    toolData: ToolData
}>()
</script>

<style scoped>
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
</style>
