<template>
	<!-- Always mounted container with computed logic -->
	<div :style="customCss">
		<!-- Hidden container for computed value -->
		<span class="run-script-value" style="display: none;">{{ computedValue }}</span>

		<!-- Visible elements based on mode -->
		<template v-if="!String($attrs.class || '').includes('hidden')">
			<div v-show="mode">
				<span class="run-script-value">{{ computedValue }}</span>
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
			<v-notice v-if="errorMsg" type="danger">{{ errorMsg }}</v-notice>
		</template>
	</div>
</template>

<script lang="ts">
import { useCollection } from '@directus/extensions-sdk';
import { ComputedRef, defineComponent, inject, onBeforeUnmount, ref, toRefs, watch } from 'vue';
import { useCollectionRelations, useDeepValues } from './utils';

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
		codeSnippet: {
			type: String,
			default: '',
		},
		mode: {
			type: String,
			default: 'saveanddisplay',
		},
		debugMode: {
			type: Boolean,
			default: false,
		},
		initialCompute: {
			type: Boolean,
			default: false,
		},
		refreshTime: {
			type: Number,
			default: 1,
		},
		computeOnce: {
			type: Boolean,
			default: true,
		},
		customCss: {
			type: Object,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		if (props.debugMode) {
			console.log("✅ Mounting interface for dynamic script runnner");
		}

		const defaultValues = useCollection(props.collection).defaults;
		const computedValue = ref<string | number | null>(props.value);
		const relations = useCollectionRelations(props.collection);
		const { collection, field, primaryKey } = toRefs(props);
		const values = useDeepValues(
			inject<ComputedRef<Record<string, any>>>('values')!,
			relations,
			collection,
			field,
			primaryKey,
			props.codeSnippet
		);
		const errorMsg = ref<string | null>(null);

		const computeTimeout = ref<number | null>(null);
		let computedOnce = false;

		if (values) {
			if (!props.initialCompute) {
				compute().then((newValue) => {
					computedValue.value = newValue;
					if (props.mode !== 'displayonly' && newValue !== props.value) {
						emit('input', newValue);
					}
				});
			}

			watch(values, async () => {
				if (computedOnce && props.computeOnce) {
					if (props.debugMode) console.log('⏭️ Skipping computation as computeOnce is true');
					return;
				} else if (props.computeOnce) {
					computedOnce = true;
				}

				// Clear previous timeout if any
				if (computeTimeout.value) {
					window.clearTimeout(computeTimeout.value);
					computeTimeout.value = null;
				}

				const updateValue = async () => {
					const newValue = await compute();
					if (newValue !== undefined && newValue !== computedValue.value) {
						computedValue.value = newValue;
						if (props.mode !== 'displayonly' && newValue !== props.value) {
							emit('input', newValue);
							if (props.debugMode) console.log('🔼 Emitting updated value:', newValue);
						}
					}
				};

				if (props.refreshTime === 0) {
					await updateValue();
				} else {
					computeTimeout.value = window.setTimeout(updateValue, props.refreshTime);
					if (props.debugMode) console.log(`⏳ Delaying computation by ${props.refreshTime}ms`);
				}
			}, {
				immediate: true,
				deep: true,
			});
		}

		onBeforeUnmount(async () => {
			if (computeTimeout.value) {
				window.clearTimeout(computeTimeout.value);
				computeTimeout.value = null;
			}

			const finalValue = await compute();
			if (finalValue !== undefined) {
				computedValue.value = finalValue;
				if (props.mode !== 'displayonly' && finalValue !== props.value) {
					emit('input', finalValue);
					if (props.debugMode) console.log('🗑️ Emitting final value before unmount:', finalValue);
				}
			}
		});

		return {
			computedValue,
			errorMsg,
		};

		async function compute() {
			if (props.debugMode) console.log("⚙️ Running computation for field:", props.field);

			try {
				const directusUrl = window.location.origin;
				const endpoint = `${directusUrl}/directus-extension-endpoint-run-script/run-script`;
				const response = await fetch(endpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						codeSnippet: { value: props.codeSnippet },
						newValues: { value: values.value },
						defaultValues: { value: defaultValues.value },
						debugMode: { value: props.debugMode },
					}),
				});

				if (!response.ok) {
					if (props.debugMode) {
						const errorText = await response.text();
						errorMsg.value = `HTTP error! status: ${response.status}. ${errorText}`;
					} else {
						errorMsg.value = 'Field computation failed';
					}
					return undefined;
				}

				const data = await response.json();

				if (!data || data.result === undefined) {
					if (props.debugMode) {
						console.error('Invalid response format from server:', data);
						errorMsg.value = 'Invalid response format from server';
					} else {
						errorMsg.value = 'Field computation failed';
					}
					return undefined;
				}

				if (data.error) {
					if (props.debugMode) {
						errorMsg.value = data.error;
					} else {
						errorMsg.value = 'Field computation failed';
					}
					return undefined;
				}

				errorMsg.value = null;
				return data.result;
			} catch (err: unknown) {
				if (err instanceof TypeError && err.message.includes('fetch')) {
					errorMsg.value = props.debugMode
						? `Unable to connect to server at ${window.location.origin}. Please check if the URL is correct and the server is running.`
						: 'Unable to connect to server. Please check the server URL.';
				} else if (props.debugMode) {
					console.error('Compute error:', err);
					errorMsg.value = err instanceof Error ? err.message : 'Unknown error';
				} else {
					errorMsg.value = 'Field computation failed';
				}
				return undefined;
			}
		}
	},
});
</script>
