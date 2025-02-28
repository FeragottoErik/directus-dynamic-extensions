<template>
  <!-- Always mounted container with computed logic -->
  <div :style="customCss">
      <!-- Only show the emitted/displayed value or error message -->
      <span class="error-message" style="display: none;">{{ errorMessage }}</span>
      <template v-if="!String($attrs.class || '').includes('hidden')">
          <div v-show="mode">
              <span class="receiver-displayed-values">{{ displayedValues }}</span>
          </div>
          <v-input
              v-show="!mode"
              v-bind="$attrs"
              :field="field"
              :collection="collection"
              :primary-key="primaryKey"
              :model-value="value"
              @update:model-value="$emit('input', $event)"
          />
          <v-notice v-if="errorMessage" type="danger">{{ errorMessage }}</v-notice>
      </template>
  </div>
</template>

<script lang="ts">
import eventBusWithMemory from 'shared-directus-eventbus-memory';
import { defineComponent, onBeforeUnmount, onMounted, onUnmounted, ref } from 'vue';

export default defineComponent({
props: {
  value: {
    type: [String, Number],
    default: null,
  },
  field: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    default: null,
  },
  collection: {
    type: String,
    default: '',
  },
  primaryKey: {
    type: [String, Number],
    default: '',
  },
  mode: {
    type: String,
    default: 'saveanddisplay',
  },
  subscribeMessages: {
    type: Array,
    default: () => [],
  },
  shownMessages: {
    type: Object,
    default: () => ({}),
  },
  debugMode: {
    type: Boolean,
    default: false,
  },
  customCss: {
    type: Object,
    default: null,
  },
},

emits: ['input'],

setup(props, { emit }) {
  const errorMessage = ref('');
  const displayedValues = ref<Record<string, string>>({});
  const lastValues = ref<Record<string, string>>({});
  const activeListeners = new Map<string, () => void>();

  // Function to handle message subscriptions
  const handleMessages = () => {
    if (!Array.isArray(props.subscribeMessages) || props.subscribeMessages.length === 0) {
      errorMessage.value = '❌ Invalid or empty subscribeMessages array.';
      if (props.debugMode) console.log(errorMessage.value);
      return;
    }

    errorMessage.value = '';
    
    // Loop over each subscribe message and set up listeners
    for (const message of props.subscribeMessages) {
      if (activeListeners.has(message)) continue;  // Skip if already subscribed

      if (props.debugMode) console.log(`🔵 Subscribing to message: ${message}`);

      // Handler for when the message is received
      const handler = (value: unknown) => {
        const stringValue = String(value);
        const newValue = props.shownMessages[message]
          ? `${props.shownMessages[message]} ${stringValue}`
          : stringValue;

        if (props.debugMode) console.log(`📩 Received value for '${message}': ${stringValue}`);

        // Only update if the value has changed
        if (lastValues.value[message] !== newValue) {
          lastValues.value[message] = newValue;
          displayedValues.value = { ...lastValues.value };  // Update displayed values
          emit('input', { ...displayedValues.value });  // Emit updated value
          if (props.debugMode) console.log(`🔼 Emitting updated values:`, displayedValues.value);
        }
      };

      // Register the handler for the message
      eventBusWithMemory.on(message, handler);
      activeListeners.set(message, () => eventBusWithMemory.off(message, handler));

      // Fetch last known value and trigger handler if available
      const lastValue = eventBusWithMemory.getLastValue(message);
      if (lastValue !== undefined) {
        if (props.debugMode) console.log(`ℹ️ Fetching last known value for '${message}': ${lastValue}`);
        handler(lastValue);  // Call handler immediately with the last value
      }
    }
  };

  // Lifecycle hooks to manage subscriptions
  onMounted(() => {
    if (props.debugMode) console.log("✅ Mounting values-receiver interface");
    handleMessages();  // Subscribe to the messages
  });

  onBeforeUnmount(() => {
    emit('input', { ...displayedValues.value });  // Emit any final value before unmount
    if (props.debugMode) console.log('🗑️ Emitted Value before unmounting', displayedValues.value);
  });

  onUnmounted(() => {
    activeListeners.forEach((unsubscribe) => unsubscribe());  // Unsubscribe from all messages
    activeListeners.clear();
    if (props.debugMode) console.log("🗑️ Cleanup: Unsubscribed from all messages");
  });

  return {
    errorMessage,
    displayedValues,
  };
},
});
</script>
