import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'run-code-on-current-item-fields',
	name: 'Run Code on Current Item',
	icon: 'code',
	description: 'Perform real-time operations based on value of other fields of the current item',
	component: InterfaceComponent,
	types: ['string', 'text', 'integer', 'decimal', 'bigInteger', 'float', 'boolean', 'alias', 'date', 'dateTime', 'time'],
	group: 'other',
	options: [
		{
			field: 'codeSnippet',
			name: 'Code Snippet',
			type: 'text',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: {
					language: 'javascript',
				},
			},
			schema: {
				default_value: `function myCustomFunction(input1, input2) {
    // Some code
    return value;
}
return myCustomFunction(value1, value2);

// to address the current item fields, use the following syntax:
// {{$CURRENT_ITEM.field_name.subfield_name}}

`,
				is_nullable: false
			}
		},
		{
			field: 'mode',
			name: 'Field Mode',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'select-dropdown',
				options: {
					allowNone: false,
					choices: [
						{ text: 'Display Only', value: 'displayonly' },
						{ text: 'Save & Display', value: 'saveanddisplay' },
					],
				},
				note: 'Display only: the field result will be displayed only in the form and not saved in the database. Save & Display: the field result will be displayed in the form and saved in the database at the same time.',
			},
			schema: {
				default_value: 'saveanddisplay',
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
			field: 'initialCompute',
			name: 'Initial Compute',
			type: 'boolean',
			meta: {
				width: 'full',
				interface: 'boolean',
				note: 'Compute the value when opening the form rather than only when one of the addressed fields value is changed.',
			},
			schema: {
				default_value: true,
				is_nullable: false
			}
		},
		{
			field: 'refreshTime',
			name: 'Refresh Time',
			type: 'integer',
			meta: {
				width: 'full',
				interface: 'input-integer',
				options: {
					min: 1,
				},
				note: 'If set to 1, the script will be run exactly when one of the addressed fields value is changed, otherwise it will be run every X milliseconds.',
			},
			schema: {
				default_value: 10,
				is_nullable: false
			}
		},
		{
			field: 'computeOnce',
			name: 'Compute Only Once',
			type: 'boolean',
			meta: {
				width: 'full',
				interface: 'boolean',
				note: 'Compute the value only once when opening the form rather than each time the refresh time is reached.',
			},
			schema: {
				default_value: true,
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
	],
});
