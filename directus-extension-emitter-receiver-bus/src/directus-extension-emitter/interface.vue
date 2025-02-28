<template>
    <div :style="customCss">
        <span class="error-message" style="display: none;">{{ errorMessage }}</span>
        <template v-if="!String($attrs.class || '').includes('hidden')">
            <div v-show="mode">
                <span class="emitter-displayed-values">{{ displayedValues }}</span>
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
import { useCollection } from '@directus/extensions-sdk';
import eventBusWithMemory from 'shared-directus-eventbus-memory';
import { ComputedRef, PropType, computed, defineComponent, inject, onBeforeUnmount, ref, toRefs, watch } from 'vue';
import { useCollectionRelations, useDeepValues } from './utils';

export default defineComponent({
    props: {
        value: { type: [String, Number], default: null },
        field: { type: String, default: null },
        type: { type: String, default: null },
        collection: { type: String, default: '' },
        primaryKey: { type: [String, Number], default: '' },
        mode: { type: String, default: 'saveanddisplay' },
        fieldsMessages: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
        debugMode: { type: Boolean, default: false },
        customCss: { type: Object, default: null },
    },
    emits: ['input'],

    setup(props, { emit }) {
        if (props.debugMode) console.log("✅ Mounting values-emitter interface");

        const defaultValues = useCollection(props.collection).defaults;
        const relations = useCollectionRelations(props.collection);
        const { collection, field, primaryKey } = toRefs(props);
        const values = useDeepValues(
            inject<ComputedRef<Record<string, any>>>('values')!,
            relations,
            collection,
            field,
            primaryKey,
            props.fieldsMessages
        );

        if (props.debugMode) console.log("🔍 Initial values:", values.value);

        const previousValues = ref<Record<string, any>>({});
        const displayedValues = ref<Record<string, any>>({});
        const errorMessage = ref<string | null>(null);
        let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

        // Extract the tracked values
        const trackedValues = computed(() => {
            return Object.keys(props.fieldsMessages).reduce((obj, key) => {
                const keyParts = key.split('.'); 
                let target: any = values.value ?? defaultValues.value; 

                for (const part of keyParts) {
                    if (target && target.hasOwnProperty(part)) {
                        target = target[part];
                    } else {
                        target = null;
                        break;
                    }
                }

                obj[key] = target ?? null;

                if (props.debugMode) console.log(`🔍 Tracking ${key}:`, target);
                return obj;
            }, {} as Record<string, any>);
        });

        // Function to deeply compare two objects
        const deepEqual = (obj1: any, obj2: any): boolean => {
            if (obj1 === obj2) return true;
            if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
            if (!obj1 || !obj2) return false;

            const keys1 = Object.keys(obj1);
            const keys2 = Object.keys(obj2);

            if (keys1.length !== keys2.length) return false;

            for (const key of keys1) {
                if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
                    return false;
                }
            }
            return true;
        };

        // Debounced function to emit changes
        const emitChanges = () => {
            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }

            debounceTimeout = setTimeout(() => {
                let hasChanges = false;

                for (const key of Object.keys(props.fieldsMessages)) {
                    const newValue = trackedValues.value[key];
                    const messageKey = props.fieldsMessages[key];

                    if (!deepEqual(previousValues.value[key], newValue)) {
                        if (props.debugMode) console.log(`🔄 Value Changed - ${messageKey}:`, newValue);
                        eventBusWithMemory.emit(messageKey, newValue);
                        previousValues.value[key] = newValue;  // Update previous values
                        displayedValues.value[messageKey] = newValue; 
                        hasChanges = true;
                    }
                }

                if (hasChanges) {
                    if (props.debugMode) console.log("📢 Emitting updated values:", displayedValues.value);
                    emit('input', displayedValues.value);
                }
            }, 500); // Debounce time
        };

        // Watch the computed tracked values, applying debounce
        watch(trackedValues, emitChanges, { deep: true });

        // Initial Emit Logic (Executed Immediately at Mount)
        const initialEmit = () => {
            let initialChanges = false;

            for (const key of Object.keys(props.fieldsMessages)) {
                const messageKey = props.fieldsMessages[key];
                const initialValue = trackedValues.value[key] ?? null;

                if (props.debugMode) console.log("🚀 Initial Emit:", messageKey, initialValue);

                previousValues.value[key] = initialValue;
                displayedValues.value[messageKey] = initialValue;
                eventBusWithMemory.emit(messageKey, initialValue);
                initialChanges = true;
            }

            if (initialChanges) {
                emit('input', displayedValues.value);
            }
        };

        // Perform Initial Emit
        initialEmit();

        // Cleanup before unmount
        onBeforeUnmount(() => {
            if (debounceTimeout) clearTimeout(debounceTimeout);

            Object.values(props.fieldsMessages).forEach(messageKey => {
                eventBusWithMemory.off(messageKey);
            });

            if (props.debugMode) console.log("🗑️ Cleaned up event listeners.");
        });

        return {
            displayedValues,
            errorMessage,
        };
    },
});
</script>
