import React, { useState } from 'react';
import { 
  convertWeiboEmojis, 
  addParagraphMarkers, 
  MarkerStyle, 
  convertWeiboHashtags,
  splitTextIntoChunks
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

  const handleMaxChunkSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow empty value
    setChunkSizeInput(e.target.value);
    
    if (e.target.value === '') {
      setMaxChunkSize(0);
      return;
    }
    
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setMaxChunkSize(value);
    }
  };

  const handleConvert = () => {
    let converted = convertWeiboEmojis(inputText);
    
    // Always convert hashtags
    converted = convertWeiboHashtags(converted);
    
    if (addParagraphMarks) {
      converted = addParagraphMarkers(converted, markerStyle);
    }
    
    setOutputText(converted);
    
    if (splitText) {
      // Use at least 1 character limit if 0 is somehow set
      const effectiveLimit = maxChunkSize > 0 ? maxChunkSize : 1;
      const chunks = splitTextIntoChunks(converted, effectiveLimit);
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
                onClick={() => setMarkerStyle(style)}
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
                onChange={handleMaxChunkSizeChange}
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
                value={chunk}
                readOnly
                rows={4}
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