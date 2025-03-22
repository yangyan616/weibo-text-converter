import React, { useState, useRef } from 'react';
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
  
  // New states for title and book cover feature
  const [titleText, setTitleText] = useState<string>('');
  const [bookCoverUrl, setBookCoverUrl] = useState<string>('');
  const [isGeneratingCover, setIsGeneratingCover] = useState<boolean>(false);
  const [styleVariation, setStyleVariation] = useState<number>(0); // Add style variation counter
  
  // Canvas ref for generating the book cover
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleText(e.target.value);
  };

  const handleMarkerStyleChange = (style: MarkerStyle) => {
    setMarkerStyle(style);
  };

  const handleChunkSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChunkSizeInput(e.target.value);
    const value = parseInt(e.target.value);
    
    if (!isNaN(value)) {
      setMaxChunkSize(value);
    }
  };

  const handleOutputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOutputText(e.target.value);
  };

  const handleChunkChange = (index: number, e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newChunks = [...outputChunks];
    newChunks[index] = e.target.value;
    setOutputChunks(newChunks);
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

  const handleGenerateBookCover = () => {
    if (!titleText.trim()) return;
    
    // Increment style variation to get a different look each time
    setStyleVariation(prev => prev + 1);
    setIsGeneratingCover(true);
    
    // Create a canvas and get its context
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Set canvas dimensions (16:9 ratio like a book cover)
    const width = 800;
    const height = 1200;
    canvas.width = width;
    canvas.height = height;
    
    // Get a deterministic color based on the title
    const getColorFromText = (text: string, variation: number) => {
      let hash = 0;
      // Add a multiplier to variation to make changes more dramatic between clicks
      const input = text + (variation * 73).toString();
      for (let i = 0; i < input.length; i++) {
        hash = input.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      // Create a more pleasing color palette based on the hash
      // Add variation directly to the hue to force more distinct colors on each click
      const mainHue = (Math.abs(hash % 360) + variation * 83) % 360;
      
      // Use golden ratio to create harmonious complementary hue
      const goldenRatioConjugate = 0.618033988749895;
      const complementaryHue = Math.floor((mainHue + 360 * goldenRatioConjugate) % 360);
      
      // Create a more sophisticated color scheme with variation affecting saturation too
      const satBase = 15 + (variation % 3) * 5; // Reduced from 25% to 15% base saturation
      
      return {
        main: `hsl(${mainHue}, ${satBase}%, 80%)`, // Decreased lightness from 85% to 80%
        complementary: `hsl(${complementaryHue}, ${satBase + 5}%, 60%)`, // Decreased from 65% to 60%
        accent: `hsl(${(mainHue + 60) % 360}, ${satBase + 8}%, 70%)`, // Decreased from 75% to 70%
        lighter: `hsl(${mainHue}, 40%, 95%)`, // Decreased from 97% to 95%
        darker: `hsl(${mainHue}, 25%, 50%)` // Decreased from 55% to 50%
      };
    };
    
    const colors = getColorFromText(titleText, styleVariation);
    
    // Draw more aesthetically pleasing gradient background
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, colors.main);
    gradient.addColorStop(0.6, colors.complementary);
    gradient.addColorStop(1, colors.darker);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    
    // Add subtle texture pattern for more interest
    context.globalAlpha = 0.03;
    for (let i = 0; i < width; i += 20) {
      for (let j = 0; j < height; j += 20) {
        if ((i + j) % 40 === 0) {
          context.fillStyle = "#FFFFFF";
          context.fillRect(i, j, 10, 10);
        }
      }
    }
    context.globalAlpha = 1.0;
    
    // Add elegant decorative elements
    // 1. Subtle radial patterns
    const createRadialGradient = (x: number, y: number, radius: number, color: string) => {
      const grad = context.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, color.replace(')', ', 0.5)')); // 50% opacity
      grad.addColorStop(1, "transparent");
      return grad;
    };
    
    // Add subtle light orbs
    context.fillStyle = createRadialGradient(width * 0.2, height * 0.2, width * 0.4, colors.accent);
    context.fillRect(0, 0, width, height);
    
    // Add more subtle white light orb with reduced opacity
    const whiteGrad = context.createRadialGradient(width * 0.8, height * 0.8, 0, width * 0.8, height * 0.8, width * 0.5);
    whiteGrad.addColorStop(0, "rgba(255, 255, 255, 0.2)"); // Reduced from 0.5 to 0.2
    whiteGrad.addColorStop(1, "transparent");
    context.fillStyle = whiteGrad;
    context.fillRect(0, 0, width, height);
    
    // 2. Abstract decorative elements
    context.fillStyle = colors.lighter + "30"; // 30% opacity
    
    // Add abstract border frame with lighter color
    const margin = width * 0.08;
    context.strokeStyle = `rgba(255, 255, 255, 0.6)`; // Light white border with transparency
    context.lineWidth = width * 0.012;
    context.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
    
    // Add subtle corners decoration
    const cornerSize = width * 0.15;
    context.lineWidth = width * 0.007;
    
    // Top-left corner
    context.beginPath();
    context.moveTo(margin, margin + cornerSize);
    context.lineTo(margin, margin);
    context.lineTo(margin + cornerSize, margin);
    context.stroke();
    
    // Top-right corner
    context.beginPath();
    context.moveTo(width - margin - cornerSize, margin);
    context.lineTo(width - margin, margin);
    context.lineTo(width - margin, margin + cornerSize);
    context.stroke();
    
    // Bottom-left corner
    context.beginPath();
    context.moveTo(margin, height - margin - cornerSize);
    context.lineTo(margin, height - margin);
    context.lineTo(margin + cornerSize, height - margin);
    context.stroke();
    
    // Bottom-right corner
    context.beginPath();
    context.moveTo(width - margin - cornerSize, height - margin);
    context.lineTo(width - margin, height - margin);
    context.lineTo(width - margin, height - margin - cornerSize);
    context.stroke();
    
    // Draw title with improved typography
    const drawWrappedText = (text: string, maxWidth: number) => {
      // For non-Latin characters (like Chinese), treat each character as a potential breakpoint
      const characters = Array.from(text); // This properly handles multi-byte characters
      const lines: string[] = [];
      let currentLine = '';
      
      // Break the text into lines character by character if needed
      for (let i = 0; i < characters.length; i++) {
        const char = characters[i];
        const testLine = currentLine + char;
        const testWidth = context.measureText(testLine).width;
        
        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines;
    };
    
    // SUPER LARGE FONT with proper wrapping
    // Calculate font size based on canvas dimensions and text length
    // Initial large size
    let fontSize = 200;
    
    // Use better fonts and styling for more aesthetic look
    const chineseFonts = [
      // Reordered to prioritize the most interesting Chinese fonts first
      "'ZCOOL KuaiLe', cursive, sans-serif", // Fun Chinese font
      "'Ma Shan Zheng', cursive, sans-serif", // Chinese handwriting style
      "'Long Cang', cursive", // Chinese calligraphy
      "'ZCOOL QingKe HuangYou', cursive, sans-serif", // Modern Chinese style
      "'ZCOOL XiaoWei', serif", // Classical Chinese style
      "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif", // Chinese font (elegant)
    ];
    
    // Always use Chinese fonts first and make sure each click gives a different font
    // By using the styleVariation directly (incremented each time Generate is clicked)
    const chosenFont = chineseFonts[styleVariation % chineseFonts.length];
    
    // Set initial font to measure text
    context.font = `bold ${fontSize}px ${chosenFont}`;
    context.textAlign = 'center';
    
    // Start with a large size and reduce until text fits completely
    const maxWidth = width * 0.75; // Reduced from 0.85 to 0.75 for wider margins
    let lines = drawWrappedText(titleText, maxWidth);
    
    // If we have too many lines or text is too big, reduce font size
    let attempts = 0;
    const maxLines = 6; // Allow up to 6 lines to maintain large text
    
    // Keep reducing font size until all text fits inside the image bounds
    while ((lines.length > maxLines || lines.some(line => context.measureText(line).width > maxWidth)) && attempts < 10) {
      fontSize = fontSize * 0.85; // Reduce by 15% each iteration
      context.font = `bold ${fontSize}px ${chosenFont}`;
      lines = drawWrappedText(titleText, maxWidth);
      attempts++;
    }
    
    // For very short titles, make even bigger
    if (titleText.length < 10 && lines.length === 1 && context.measureText(titleText).width < maxWidth * 0.8) {
      fontSize = Math.min(400, fontSize * 1.3);
      context.font = `bold ${fontSize}px ${chosenFont}`;
      lines = drawWrappedText(titleText, maxWidth);
    }
    
    // Apply text effects and style
    context.fillStyle = colors.lighter;
    
    // Position title in the middle
    const lineHeight = fontSize * 1.1; // Tighter line height for bigger text
    const totalTextHeight = lines.length * lineHeight;
    
    // Ensure text doesn't go outside vertical bounds
    const verticalPadding = height * 0.15; // 15% padding top and bottom
    const maxHeight = height - (verticalPadding * 2);
    
    // If text is too tall, reduce font size further
    if (totalTextHeight > maxHeight) {
      fontSize = fontSize * (maxHeight / totalTextHeight) * 0.95;
      context.font = `bold ${fontSize}px ${chosenFont}`;
      // Recalculate line height and text height
      const adjustedLineHeight = fontSize * 1.1;
      lines = drawWrappedText(titleText, maxWidth);
      const adjustedTotalHeight = lines.length * adjustedLineHeight;
      
      // Proper vertical centering - exact middle of canvas
      const startY = (height / 2) - (adjustedTotalHeight / 2) + (adjustedLineHeight / 2);
      
      // Draw each line with enhanced text effects
      lines.forEach((line, index) => {
        // Text shadow for depth
        context.shadowColor = 'rgba(0,0,0,0.5)';
        context.shadowBlur = fontSize * 0.05;
        context.shadowOffsetX = fontSize * 0.01;
        context.shadowOffsetY = fontSize * 0.01;
        
        // Draw outline for additional visual interest
        context.strokeStyle = colors.darker;
        context.lineWidth = fontSize * 0.03;
        context.strokeText(line, width / 2, startY + index * adjustedLineHeight);
        
        // Draw the main text - brighter white for better contrast
        context.fillStyle = '#FFFFFF';
        context.fillText(line, width / 2, startY + index * adjustedLineHeight);
      });
    } else {
      // Normal case - text fits vertically
      // Proper vertical centering - exact middle of canvas
      const startY = (height / 2) - (totalTextHeight / 2) + (lineHeight / 2);
      
      // Draw each line with enhanced text effects
      lines.forEach((line, index) => {
        // Text shadow for depth
        context.shadowColor = 'rgba(0,0,0,0.5)';
        context.shadowBlur = fontSize * 0.05;
        context.shadowOffsetX = fontSize * 0.01;
        context.shadowOffsetY = fontSize * 0.01;
        
        // Draw outline for additional visual interest
        context.strokeStyle = colors.darker;
        context.lineWidth = fontSize * 0.03;
        context.strokeText(line, width / 2, startY + index * lineHeight);
        
        // Draw the main text - brighter white for better contrast
        context.fillStyle = '#FFFFFF';
        context.fillText(line, width / 2, startY + index * lineHeight);
      });
    }
    
    // Convert the canvas to an image URL
    const imageUrl = canvas.toDataURL('image/jpeg');
    
    // Simulate a small delay before showing the image
    setTimeout(() => {
      setBookCoverUrl(imageUrl);
      setIsGeneratingCover(false);
    }, 500);
  };

  return (
    <div className="converter-container">
      <div className="book-cover-section">
        <h3>Generate Cover</h3>
        <div className="title-input">
          <label htmlFor="titleInput">Title:</label>
          <input
            id="titleInput"
            type="text"
            value={titleText}
            onChange={handleTitleChange}
            placeholder="Enter your title..."
          />
          <button 
            className="generate-button"
            onClick={handleGenerateBookCover}
            disabled={!titleText.trim() || isGeneratingCover}
          >
            {isGeneratingCover ? 'Generating...' : 'Generate Cover'}
          </button>
        </div>
        
        {bookCoverUrl && (
          <div className="cover-preview">
            <img 
              src={bookCoverUrl} 
              alt="Generated book cover" 
              style={{ 
                maxHeight: '300px', 
                maxWidth: '200px', 
                objectFit: 'contain',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              }} 
            />
            <button className="download-button" onClick={() => {
              const a = document.createElement('a');
              a.href = bookCoverUrl;
              a.download = `${titleText.replace(/\s+/g, '-').toLowerCase()}-cover.jpg`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}>
              Download Cover
            </button>
          </div>
        )}
        
        {/* Hidden canvas for generating the cover */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      
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
            onChange={handleOutputChange}
            rows={15}
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
                rows={10}
                value={chunk}
                onChange={(e) => handleChunkChange(index, e)}
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