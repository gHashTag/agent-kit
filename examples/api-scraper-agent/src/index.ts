import { ApifyClient } from 'apify-client';
import fs from 'fs/promises';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv');
import { InstagramPost } from './types';

export function createScraper(apiToken: string) {
  if (!apiToken) {
    throw new Error('API token is required');
  }

  return {
    async scrapeInstagram(url: string, options: { limit?: number; timeout?: number }): Promise<InstagramPost[]> {
      const client = new ApifyClient({ token: apiToken });
      let input: any;
      const isProfileUrl = !url.includes('/p/') && !url.includes('/reel/');
      console.log(`[DEBUG] URL: ${url}, isProfileUrl: ${isProfileUrl}`);

      if (isProfileUrl) {
        let username: string | null = null;
        try {
          const urlObject = new URL(url);
          // Ensure pathname starts with '/', remove it, then take the first part.
          const pathname = urlObject.pathname.startsWith('/') ? urlObject.pathname.substring(1) : urlObject.pathname;
          const usernameCandidate = pathname.split('/')[0];
          if (usernameCandidate && usernameCandidate.length > 0) {
            username = usernameCandidate;
            console.log(`[DEBUG] Extracted username: ${username} from URL: ${url}`);
          } else {
            console.warn(`[DEBUG] Could not extract username from path: ${urlObject.pathname} for URL: ${url}`);
          }
        } catch (e) {
          console.warn(`[DEBUG] Error parsing URL to extract username: ${url}`, e);
        }

        if (username) {
          console.log('[DEBUG] Profile URL identified. Using search/searchType.');
          console.log('[DEBUG] Profile URL identified. Using new Reels scraper actor.');
          input = {
            "username": [username],
            "resultsLimit": options.limit || 30 // Default limit for Reels scraper
            // proxyConfiguration is not explicitly listed for the new actor, assuming Apify handles it or it's not needed.
          };
        } else {
          console.error(`[DEBUG] Failed to extract username for profile URL: ${url}. Cannot proceed with scraping this URL as a profile.`);
          throw new Error(`Failed to extract username for profile URL: ${url}.`);
        }
      } else {
        // For specific post URLs (/p/ or /reel/)
        // The new Reels scraper (xMc5Ga1oCONPmWJIa) seems to be profile-oriented.
        // For individual Reels, we might need a different actor or approach.
        // For now, let's adapt to use the new actor if a Reel URL is passed, assuming it might work by extracting username.
        // This part might need further refinement based on actor capabilities for direct Reel URLs.
        console.log('[DEBUG] Reel URL identified. Attempting to use Reels scraper by extracting username.');
        let reelUsername: string | null = null;
        try {
          const urlObject = new URL(url);
          const pathname = urlObject.pathname.startsWith('/') ? urlObject.pathname.substring(1) : urlObject.pathname;
          // Assuming the username is the part before /reel/ or /p/
          // This is a heuristic and might not always be correct, e.g. if URL is not a direct profile post.
          // For instagram.com/username/reel/reel_id/ or instagram.com/username/p/post_id/
          const parts = pathname.split('/');
          if (parts.length > 1 && (parts.includes('reel') || parts.includes('p'))) {
            // Find the index of 'reel' or 'p'
            const postTypeIndex = parts.findIndex(part => part === 'reel' || part === 'p');
            if (postTypeIndex > 0) {
                reelUsername = parts[postTypeIndex -1]; // The part before 'reel' or 'p' is likely the username
            }
          }
          if (reelUsername) {
            console.log(`[DEBUG] Extracted username: ${reelUsername} from Reel/Post URL: ${url}`);
          } else {
            console.warn(`[DEBUG] Could not extract username reliably from Reel/Post URL: ${url}. The new actor might not support this direct URL format well.`);
          }
        } catch (e) {
          console.warn(`[DEBUG] Error parsing Reel/Post URL to extract username: ${url}`, e);
        }

        if (reelUsername) {
          input = {
            "username": [reelUsername],
            "resultsLimit": options.limit || 1 // For a single reel, though actor might fetch more from profile
          };
        } else {
          // Fallback or error if we can't determine a username for the Reels actor
          console.error(`[DEBUG] Failed to extract username for Reel/Post URL: ${url} for Reels actor. This URL might not be processable by the new actor directly.`);
          // Decide: throw error, or try with directUrls if another actor was intended for this?
          // For now, let's throw, as the intent is to use the new Reels actor.
          throw new Error(`Failed to extract username for Reel/Post URL: ${url} to use with the Reels scraper.`);
        }
      }

      if (!input) { // This check remains relevant
        console.error(`[DEBUG] Input object was not constructed for URL: ${url}. Aborting Apify call.`);
        throw new Error(`Failed to construct scraper input for URL: ${url}.`);
      }
      
      // Log the input for debugging purposes
      console.log('Calling Apify actor with input:', JSON.stringify(input, null, 2));

      try {
        // IMPORTANT: Update the actor ID to the new Instagram Reel Scraper
        const run = await client.actor('xMc5Ga1oCONPmWJIa').call(input, { timeout: options.timeout || 600 });
        
        // Log the run object for debugging
        console.log('Apify actor run details:', JSON.stringify(run, null, 2));

        if (!run || !run.defaultDatasetId) {
          console.error('Failed to get dataset ID from Apify actor run.');
          throw new Error('Failed to retrieve data: No dataset ID found.');
        }

        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (!items || items.length === 0) {
          console.warn(`[WARN] Apify actor returned 0 items for dataset ${run.defaultDatasetId}. An empty file will be created.`);
        }

        // Determine filename based on whether it was a profile or post scrape
        let baseFilenamePart = 'unknown_content';
        // The new actor input uses `username` array
        if (input.username && input.username.length > 0) {
          baseFilenamePart = input.username[0]; 
          console.log(`[DEBUG] Filename will use username from input: ${baseFilenamePart}`);
        } else {
            console.warn('[DEBUG] Could not determine a base for filename from input:', input);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `instagram_reel_${baseFilenamePart}_${timestamp}.json`; // Indicate it's from reel scraper
        const outputPath = path.join(process.cwd(), 'scraped_data'); // Save in a subfolder

        try {
          console.log(`Attempting to create directory: ${outputPath}`);
          await fs.mkdir(outputPath, { recursive: true }); // Ensure directory exists
          console.log(`Directory ${outputPath} should now exist.`);
          const fullFilePath = path.join(outputPath, filename);
          console.log(`Attempting to write file: ${fullFilePath}`);
          await fs.writeFile(fullFilePath, JSON.stringify(items, null, 2));
          console.log(`Successfully saved ${items.length} reels to ${fullFilePath}`);
        } catch (writeError) {
          console.error('Failed to save scraped data to file:', writeError);
          // Optionally, re-throw or handle this error based on application needs
        }

        return items as InstagramPost[]; // Assuming InstagramPost type is still compatible or will be adjusted
      } catch (error) {
        console.error('Error during Instagram scraping:', error);
        // It's good practice to throw the error or a more specific one
        // depending on how you want to handle errors upstream.
        throw new Error(`Instagram scraping failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };
} // Closing brace for createScraper