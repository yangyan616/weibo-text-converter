import { convertWeiboEmojis, addParagraphMarkers, MarkerStyle, convertWeiboHashtags, splitTextIntoChunks } from './emojiMapping';

describe('Emoji Converter', () => {
  test('converts Weibo emojis to standard emojis', () => {
    const input = '今天天气真好[微笑]希望明天也是[哈哈]';
    const expected = '今天天气真好😊希望明天也是😄';
    expect(convertWeiboEmojis(input)).toBe(expected);
  });

  test('handles multiple emojis in a single text', () => {
    const input = '这真的太有趣了[笑cry][笑cry][笑cry]';
    const expected = '这真的太有趣了😂😂😂';
    expect(convertWeiboEmojis(input)).toBe(expected);
  });

  test('handles text with no emojis', () => {
    const input = '这是一段没有表情符号的文本';
    expect(convertWeiboEmojis(input)).toBe(input);
  });
});

describe('Hashtag Converter', () => {
  test('converts Weibo hashtags from #topic# to #topic format', () => {
    const input = '今天我去了#北京动物园#看熊猫';
    const expected = '今天我去了#北京动物园看熊猫';
    expect(convertWeiboHashtags(input)).toBe(expected);
  });

  test('handles multiple hashtags in a single text', () => {
    const input = '我喜欢#旅行#和#美食#';
    const expected = '我喜欢#旅行和#美食';
    expect(convertWeiboHashtags(input)).toBe(expected);
  });

  test('handles text with no hashtags', () => {
    const input = '这是一段没有标签的文本';
    expect(convertWeiboHashtags(input)).toBe(input);
  });

  test('handles complex hashtag cases', () => {
    const input = '#旅行##美食##健身#';
    const expected = '#旅行#美食#健身';
    expect(convertWeiboHashtags(input)).toBe(expected);
  });
});

describe('Paragraph Marker', () => {
  test('adds default paragraph markers to the beginning of each paragraph', () => {
    const input = '第一段\n第二段\n第三段';
    const expected = '➤ 第一段\n➤ 第二段\n➤ 第三段';
    expect(addParagraphMarkers(input)).toBe(expected);
  });

  test('adds custom paragraph markers to the beginning of each paragraph', () => {
    const input = '第一段\n第二段\n第三段';
    const markerStyles: MarkerStyle[] = ['🔹', '🌸', '✨', '💠'];
    
    markerStyles.forEach(style => {
      const expected = `${style} 第一段\n${style} 第二段\n${style} 第三段`;
      expect(addParagraphMarkers(input, style)).toBe(expected);
    });
  });

  test('handles empty lines', () => {
    const input = '第一段\n\n第二段';
    const expected = '➤ 第一段\n\n➤ 第二段';
    expect(addParagraphMarkers(input)).toBe(expected);
  });

  test('handles text with no line breaks', () => {
    const input = '这是一段没有换行的文本';
    const expected = '➤ 这是一段没有换行的文本';
    expect(addParagraphMarkers(input)).toBe(expected);
  });
});

describe('Text Chunking', () => {
  test('should not split text that is under the limit', () => {
    const input = '这是一段不超过字数限制的文本';
    const result = splitTextIntoChunks(input, 900);
    expect(result.length).toBe(1);
    expect(result[0]).toBe(input);
  });

  test('should split text at paragraph boundaries when possible', () => {
    const paragraph1 = '第一段落：这是第一段内容。'.repeat(20); // ~200 chars
    const paragraph2 = '第二段落：这是第二段内容。'.repeat(20); // ~200 chars
    const paragraph3 = '第三段落：这是第三段内容。'.repeat(20); // ~200 chars
    const paragraph4 = '第四段落：这是第四段内容。'.repeat(20); // ~200 chars
    const paragraph5 = '第五段落：这是第五段内容。'.repeat(20); // ~200 chars
    
    const input = `${paragraph1}\n\n${paragraph2}\n\n${paragraph3}\n\n${paragraph4}\n\n${paragraph5}`;
    
    const result = splitTextIntoChunks(input, 500);
    
    expect(result.length).toBe(5);
    expect(result[0]).toContain('第一段落');
    expect(result[1]).toContain('第二段落');
  });

  test('should split at sentence boundaries if paragraph splits are not available', () => {
    const longSentence1 = '这是第一个句子，它有一些内容。';
    const longSentence2 = '这是第二个句子，它也有一些内容！';
    const longSentence3 = '这是第三个句子，它包含了更多的内容？';
    const longSentence4 = '这是第四个句子，它包含了一些示例文本。';
    
    // Repeat sentences to make it long enough to force splitting
    const input = (longSentence1 + longSentence2 + longSentence3 + longSentence4).repeat(10);
    
    const result = splitTextIntoChunks(input, 300);
    
    expect(result.length).toBeGreaterThan(1);
    
    // Each chunk (except maybe the last) should end with a sentence terminator
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i]).toMatch(/[.!?]$/);
    }
  });

  test('should handle very long text with multiple chunks', () => {
    const longText = '这是一个测试文本。'.repeat(300); // ~1200 chars
    const result = splitTextIntoChunks(longText, 300);
    
    expect(result.length).toBeGreaterThan(3);
    
    // Make sure we never exceed the max chunk size
    result.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(300);
    });
    
    // Check that all content is preserved
    const combinedText = result.join('');
    const normalizedInput = longText.replace(/\s+/g, '');
    const normalizedOutput = combinedText.replace(/\s+/g, '');
    
    expect(normalizedOutput).toEqual(normalizedInput);
  });

  test('should handle small character limits like Twitter (140 chars)', () => {
    const tweetText = 'Twitter only allows 140 characters per tweet, so this text needs to be split into multiple parts to fit within that constraint. This is a test of that functionality.';
    const result = splitTextIntoChunks(tweetText, 140);
    
    expect(result.length).toBeGreaterThan(1);
    
    // Check all chunks are under the limit
    result.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(140);
    });
    
    // Check content preservation
    const combined = result.join('');
    expect(combined.replace(/\s+/g, '')).toEqual(tweetText.replace(/\s+/g, ''));
  });

  test('should split Chinese characters properly with various limits', () => {
    const chineseText = '这是一段中文文本，我们需要测试它在不同字符限制下的分割效果。微博、小红书和Twitter都有自己的字符限制。我们需要确保文本能够在合适的位置分割，保持语义的完整性。';
    
    // Test with Twitter limit
    const twitterChunks = splitTextIntoChunks(chineseText, 140);
    expect(twitterChunks[0].length).toBeLessThanOrEqual(140);
    
    // Test with Facebook limit
    const fbChunks = splitTextIntoChunks(chineseText, 500);
    expect(fbChunks[0].length).toBeLessThanOrEqual(500);
    
    // Verify content remains intact
    const combinedTwitter = twitterChunks.join('');
    const combinedFb = fbChunks.join('');
    expect(combinedTwitter).toEqual(chineseText);
    expect(combinedFb).toEqual(chineseText);
  });
}); 