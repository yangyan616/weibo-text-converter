// A mapping of Weibo emoji codes to standard Unicode emojis
export const emojiMapping: Record<string, string> = {
  // Basic emoticons
  "[微笑]": "😊",
  "[嘻嘻]": "😁",
  "[哈哈]": "😄",
  "[爱你]": "❤️",
  "[挖鼻]": "👃",
  "[吃惊]": "😲",
  "[晕]": "😵",
  "[泪]": "😢",
  "[馋嘴]": "😋",
  "[抓狂]": "😫",
  "[哼]": "😤",
  "[可爱]": "😊",
  "[怒]": "😠",
  "[汗]": "😓",
  "[害羞]": "😳",
  "[睡]": "😴",
  "[钱]": "💰",
  "[偷笑]": "😏",
  "[笑cry]": "😂",
  "[doge]": "🐶",
  "[喵喵]": "🐱",
  "[二哈]": "🐺",
  "[酷]": "😎",
  "[衰]": "😩",
  "[思考]": "🤔",
  "[疑问]": "❓",
  "[拜拜]": "👋",
  "[鼓掌]": "👏",
  "[握手]": "🤝",
  "[赞]": "👍",
  "[心]": "❤️",
  "[伤心]": "💔",
  "[鲜花]": "🌹",
  "[太阳]": "☀️",
  "[月亮]": "🌙",
  "[威武]": "💪",
  "[给力]": "👍",
  "[可怜]": "🥺",
  "[右哼哼]": "😤",
  "[左哼哼]": "😤",
  "[嘘]": "🤫",
  "[委屈]": "😢",
  
  // Add more emoji mappings as needed
};

// Function to replace Weibo emojis with standard emojis
export const convertWeiboEmojis = (text: string): string => {
  let convertedText = text;
  
  // Replace all occurrences of Weibo emojis
  Object.entries(emojiMapping).forEach(([weiboEmoji, standardEmoji]) => {
    const regex = new RegExp(weiboEmoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    convertedText = convertedText.replace(regex, standardEmoji);
  });
  
  return convertedText;
};

// Function to convert Weibo hashtags from #xxxx# to #xxxx format
export const convertWeiboHashtags = (text: string): string => {
  // Match patterns like #xxxx# but not ##xxxx## (to avoid multiple conversions)
  // Using negative lookahead to ensure we don't match ## at the beginning
  const hashtagRegex = /(?<!#)(#[^#]+#)(?!#)/g;
  
  return text.replace(hashtagRegex, (match) => {
    // Remove the last # character
    return match.substring(0, match.length - 1);
  });
};

// Function to split text into chunks for platforms with character limits
export const splitTextIntoChunks = (text: string, maxChunkSize: number = 900): string[] => {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let remainingText = text;

  while (remainingText.length > 0) {
    if (remainingText.length <= maxChunkSize) {
      chunks.push(remainingText);
      break;
    }

    // Find a good split point (preferably at paragraph end or sentence end)
    let splitIndex = findSplitIndex(remainingText, maxChunkSize);
    
    // Add the chunk
    chunks.push(remainingText.substring(0, splitIndex).trim());
    
    // Update remaining text
    remainingText = remainingText.substring(splitIndex).trim();
  }

  return chunks;
};

// Helper function to find a good split point
const findSplitIndex = (text: string, maxLength: number): number => {
  // First try to split at a paragraph (double newline)
  const paragraphSplit = text.lastIndexOf('\n\n', maxLength);
  if (paragraphSplit > 0 && paragraphSplit >= maxLength / 2) {
    return paragraphSplit + 2; // Include the double newline in the first chunk
  }
  
  // Then try to split at a single newline
  const newlineSplit = text.lastIndexOf('\n', maxLength);
  if (newlineSplit > 0 && newlineSplit >= maxLength / 2) {
    return newlineSplit + 1; // Include the newline in the first chunk
  }
  
  // Then try to split at a sentence end (.!?)
  const sentenceMatch = text.substring(0, maxLength).match(/[.!?][^.!?]*$/);
  if (sentenceMatch && sentenceMatch.index && sentenceMatch.index >= maxLength / 2) {
    return sentenceMatch.index + 1;
  }
  
  // If all else fails, split at a space
  const spaceSplit = text.lastIndexOf(' ', maxLength);
  if (spaceSplit > 0 && spaceSplit >= maxLength / 2) {
    return spaceSplit + 1; // Include the space in the first chunk
  }
  
  // Last resort: just split at the max length
  return maxLength;
};

// Paragraph marker options
export type MarkerStyle = '➤' | '🔹' | '🌸' | '✨' | '💠' | '🍀';

// Function to add paragraph markers
export const addParagraphMarkers = (text: string, markerStyle: MarkerStyle = '➤'): string => {
  // Split text by newlines and add selected paragraph marker to each non-empty paragraph
  return text
    .split('\n')
    .map(paragraph => paragraph.trim() ? `${markerStyle} ${paragraph}` : paragraph)
    .join('\n');
}; 