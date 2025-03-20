# Weibo Text Converter

A web application that converts Weibo text with special emojis to standard Unicode emojis for cross-platform sharing. This tool also adds paragraph markers to make text formatting clearer when shared on other platforms like Xiaohongshu.

## Features

- Convert Weibo-specific emojis to standard Unicode emojis
- Add paragraph markers (¶) to the beginning of each paragraph
- Easy copy-to-clipboard functionality
- Simple, intuitive interface

## Usage

1. Paste your Weibo text (with special emojis) into the input field
2. Toggle the "Add paragraph markers" option if needed
3. Click "Convert" to process the text
4. The converted text will appear in the output field
5. Click "Copy to Clipboard" to easily copy the result
6. Paste the converted text to any platform (Xiaohongshu, etc.)

## Development

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Available Scripts

In the project directory, you can run:

#### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

#### `npm test`

Launches the test runner in the interactive watch mode.

#### `npm run build`

Builds the app for production to the `build` folder.

## Adding More Emoji Mappings

To add more Weibo emoji mappings, edit the `src/utils/emojiMapping.ts` file and add more entries to the `emojiMapping` object.

## License

MIT
