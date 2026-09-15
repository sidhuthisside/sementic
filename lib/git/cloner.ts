
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = util.promisify(exec);

export async function cloneRepository(repoUrl: string, targetDir: string, token?: string): Promise<void> {
    try {
        // Ensure the parent directory exists
        const parentDir = path.dirname(targetDir);
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
        }

        // If target directory exists, check if it's a valid git repo or just delete it to be safe/fresh?
        // For a hackathon/MVP, let's try to pull if exists, or delete and re-clone.
        // Let's go with: delete and re-clone if we want fresh, OR pull if we want speed.
        // User asked: "next time it'll check if cloned or clone again".
        // Implicitly, if cloned, we assume it's good. 
        // But if we want to update? Maybe `git pull`?
        // For now, if it exists, we assume it is cloned. The CALLER logic will check existence.
        // This function simply clones. If dir exists, it might fail or we should clean it.

        if (fs.existsSync(targetDir)) {
            // Check if it is a git repo
            const gitDir = path.join(targetDir, '.git');
            if (fs.existsSync(gitDir)) {
                console.log(`Repository already exists at ${targetDir}. Pulling latest changes...`);
                // For pulling, we might need the token too if the origin URL doesn't have it.
                // But usually, the origin URL in .git/config is used.
                // If the original clone was public, and now it's private, pull might fail.
                // For simplicity, we assume the initial clone sets the remote correctly.
                // Use token if provided to update remote url? Complicated.
                // Just try pull.
                await execPromise(`git -c core.longpaths=true -C "${targetDir}" pull`);
                return;
            } else {
                // Exists but not a git repo? Remove it.
                console.warn(`Directory ${targetDir} exists but is not a git repo. Removing...`);
                fs.rmSync(targetDir, { recursive: true, force: true });
            }
        }

        console.log(`Cloning ${repoUrl} to ${targetDir}...`);

        let cloneUrl = repoUrl;
        if (token) {
            // Inject token into URL: https://TOKEN@github.com/user/repo
            // Assumes https url
            if (repoUrl.startsWith("https://")) {
                cloneUrl = repoUrl.replace("https://", `https://${token}@`);
            }
        }

        // Use a masked URL for logging to avoid leaking token
        const maskedUrl = cloneUrl.replace(token || "", "***");
        console.log(`Cloning from ${maskedUrl}...`);

        await execPromise(`git clone -c core.longpaths=true "${cloneUrl}" "${targetDir}"`);
        console.log(`Cloning complete.`);

    } catch (error) {
        console.error(`Failed to clone repository: ${error}`);
        throw error;
    }
}
