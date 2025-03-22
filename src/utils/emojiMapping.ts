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
  "[二哈]": "🤪",
  "[允悲]": "🤣",
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
  
  // Additional mappings
  "[憧憬]": "🤩",
  "[吐]": "🤮",
  "[哈欠]": "🥱",
  "[白眼]": "🙄",
  "[呵呵]": "🙂",
  "[黑线]": "😅",
  "[坏笑]": "😬",
  "[花心]": "😍",
  "[失望]": "😔",
  "[悲伤]": "😥",
  "[闭嘴]": "🤐",
  "[吃瓜]": "🍉",
  "[费解]": "🤨",
  "[感冒]": "😷",
  "[鄙视]": "😒",
  "[跪了]": "🧎",
  "[生病]": "🤒",
  "[打脸]": "🤕",
  "[摊手]": "🤷",
  "[猪头]": "🐷",
  "[笑哭]": "😂",
  "[阴险]": "😏",
  "[怒骂]": "🤬",
  "[傻眼]": "😳",
  "[互粉]": "🤝",
  "[发怒]": "😡",
  "[跳舞]": "💃",
  "[献花]": "🌹",
  "[耶]": "✌️",
  "[最右]": "👉",
  "[飞吻]": "😘",
  "[求饶]": "🙏",
  "[奥特曼]": "🦸",
  "[啤酒]": "🍻",
  "[蜡烛]": "🕯️",
  "[礼物]": "🎁",
  
  // Special symbols
  "[音乐]": "🎵",
  "[照相机]": "📷",
  "[话筒]": "🎤",
  "[嘿哈]": "🤠",
  "[来]": "👈",
  "[爱心]": "❤️",
  "[心碎]": "💔",
  "[蛋糕]": "🎂",
  "[飞机]": "✈️",
  "[再见]": "👋",
  "[祈祷]": "🙏",
  "[困]": "😴",
  
  // Weather
  "[微风]": "🍃",
  "[下雨]": "🌧️",
  "[下雪]": "❄️",
  
  // Animals
  "[熊猫]": "🐼",
  "[兔子]": "🐰",
  "[猪]": "🐷",
  
  // Food
  "[咖啡]": "☕",
  "[可乐]": "🥤",
  "[冰激凌]": "🍦",
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

// Function to convert specific recky hashtags
export const convertReckyHashtags = (text: string): string => {
  // Match the exact pattern "#recky blah#" only
  return text.replace(/#recky blah#/g, '#recky的文字');
};

// Function to convert Weibo hashtags from #xxxx# to #xxxx format
export const convertWeiboHashtags = (text: string): string => {
  // Match patterns like #xxxx# to convert to #xxxx
  return text.replace(/#([^#\s]+)#/g, '#$1');
};

// Function to extract all hashtags from text
export const extractHashtags = (text: string): string[] => {
  // Extract hashtags using a simple regex
  const hashtagRegex = /#[^#\s]+/g;
  const matches = text.match(hashtagRegex) || [];
  return Array.from(new Set(matches));
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

// Function to split text into chunks for platforms with character limits
export const splitTextIntoChunks = (text: string, maxChunkSize: number = 900): string[] => {
  // Extract all hashtags from the text - these are already converted to #xxxx format
  const hashtags = extractHashtags(text);
  const hashtagString = hashtags.length > 0 ? '\n\n' + hashtags.join(' ') : '';
  
  if (text.length <= maxChunkSize - hashtagString.length) {
    return [text + hashtagString];
  }

  const chunks: string[] = [];
  let remainingText = text;

  while (remainingText.length > 0) {
    const availableSize = maxChunkSize - (hashtags.length > 0 ? hashtags.join(' ').length + 2 : 0);
    
    if (remainingText.length <= availableSize) {
      // For the last chunk, don't add hashtags at all
      chunks.push(remainingText);
      break;
    }

    // Find a good split point
    let splitIndex = findSplitIndex(remainingText, availableSize);
    
    // Add the chunk with hashtags appended
    chunks.push(remainingText.substring(0, splitIndex).trim() + hashtagString);
    
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