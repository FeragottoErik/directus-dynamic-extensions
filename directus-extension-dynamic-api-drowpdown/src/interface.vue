<template>
	<v-menu attached :disabled="disabled" :close-on-content-click="true">
		<template #activator="{ active, activate }">
			<v-input
				v-model="searchQuery"
				:disabled="disabled"
				:placeholder="placeholder"
				:class="{ 'has-value': value }"
				:nullable="false"
				@focus="activate"
				@update:model-value="onInput"
			>
				<template #append>
					<v-icon v-if="value !== null" clickable name="close" @click="setDropdown(null)" />
					<v-icon
						v-else
						clickable
						name="expand_more"
						class="open-indicator"
						:class="{ open: active }"
						@click="activate"
					/>
				</template>
			</v-input>
		</template>

		<div class="content" :class="width">
			<v-list class="list">
				<v-list-item :disabled="value === null" @click="$emit('input', null)">
					<v-list-item-content>Deselect</v-list-item-content>
					<v-list-item-icon>
						<v-icon name="close" />
					</v-list-item-icon>
				</v-list-item>
				<v-divider />

				<v-list-item
					v-for="(item, index) in results"
					:key="JSON.stringify(item) + index"
					:active="value === item"
					:disabled="disabled"
					@click="setDropdown(item)"
				>
					<v-list-item-content>
						<span class="item-text">{{ outputFormat(item, formatForDisplay) }}</span>
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</div>
	</v-menu>
</template>

<script lang="ts">
import { useCollection } from '@directus/extensions-sdk';
import { computed, ComputedRef, defineComponent, inject, ref, toRefs, watch } from 'vue';
import { useCollectionRelations, useDeepValues } from './utils';

export default defineComponent({
	props: {
		value: {
			type: [String, Number, Object],
			default: null,
		},
		field: {
			type: String,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
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
		apiUrl: {
			type: String,
			required: true,
		},
		method: {
			type: String,
			default: 'GET',
		},
		headers: {
			type: Object,
			default: () => ({"Content-Type": "application/json"}),
		},
		body: {
			type: Object,
			default: () => ({}),
		},
		targetField: {
			type: String,
			default: ''
		},
		formattingDisplay: {
			type: Function,
			default: null,
		},
		allowNone: {
			type: Boolean,
			default: false,
		},
		debugMode: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: 'Select an item',
		},
		width: {
			type: String,
			required: true,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {

        if (props.debugMode) {
			console.log("✅ Mounting interface dynamic dropdown api");
			console.log("🔍 Props:", props);

		}

		const defaultFormValues = useCollection(props.collection).defaults;
		const relations = useCollectionRelations(props.collection);
		const { collection, field, primaryKey } = toRefs(props);
        const formattingDisplay = props.formattingDisplay || ((item: any) => item);


        const newFormValues = useDeepValues(
			inject<ComputedRef<Record<string, any>>>('values')!,
			relations,
			collection,
			field,
			primaryKey,
			props.targetField
		);

		let awaitingSearch = false;
		const results = ref([]);
		const searchQuery = ref('');

        const parseFunction = (func: any) => {
			try {
				if (!func) return null;

				if (typeof func === "function") {
					return func;
				}
				if (typeof func === "string") {
					return new Function("item", `return ${func}`);
				}
				return null;
			} catch (error) {
				console.warn("❌ Error parsing function:", error, "Function String:", func);
				return null;
			}
		};


		const formatForDisplay = computed(() => {
			return parseFunction(formattingDisplay);
		});

		async function fetchResults(){
			try {
					results.value = await retrieveData();

					if (props.debugMode) {
						console.log("📥 Results fetched and processed:", results.value);
					}

					if (realTimeValue != null && props.debugMode) {
						console.log("🔍 Value found:", realTimeValue.value)
					};

                    if(realTimeValue.value != null && searchQuery.value == ''){
                        let valueItem = results.value.find(item => item == realTimeValue.value);
						if (props.debugMode) {
							console.log("🔍 Value:", realTimeValue.value);
							};
                        if (realTimeValue.value) {
                            searchQuery.value = outputFormat(realTimeValue.value, formatForDisplay);
                        }
                    }
			} catch (err) {
				console.warn(err);
			}
		}

		// There is the need to wait for the actual value to be updated since props is a reactive object
		// and the value is not updated immediately
		let realTimeValue = ref(props.value);
		const timeoutId = ref<ReturnType<typeof setTimeout> | null>(null);

		watch(
			() => props.value,
			(newValue) => {
				if (timeoutId.value) clearTimeout(timeoutId.value);

				timeoutId.value = setTimeout(() => {
					realTimeValue.value = newValue; // Update only after timeout
					console.log("✅ Value updated:", realTimeValue.value);
					fetchResults(); // Fetch data after updating the value
				}, 100); // account for debouncing to avoid multiple fetches
			},
			{ immediate: true } // Run initially
		);


		return { results, setDropdown, searchQuery, onInput, primaryKey,  outputFormat, formatForDisplay};

        async function retrieveData(){
            if (props.debugMode) {
                console.log("🎯 Target field", props.targetField);
            }

            let requestBody = props.body;
            let url = props.apiUrl;
            if (props.debugMode) {
                console.log("🔍 API URL: ", url);
            }
            let requestOptions: RequestInit = {
                method: props.method,
                headers: { ...props.headers },
            };

            if (props.targetField) {
                const targetValue = newFormValues.value?.[props.targetField] || defaultFormValues.value?.[props.targetField];
                requestBody = { targetValue };
            }

            if (props.method !== 'GET') {
                requestOptions.body = JSON.stringify(requestBody);
            } else if (requestBody && Object.keys(requestBody).length > 0) {
                const queryParams = new URLSearchParams(requestBody as Record<string, string>).toString();
                url += `?${queryParams}`;
            }

            if (props.debugMode) {
                console.log(`🔍 Fetching results: ${props.method} ${url}`, requestOptions);
            }
            
            const response = await fetch(url, requestOptions);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            let data = await response.json();

            if (!Array.isArray(data)) {
                data = [data]; // Convert non-list response to a list
            }

			if (searchQuery.value && searchQuery.value.trim() !== "") {
				const searchTerm = searchQuery.value.toLowerCase(); // Always lowercase for case-insensitive matching
				const numericSearch = !isNaN(Number(searchQuery.value)) ? Number(searchQuery.value) : null;

				data = data.filter(item => {
					if (typeof item === "string") {
						return item.toLowerCase().includes(searchTerm);
					} else if (typeof item === "number") {
						return numericSearch !== null && item === numericSearch;
					} else if (typeof item === "object" && item !== null) {
						return Object.values(item).some(value => {
							if (typeof value === "string") {
								return value.toLowerCase().includes(searchTerm);
							} else if (typeof value === "number") {
								return numericSearch !== null && value === numericSearch;
							}
							return false;
						});
					}
					return false;
				});
			}

			return data;
        }

		function outputFormat(item: any, formatFunction: any) {
			//apply formatting and return the content as a string
			const result = applyFormatting(item, formatFunction);
			return String(result);
		}


		function applyFormatting(item: any, formatFunction: any) {
			try {
				if (typeof formatFunction !== 'function') {
					if (props.debugMode) {
						console.warn("❌ Invalid format function:", formatFunction);
					}
					try {
						return formatFunction.value(item);
					} catch (error) {
						console.log("Checking item", item)
						console.warn("❌ Error accessing function value:", error);
						return item; // return original item if function is invalid
					} 
				}
				if (props.debugMode) {
					console.log("✅ Item formatted: ", formatFunction(item));
				}
				return formatFunction(item);
			} catch (error) {
				console.warn("❌ Error executing formatting function:", error);
				return item;
			}
		}

        function onInput() {
			if (!awaitingSearch) {
				setTimeout(() => {
					fetchResults();
					awaitingSearch = false;
				}, 500); // 0.5 sec delay
			}

			awaitingSearch = true;
		}

		function setDropdown(item) {
			if(item == null){
				searchQuery.value = item;
				emit('input', item);
			} else {
				searchQuery.value = outputFormat(item, formatForDisplay);
				emit('input', item);
			}

			fetchResults();
		}

	},
});
</script>