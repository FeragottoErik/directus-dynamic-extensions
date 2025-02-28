function returnFieldValue(field: string, newValues: Record<string, any>, defaultValues: Record<string, any>): string {
    if (!field) return '';

    field = field.trim();

    if (field.startsWith('"') && field.endsWith('"')) {
        return field.slice(1, -1).replace(/\\"/g, '"');
    }

    const { value: newValue, found: foundNew } = findValueByPath(newValues, field);

    if (foundNew && newValue !== null) {
        // If the value is an object, serialize it to a string
        return (typeof newValue === 'object') ? JSON.stringify(newValue) : String(newValue);
    }

    const { value: defaultValue, found: foundDefault } = findValueByPath(defaultValues, field);

    if (foundDefault) {
        return (typeof defaultValue === 'object') ? JSON.stringify(defaultValue) : String(defaultValue);
    }

    return field;
}

export function replacePlaceholders(code: string, newValues: Record<string, any>, defaultValues: Record<string, any>): string {
    const placeholderRegex = /{{\$\bCURRENT_ITEM(\.[^}]+)*}}/g;

    return code.replace(placeholderRegex, (match) => {
        const cleanField = match.slice(2, -2).replace(/^\$CURRENT_ITEM\./, '');
        const fieldValue = returnFieldValue(cleanField, newValues, defaultValues);
        return fieldValue;
    });
}

export const findValueByPath = (obj: Record<string, any>, path: string) => {
    if (!obj) return { value: null, found: false };
    let value = obj;
    for (const i of path.split('.')) {
        if (value && typeof value === 'object' && i in value) {
            value = value[i];
        } else {
            return { value: null, found: false };
        }
    }
    return { value, found: true };
};

export async function executeCodeBackend(code: string, debugMode: boolean = false): Promise<any> {
    try {
        // Basic security check for dangerous patterns
        const dangerousPatterns = [
            'process.',
            'require(',
            'import(',
            'eval(',
            ' Function(',
            '__dirname',
            '__filename',
            'global.',
        ];

        if (dangerousPatterns.some(pattern => code.includes(pattern))) {
            throw new Error('Potentially unsafe code pattern detected, ensure the code does not contain any of the following patterns: ' + dangerousPatterns.join(', '));
        }

        // Set up a controlled execution context
        const context = {
            console: {
                log: (...args: any[]) => debugMode && console.log(...args),
                error: (...args: any[]) => debugMode && console.error(...args),
                warn: (...args: any[]) => debugMode && console.warn(...args),
                info: (...args: any[]) => debugMode && console.info(...args)
            },
            // Add other safe globals here
        };

        // Wrap the input code in an IIFE
        const wrappedCode = `
            "use strict";
            return (async () => {
                ${code}
            })()
        `;

        // Create a safe execution function with limited context
        const safeFunction = new Function(
            ...Object.keys(context),
            wrappedCode
        );

        // Execute the function with the safe context
        const result = await safeFunction(...Object.values(context));
        if (debugMode) {
            console.log('/run-script Execution result:', result);
        }
        return result;

    } catch (error) {
        if (debugMode) {
            console.error('/run-script Error executing code:', error);
        }
        throw new Error(`Script execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}