import type { Request, Response, SandboxEndpointRouter } from 'directus:api';
import prettier from 'prettier';
import { executeCodeBackend, replacePlaceholders } from './endpointutils';

// Define interfaces for the request body types
interface ValueWrapper<T> {
    value: T;
}

interface RequestBody {
    codeSnippet: ValueWrapper<string>;
    newValues: ValueWrapper<Record<string, any>>;
    defaultValues: ValueWrapper<Record<string, any>>;
    debugMode?: ValueWrapper<boolean>;
}

// Add Prettier configuration
const PRETTIER_CONFIG: prettier.Options = {
    parser: 'babel',
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
    printWidth: 100,
};

export default (router: SandboxEndpointRouter): void => {
    router.post('/run-script', async (req: Request, res: Response) => {
        const {
            codeSnippet,
            newValues,
            defaultValues,
            debugMode = { value: false }
        } = req.body as RequestBody;

        try {
            // ... existing code ...
            if (!codeSnippet || !newValues || !defaultValues) {
                return res.status(400).json({
                    error: 'Missing required objects: codeSnippet, newValues, and defaultValues are all required.',
                });
            }

            if (debugMode.value) {
                console.log('Received Request:', req.body);
            }

            // Validate that values exist and are strings or objects
            if (typeof codeSnippet.value !== 'string') {
                return res.status(400).json({
                    error: 'codeSnippet.value must be a string',
                    received: typeof codeSnippet.value
                });
            }

            if (typeof newValues.value !== 'object' || newValues.value === null) {
                return res.status(400).json({
                    error: 'newValues.value must be an object',
                    received: typeof newValues.value
                });
            }

            if (typeof defaultValues.value !== 'object' || defaultValues.value === null) {
                return res.status(400).json({
                    error: 'defaultValues.value must be an object',
                    received: typeof defaultValues.value
                });
            }

            let processedCode: string;
            try {
                processedCode = replacePlaceholders(codeSnippet.value, newValues.value, defaultValues.value);
            } catch (placeholderError) {
                return res.status(400).json({
                    error: 'Failed to process placeholders: ' + (placeholderError as Error).message
                });
            }

            let formattedCode: string = processedCode;
            try {
                formattedCode = await prettier.format(processedCode, PRETTIER_CONFIG);
                if (debugMode.value) {
                    console.log('Code formatted successfully');
                    console.log(formattedCode);
                }
            } catch (formattingError) {
                if (debugMode.value) {
                    console.warn('Prettier formatting failed:', (formattingError as Error).message);
                    console.warn('Using unformatted code instead');
                }
            }

            let result: any;
            try {
                result = await runBackend(formattedCode, debugMode.value);
            } catch (executionError) {
                return res.status(500).json({
                    error: 'Code execution failed: ' + (executionError as Error).message,
                    details: process.env.NODE_ENV === 'development' ? (executionError as Error).stack : undefined
                });
            }

            if (result === undefined) {
                return res.status(500).json({
                    error: 'Code execution returned no result'
                });
            }

            if (result === null) {
                console.log('Code execution returned null, if this is not expected, check the code');
            }

            return res.json({
                success: true,
                result: result,
            });

        } catch (error) {
            // Enhanced error logging
            if (debugMode?.value) {
                console.error('Error in /run-script:', error);
            }

            return res.status(500).json({
                success: false,
                error: (error as Error).message || 'Something went wrong.',
                details: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
            });
        }
    });
};

async function runBackend(codeString: string, debugMode: boolean = false): Promise<any> {
    try {
        // Check if code string is empty or only whitespace
        if (!codeString || codeString.trim() === '') {
            if (debugMode) {
                console.log('/run-script Code string cannot be empty');
            }
            throw new Error('Code string cannot be empty');
        }

        // Remove any leading/trailing whitespace
        codeString = codeString.trim();

        // Ensure code string contains valid function syntax
        if (!codeString.includes('=>') && !codeString.includes('function')) {
            if (debugMode) {
                console.log('/run-script Code string must contain a valid function definition');
            }
            throw new Error('Code string must contain a valid function definition');
        }

        // Basic syntax validation - check for matching parentheses/braces
        const openBraces = (codeString.match(/[{(]/g) || []).length;
        const closeBraces = (codeString.match(/[})]/g) || []).length;
        if (openBraces !== closeBraces) {
            if (debugMode) {
                console.log('/run-script Code contains mismatched parentheses or braces');
            }
            throw new Error('Code contains mismatched parentheses or braces');
        }

        if (debugMode) {
            console.log('/run-script Executing backend code:');
            console.log(codeString);
        }

        try {
            const result = await executeCodeBackend(codeString, debugMode);
            if (result === undefined) {
                throw new Error('Code execution returned no result');
            }
            return result;
        } catch (executionError) {
            if (debugMode) {
                console.error('/run-script Runtime error:', executionError);
                console.error('Code that caused error:', codeString);
            }
            // Enhance error message with more context
            const errorMessage = (executionError as Error).message || 'Unknown execution error';
            throw new Error(`Runtime error executing code: ${errorMessage}`);
        }

    } catch (error) {
        if (debugMode) {
            console.error('/run-script Error executing backend code:', (error as Error).message);
        }
        // Preserve original error but add context if needed
        if (!(error as Error).message.includes('/run-script')) {
            (error as Error).message = `/run-script Error: ${(error as Error).message}`;
        }
        throw error;
    }
} 
