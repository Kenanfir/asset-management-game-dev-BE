import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from 'octokit';

@Injectable()
export class GithubService {
    private readonly logger = new Logger(GithubService.name);

    async updateFile(accessToken: string, repo: string, path: string, content: string, message: string): Promise<void> {
        const octokit = new Octokit({ auth: accessToken });
        let owner: string;
        let repoName: string;

        // Handle full URL (e.g., https://github.com/owner/repo)
        if (repo.includes('github.com')) {
            const match = repo.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?/);
            if (match) {
                owner = match[1];
                repoName = match[2];
            } else {
                throw new Error('Invalid GitHub repository URL');
            }
        } else {
            // Handle owner/repo format
            [owner, repoName] = repo.split('/');
        }

        if (!owner || !repoName) {
            throw new Error('Invalid repository format. Expected "owner/repo" or full GitHub URL');
        }

        try {
            // Check if file exists to get its SHA
            let sha: string | undefined;
            try {
                const { data } = await octokit.rest.repos.getContent({
                    owner,
                    repo: repoName,
                    path,
                });

                if (!Array.isArray(data) && data.sha) {
                    sha = data.sha;
                }
            } catch (error) {
                // File might not exist, which is fine for creation
                this.logger.debug(`File ${path} not found in ${repo}, creating new file.`);
            }

            // Create or update file
            await octokit.rest.repos.createOrUpdateFileContents({
                owner,
                repo: repoName,
                path,
                message,
                content: Buffer.from(content).toString('base64'),
                sha,
            });

            this.logger.log(`Successfully updated ${path} in ${repo}`);
        } catch (error) {
            this.logger.error(`Failed to update file in GitHub: ${error.message}`, error.stack);
            throw new Error(`Failed to update file in GitHub: ${error.message}`);
        }
    }
}
