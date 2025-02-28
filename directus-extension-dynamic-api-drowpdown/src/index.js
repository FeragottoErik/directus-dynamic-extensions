import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'dynamic-dropdown-api',
	name: 'Dynamic Dropdown API',
	icon: 'phone_callback',
	description: 'Interface that enables to populate the choiches of a dropdown based on the answer of an API call to which the content of target field in the form is passed as a parameter',
	component: InterfaceComponent,
	types: ['string', 'integer', 'float', 'decimal', 'bigInteger', 'json'],
	options: [
		{
			field: 'apiUrl',
			name: '$t:operations.request.url',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
				options: {
					placeholder: '$t:operations.request.url_placeholder',
				},
			},
		},
		{
			field: 'method',
			name: '$t:operations.request.method',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{ value: 'GET', text: 'GET' },
						{ value: 'POST', text: 'POST' },
						{ value: 'PATCH', text: 'PATCH' },
						{ value: 'DELETE', text: 'DELETE' },
					],
					allowOther: true,
				},
			},
			schema: {
				default_value: 'GET',
			},
		},
		{
			field: 'headers',
			name: '$t:operations.request.headers',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'list',
				options: {
					fields: [
						{
							field: 'header',
							name: '$t:operations.request.header',
							type: 'string',
							meta: {
								width: 'half',
								interface: 'input',
								required: true,
								options: {
									placeholder: '$t:operations.request.header_placeholder',
								},
							},
						},
						{
							field: 'value',
							name: '$t:value',
							type: 'string',
							meta: {
								width: 'half',
								interface: 'input',
								required: true,
								options: {
									placeholder: '$t:operations.request.value_placeholder',
								},
							},
						},
					],
				},
			},
		},
		{
			field: 'body',
			name: '$t:request_body',
			type: 'text',
			meta: {
				width: 'full',
				interface: 'input-multiline',
				options: {
					font: 'monospace',
					placeholder: '$t:any_string_or_json',
				},
			},
		},
		{
			field: 'targetField',
			name: 'Target Field Body',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input-text',
				note: 'If not null ovewrites the body of the request with the value of the target field within the form',
			},
			schema: {
				is_nullable: true
			}
		},
		{
			field: 'formattingDisplay',
			name: 'Formatting Function (Display)',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: {
					language: 'javascript',
					placeholder: 'Enter JavaScript function for display formatting',
				},
			},
		},
		{
			field: 'placeholder',
			name: '$t:placeholder',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'system-input-translated-string',
				options: {
					placeholder: '$t:enter_a_placeholder',
				},
			},
		},
		{
			field: 'allowNone',
			name: '$t:interfaces.select-dropdown.allow_none',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:interfaces.select-dropdown.allow_none_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'debugMode',
			name: 'Debug Mode',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				note: 'Enables logging to the console for debugging and troubleshooting interface behavior.',
			},

		}]
});
