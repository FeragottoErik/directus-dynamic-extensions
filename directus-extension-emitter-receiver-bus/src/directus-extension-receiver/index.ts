import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'receive-values-from-emitters',
	name: 'Receive Values from Emitters',
	icon: 'mark_as_unread',
	description: 'Receives values from Emitter fields and shows them in the interface',
	component: InterfaceComponent,
	types: ['json', 'string'],
	group: 'other',
	options: [
		{
			field: 'subscribeMessages',
			name: 'Messages to subscribe to',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: {
					language: 'json',
				},
				note: 'The messages scopes to subscribe to.'
			},
			schema: {
				default_value: `[
				"message1",
				"message2"
				]`,
				is_nullable: false
			}

		},
		{
			field: 'shownMessages',
			name: 'Dispalyed Messages',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: {
					language: 'json',
				},
				note: 'The key value pair for the messages to be displayed with values the sentence to be shown as prefix. If = {} Nothing will be shown.'
			},
			schema: {
				default_value: `{
				"message1": "This is the first message",
				"message2": "This is the second message"
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
