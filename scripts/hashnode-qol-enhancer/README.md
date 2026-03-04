
# Hashnode QoL Enhancer

A tiny userscript that adds two convenience buttons to Hashnode: a Preview button while editing drafts, and an Edit button on your `*.hashnode.dev` posts.

**Features:**
- Preview draft: Opens a preview of your current draft on your blog from the Hashnode editor.
- Quick edit: When viewing a post on your personal `*.hashnode.dev` blog, open the post directly in the Hashnode editor.

## Screenshots

- Edit button:

	![Edit button](img/edit.png)

- Preview button:

	![Preview button](img/preview.png)

## Installation

1. Install a userscript manager in your browser (Tampermonkey, Violentmonkey, or Greasemonkey).
2. Create a new userscript and paste the contents of [script.js](script.js) overwriting any existing code.
3. Add your blog host to the ```HASHNODE_BLOG_HOST``` 

   ```js  
   // Hardcode your blog host here, e.g. "blog.   yourdomain.com" or "yourname.hashnode.dev"
   const HASHNODE_BLOG_HOST = '';
   ```
4. If you have a custom domain add this to the ```@match``` section

   ```js
   // @match        https://*.mydomain.com/*
   ```
5. ***File*** + ***Save***

## Usage

- Open a draft at `https://hashnode.com/draft/<your-id>` to see the Preview button next to the editor controls.
- Open one of your `*.hashnode.dev` posts to see the Edit button that jumps to the Hashnode editor.

## Troubleshooting

- No buttons visible: verify the userscript is enabled and that the manager allows it to run on Hashnode domains.
- Preview fails: the editor may not have stored the blog reference locally; try saving a draft in the editor and retry.
- Edit fails: the script couldn't find the post identifier on that page—open the post in a normal browser tab and try again.

## Contributing

Found a bug or want an improvement? Open an issue in this repository and include a link to the page where the buttons didn't appear and a short description.

If you'd like to contribute code, fork the repo, make your changes, and open a pull request.

## License
See the `LICENSE` file at the repository root.

