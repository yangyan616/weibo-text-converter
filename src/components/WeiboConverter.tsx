import React, { useState } from 'react';
import { 
  convertWeiboEmojis, 
  addParagraphMarkers, 
  MarkerStyle, 
  convertWeiboHashtags,
  splitTextIntoChunks,
  convertReckyHashtags
} from '../utils/emojiMapping';
import './WeiboConverter.css';

const WeiboConverter: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [outputChunks, setOutputChunks] = useState<string[]>([]);
  const [addParagraphMarks, setAddParagraphMarks] = useState<boolean>(true);
  const [markerStyle, setMarkerStyle] = useState<MarkerStyle>('➤');
  const [splitText, setSplitText] = useState<boolean>(false);
  const [showCopied, setShowCopied] = useState<boolean>(false);
  const [copiedChunkIndex, setCopiedChunkIndex] = useState<number | null>(null);
  const [maxChunkSize, setMaxChunkSize] = useState<number>(900);
  const [chunkSizeInput, setChunkSizeInput] = useState<string>("900");

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleMarkerStyleChange = (style: MarkerStyle) => {
    setMarkerStyle(style);
  };

  const handleChunkSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChunkSizeInput(e.target.value);
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setMaxChunkSize(value);
    }
  };

  const handleConvert = () => {
    // Apply the conversions in sequence
    let convertedText = inputText;
    
    // Apply conversions if the text is not empty
    if (convertedText.trim()) {
      // Convert Weibo emojis to standard emojis
      convertedText = convertWeiboEmojis(convertedText);
      
      // Convert recky hashtags
      convertedText = convertReckyHashtags(convertedText);
      
      // Always convert hashtags format (this will change #xxxx# to #xxxx in-place)
      convertedText = convertWeiboHashtags(convertedText);
      
      // Add paragraph markers if enabled
      if (addParagraphMarks) {
        convertedText = addParagraphMarkers(convertedText, markerStyle);
      }
      
      // For non-split mode, we don't need to add hashtags at the end
      // They're already converted in place by convertWeiboHashtags
    }
    
    // Update the output text
    setOutputText(convertedText);
    
    // Split text into chunks if enabled and there's text to split
    if (splitText && convertedText.trim()) {
      // Use at least 1 character limit if 0 is somehow set
      const effectiveLimit = maxChunkSize > 0 ? maxChunkSize : 1;
      const chunks = splitTextIntoChunks(convertedText, effectiveLimit);
      setOutputChunks(chunks);
    } else {
      setOutputChunks([]);
    }
  };

  const handleCopy = (text: string, chunkIndex: number | null = null) => {
    navigator.clipboard.writeText(text).then(() => {
      setShowCopied(true);
      setCopiedChunkIndex(chunkIndex);
      setTimeout(() => {
        setShowCopied(false);
        setCopiedChunkIndex(null);
      }, 2000);
    });
  };

  return (
    <div className="converter-container">
      <h2>Weibo Text Converter</h2>
      <p>Paste your Weibo text below to convert special emojis to standard ones</p>
      
      <div className="input-section">
        <label htmlFor="weiboText">Input Weibo Text:</label>
        <textarea
          id="weiboText"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Paste your Weibo text here..."
          rows={6}
        />
      </div>
      
      <div className="options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={addParagraphMarks}
            onChange={(e) => setAddParagraphMarks(e.target.checked)}
          />
          Add paragraph markers
        </label>
        
        {addParagraphMarks && (
          <div className="marker-options">
            {(['➤', '🔹', '🌸', '✨', '💠', '🍀'] as MarkerStyle[]).map((style) => (
              <button
                key={style}
                className={`marker-option ${markerStyle === style ? 'selected' : ''}`}
                onClick={() => handleMarkerStyleChange(style)}
              >
                {style}
              </button>
            ))}
          </div>
        )}
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={splitText}
            onChange={(e) => setSplitText(e.target.checked)}
          />
          Split text into chunks
        </label>
        
        {splitText && (
          <div className="chunk-size-control">
            <label className="custom-limit">
              <span>Character limit:</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={chunkSizeInput}
                onChange={handleChunkSizeChange}
              />
            </label>
            <small>(Recommended: 900 for Xiaohongshu's 1000 character limit)</small>
          </div>
        )}
      </div>
      
      <button className="convert-button" onClick={handleConvert}>
        Convert
      </button>
      
      {outputText && !splitText && (
        <div className="output-section">
          <label htmlFor="convertedText">Converted Text:</label>
          <textarea
            id="convertedText"
            value={outputText}
            readOnly
            rows={6}
          />
          
          <button className="copy-button" onClick={() => handleCopy(outputText)}>
            {showCopied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      )}
      
      {splitText && outputChunks.length > 0 && (
        <div className="chunks-container">
          <h3>Split Text ({outputChunks.length} chunks)</h3>
          {outputChunks.map((chunk, index) => (
            <div key={index} className="chunk-item">
              <div className="chunk-header">
                <span className="chunk-number">Chunk {index + 1}/{outputChunks.length}</span>
                <span className="chunk-length">{chunk.length} characters</span>
              </div>
              <textarea 
                className="chunk-text" 
                readOnly
                rows={6}
                value={chunk}
              />
              <button 
                className="copy-button"
                onClick={() => handleCopy(chunk, index)}
              >
                {showCopied && copiedChunkIndex === index ? 'Copied!' : 'Copy Chunk'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeiboConverter; 