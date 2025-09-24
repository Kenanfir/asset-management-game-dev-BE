import { generate } from 'openapi-typescript-codegen';
import { join } from 'path';

async function generateClient() {
    console.log('🚀 Starting TypeScript client generation...');

    try {
        const input = join(process.cwd(), 'openapi.json');
        const output = join(process.cwd(), 'client');

        await generate({
            input,
            output,
            clientName: 'AssetManagementApiClient',
            httpClient: 'fetch',
            useOptions: true,
            useUnionTypes: true,
            exportSchemas: true,
            exportServices: true,
            exportModels: true,
            exportCore: true,
        });

        console.log(`✅ TypeScript client generated in: ${output}`);
    } catch (error) {
        console.error('❌ Failed to generate client:', error);
        process.exit(1);
    }
}

generateClient();
