import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'emit-values-from-fields',
	name: 'Emit Values from Fields',
	icon: 'outgoing_mail',
	description: 'Emit values from fields on the main item to be used in other fields',
	component: InterfaceComponent,
	types: ['json', 'string'],
	group: 'other',
	options: [
		{
			field: 'fieldsMessages',
			name: 'Fields and Messages',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'input-code',
				note: "The key value pair for the fields to be emitted with values the message to be emitted. If = {} Nothing will be emitted.",
				options: {
					language: 'json',
				},
			},
			schema: {
				default_value: `{
				"field1": "message1",
				"field2": "message2"
			}`,
				is_nullable: false
			}
		},
		{
			field: 'debugMode',
			name: 'Debug Mode',
			type: 'boolean',
			meta: {
				width: 'full',
				interface: 'boolean',
				note: 'Used for debugging the code snippet. It will show a specific rather than a generic error on the field and log to console the rised errors and intermediate results.',
			},
			schema: {
				default_value: false,
				is_nullable: false
			}
		},
		{
			field: 'customCss',
			name: 'Custom CSS',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: {
					language: 'json',
				},
				note: 'Ensure there is no conflict between custom CSS and defined here and the one set globally in the Appearance settings.',
			},
			schema: {
				default_value: `{
	\"backgroundColor\": \"lightblue\",
	\"padding\": \"20px\",
	\"border\": \"2px solid black\",
	\"borderRadius\": \"10px\",
	\"fontSize\": \"16px\",
	\"color\": \"darkblue\"
}`,
				is_nullable: true
			}

		},
	]
});
