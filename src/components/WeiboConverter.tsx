import React, { useState, useRef, useEffect } from 'react';
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
  const [bookCoverUrls, setBookCoverUrls] = useState<string[]>([]);
  const [isGeneratingCover, setIsGeneratingCover] = useState<boolean>(false);
  const [styleVariation, setStyleVariation] = useState<number>(0); // Add style variation counter
  const [fontRotationIndex, setFontRotationIndex] = useState<number>(0); // Track font rotation
  const [selectedCoverIndex, setSelectedCoverIndex] = useState<number | null>(null);
  
  // States for text-to-image feature
  const [textImageUrls, setTextImageUrls] = useState<string[]>([]);
  const [isGeneratingTextImages, setIsGeneratingTextImages] = useState<boolean>(false);
  
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Add effect to preload fonts when component mounts
  useEffect(() => {
    // Preload Chinese fonts
    const preloadFonts = [
      "'ZCOOL KuaiLe'",
      "'Ma Shan Zheng'",
      "'Long Cang'",
      "'ZCOOL QingKe HuangYou'",
      "'ZCOOL XiaoWei'",
      "'Noto Serif SC'",
      "'Zhi Mang Xing'",
      "'Liu Jian Mao Cao'",
    ];
    
    // Create invisible div to force font loading
    const fontPreloader = document.createElement('div');
    fontPreloader.style.opacity = '0';
    fontPreloader.style.position = 'absolute';
    fontPreloader.style.pointerEvents = 'none';
    
    // Add text for each font
    preloadFonts.forEach(font => {
      const span = document.createElement('span');
      span.style.fontFamily = font;
      span.textContent = "字体预加载";
      fontPreloader.appendChild(span);
    });
    
    // Add to document and remove after a delay
    document.body.appendChild(fontPreloader);
    
    return () => {
      if (document.body.contains(fontPreloader)) {
        document.body.removeChild(fontPreloader);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
    // Try to use the clipboard API with a fallback for mobile
    const copyToClipboard = async (textToCopy: string) => {
      try {
        // Modern API - primary method
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(textToCopy);
          return true;
        }
        
        // Fallback 1: execCommand method (works on some mobile browsers)
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      } catch (err) {
        console.error('Failed to copy text:', err);
        return false;
      }
    };

    copyToClipboard(text).then(success => {
      if (success) {
        setShowCopied(true);
        setCopiedChunkIndex(chunkIndex);
        setTimeout(() => {
          setShowCopied(false);
          setCopiedChunkIndex(null);
        }, 2000);
      } else {
        alert('Copy failed. Please select and copy the text manually.');
      }
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
    // Rotate to next set of fonts
    setFontRotationIndex(prev => (prev + 1) % 2); // Toggle between 0 and 1 for first/second set
    setIsGeneratingCover(true);
    setBookCoverUrls([]);
    setSelectedCoverIndex(null);
    
    // Define Chinese fonts - expanded options with more distinctive fonts
    const chineseFonts = [
      "'ZCOOL KuaiLe', cursive, sans-serif", // Fun Chinese font
      "'Ma Shan Zheng', cursive, sans-serif", // Chinese handwriting style
      "'Long Cang', cursive, sans-serif", // Chinese calligraphy
      "'ZCOOL QingKe HuangYou', cursive, sans-serif", // Modern Chinese style
      "'ZCOOL XiaoWei', serif", // Classical Chinese style
      "'Noto Serif SC', serif", // Elegant Serif
      "'Zhi Mang Xing', cursive, sans-serif", // Brush style
      "'Liu Jian Mao Cao', cursive, sans-serif", // Handwriting
    ];
    
    // Select 4 fonts based on the current rotation index
    // When fontRotationIndex is 0, use the first 4 fonts
    // When fontRotationIndex is 1, use the last 4 fonts
    const startIndex = fontRotationIndex * 4;
    const selectedFonts = chineseFonts.slice(startIndex, startIndex + 4);
    
    // Generate all covers with different fonts
    generateMultipleCovers(selectedFonts);
  };

  const generateMultipleCovers = (fonts: string[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Improved font handling that prioritizes Chinese fonts
    const setupFonts = async () => {
      // Define fallback system fonts that are always available
      const systemFonts = [
        "'Arial', sans-serif",
        "'Times New Roman', serif",
        "'Georgia', serif",
        "'Courier New', monospace",
        "'Verdana', sans-serif"
      ];
      
      // Try to load Chinese fonts without validation
      // This ensures we prioritize Chinese fonts and only fall back if absolutely necessary
      const finalFontList: string[] = [];
      
      // First try to load all Chinese fonts
      for (const font of fonts) {
        try {
          const fontName = font.split(',')[0].replace(/'/g, '');
          console.log(`Loading font: ${fontName}`);
          await document.fonts.load(`normal 24px ${fontName}`);
          finalFontList.push(font);
          // We want all 4 fonts in our selected set
        } catch (error) {
          console.warn(`Failed to load font: ${font}`, error);
        }
      }
      
      // If some fonts failed to load, add system fonts to reach 4 total
      let systemFontIndex = 0;
      while (finalFontList.length < 4 && systemFontIndex < systemFonts.length) {
        // Don't add duplicates
        if (!finalFontList.includes(systemFonts[systemFontIndex])) {
          finalFontList.push(systemFonts[systemFontIndex]);
        }
        systemFontIndex++;
      }
      
      console.log("Final font list:", finalFontList);
      startGeneratingCovers(finalFontList);
    };

    const startGeneratingCovers = (validatedFonts: string[]) => {
      // Set canvas dimensions
      const width = 800;
      const height = 1200;
      canvas.width = width;
      canvas.height = height;
      
      // Array to store generated cover URLs
      const coverUrls: string[] = [];
      
      // Generate a cover for each font
      const generateNextCover = (index: number) => {
        if (index >= validatedFonts.length) {
          // All covers generated
          setBookCoverUrls(coverUrls);
          setIsGeneratingCover(false);
          return;
        }
        
        const chosenFont = validatedFonts[index];
        
        // Get a deterministic color based on the title and font index
        const getColorFromText = (text: string, variation: number, fontIndex: number) => {
          let hash = 0;
          // Add large offsets for each font to ensure different colors
          const input = text + (variation * 73 + fontIndex * 137).toString();
          for (let i = 0; i < input.length; i++) {
            hash = input.charCodeAt(i) + ((hash << 5) - hash);
          }
          
          // Create a more pleasing color palette based on the hash with big jumps between indices
          const mainHue = (Math.abs(hash % 360) + variation * 83 + fontIndex * 101) % 360;
          
          // Use golden ratio to create harmonious complementary hue
          const goldenRatioConjugate = 0.618033988749895;
          const complementaryHue = Math.floor((mainHue + 360 * goldenRatioConjugate) % 360);
          
          // Create a more sophisticated color scheme with variation affecting saturation too
          const satBase = 15 + ((variation + fontIndex) % 3) * 5;
          
          return {
            main: `hsl(${mainHue}, ${satBase}%, 80%)`,
            complementary: `hsl(${complementaryHue}, ${satBase + 5}%, 60%)`,
            accent: `hsl(${(mainHue + 60) % 360}, ${satBase + 8}%, 70%)`,
            lighter: `hsl(${mainHue}, 40%, 95%)`,
            darker: `hsl(${mainHue}, 25%, 50%)`
          };
        };
        
        const colors = getColorFromText(titleText, styleVariation, index);
        
        // Draw gradient background
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
        
        // Add subtle radial patterns
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
        whiteGrad.addColorStop(0, "rgba(255, 255, 255, 0.2)");
        whiteGrad.addColorStop(1, "transparent");
        context.fillStyle = whiteGrad;
        context.fillRect(0, 0, width, height);
        
        // Add abstract decorative elements
        context.fillStyle = colors.lighter + "30"; // 30% opacity
        
        // Add abstract border frame with lighter color
        const margin = width * 0.08;
        context.strokeStyle = `rgba(255, 255, 255, 0.6)`;
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
        
        // Draw title with a simpler, more reliable approach
        const drawWrappedText = (text: string, maxWidth: number, tempFontSize: number) => {
          // Split text by newlines first to respect user's line breaks
          const paragraphs = text.split('\n');
          const lines: string[] = [];
          
          // Process each paragraph separately
          paragraphs.forEach(paragraph => {
            // If paragraph is empty, just add an empty line
            if (!paragraph.trim()) {
              lines.push('');
              return;
            }
            
            // Handle word wrapping differently for English vs Chinese/Japanese/etc
            // For English, we need to respect word boundaries
            let currentLine = '';
            
            // First check if paragraph is in a mixed mode with both Chinese and English
            const hasChinese = /[\u4e00-\u9fa5]/.test(paragraph);
            const hasLatin = /[a-zA-Z0-9]/.test(paragraph);
            const isMixedMode = hasChinese && hasLatin;
            
            if (isMixedMode) {
              // For mixed content, we need to handle both Latin words and Chinese characters
              // First segment text into chunks of consecutive Latin characters or non-Latin characters
              const segments: {text: string, isLatin: boolean}[] = [];
              let currentSegment = '';
              let currentIsLatin = /[a-zA-Z0-9]/.test(paragraph[0] || '');
              
              Array.from(paragraph).forEach(char => {
                const charIsLatin = /[a-zA-Z0-9]/.test(char);
                
                if (charIsLatin !== currentIsLatin) {
                  // Change in character type, create a new segment
                  segments.push({text: currentSegment, isLatin: currentIsLatin});
                  currentSegment = char;
                  currentIsLatin = charIsLatin;
                } else {
                  // Same character type, append to current segment
                  currentSegment += char;
                }
              });
              
              // Add the last segment
              if (currentSegment) {
                segments.push({text: currentSegment, isLatin: currentIsLatin});
              }
              
              // Now handle each segment with its appropriate wrapping rules
              for (let i = 0; i < segments.length; i++) {
                const segment = segments[i];
                
                if (segment.isLatin) {
                  // Handle latin segment as a whole word - never add space between Chinese and English
                  const testLine = currentLine + segment.text;
                  context.font = `${tempFontSize}px Arial, sans-serif`;
                  const testWidth = context.measureText(testLine).width;
                  
                  if (testWidth > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = segment.text;
                  } else {
                    currentLine = testLine;
                  }
                } else {
                  // Handle Chinese segment character by character
                  const characters = Array.from(segment.text);
                  
                  for (let j = 0; j < characters.length; j++) {
                    const char = characters[j];
                    
                    // Check if current character is Chinese punctuation
                    const isChinesePunctuation = /[，。：；？！、）】」』'"〕］｝》〉]/.test(char);
                    
                    // Special case: If we're about to add punctuation but the line would be too long,
                    // check if we can add it to the previous line
                    const testLine = currentLine + char;
                    context.font = `${tempFontSize}px Arial, sans-serif`;
                    const testWidth = context.measureText(testLine).width;
                    
                    if (testWidth > maxWidth && currentLine && isChinesePunctuation) {
                      // Add the punctuation to the previous line regardless of width
                      // (we'll sacrifice the exact width limit to maintain proper punctuation flow)
                      lines.push(currentLine + char);
                      currentLine = '';
                      continue;
                    } else if (testWidth > maxWidth && currentLine) {
                      // Normal wrapping for non-punctuation
                      lines.push(currentLine);
                      currentLine = char;
                    } else {
                      // No wrapping needed, just append
                      currentLine = testLine;
                    }
                  }
                }
              }
            } else if (hasLatin && !hasChinese) {
              // English/Latin text - split by words
              const words = paragraph.split(/\s+/);
              
              for (let i = 0; i < words.length; i++) {
                const word = words[i];
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                
                // Measure text width for wrapping
                context.font = `${tempFontSize}px Arial, sans-serif`;
                const testWidth = context.measureText(testLine).width;
                
                if (testWidth > maxWidth && currentLine) {
                  lines.push(currentLine);
                  currentLine = word;
                } else {
                  currentLine = testLine;
                }
              }
            } else {
              // For non-Latin characters (like Chinese), one character might already be a word
              const characters = Array.from(paragraph); // Properly handle multi-byte characters
              
              for (let i = 0; i < characters.length; i++) {
                const char = characters[i];
                
                // Check if current character is Chinese punctuation
                const isChinesePunctuation = /[，。：；？！、）】」』'"〕］｝》〉]/.test(char);
                
                // Special case: If we're about to add punctuation but the line would be too long,
                // check if we can add it to the previous line
                const testLine = currentLine + char;
                context.font = `${tempFontSize}px Arial, sans-serif`;
                const testWidth = context.measureText(testLine).width;
                
                if (testWidth > maxWidth && currentLine && isChinesePunctuation) {
                  // Add the punctuation to the previous line regardless of width
                  // (we'll sacrifice the exact width limit to maintain proper punctuation flow)
                  lines.push(currentLine + char);
                  currentLine = '';
                  continue;
                } else if (testWidth > maxWidth && currentLine) {
                  // Normal wrapping for non-punctuation
                  lines.push(currentLine);
                  currentLine = char;
                } else {
                  // No wrapping needed, just append
                  currentLine = testLine;
                }
              }
            }

            if (currentLine) {
              lines.push(currentLine);
            }
          });
          
          return lines;
        };
        
        // Simple, direct approach to calculating font size
        const calculateTextSize = () => {
          // 1. Define the frame and margins clearly
          const frameMargin = width * 0.08; // White border position (8% from edges)
          const frameWidth = width - (frameMargin * 2);
          const frameHeight = height - (frameMargin * 2);
          
          // 2. Define usable area with consistent inner margin (10% of frame size)
          const innerMargin = Math.min(frameWidth, frameHeight) * 0.1;
          const textAreaWidth = frameWidth - (innerMargin * 2);
          const textAreaHeight = frameHeight - (innerMargin * 2);
          
          // 3. Start with a reasonable font size based on text length and line count
          const lineCount = titleText.split('\n').length;
          
          // Initial guess based on available height and line count
          let fontSize = Math.min(200, textAreaHeight / (lineCount * 1.2));
          
          // 4. Iteratively adjust font size until text fits properly
          let fits = false;
          let lines: string[] = [];
          
          while (!fits && fontSize > 20) {
            context.font = `normal ${fontSize}px ${chosenFont}`;
            
            // Check if text fits within available width and height
            lines = drawWrappedText(titleText, textAreaWidth, fontSize);
            const lineHeight = fontSize * 1.2;
            const totalTextHeight = lines.length * lineHeight;
            
            // Check if any line is too wide or total height is too tall
            const widestLineWidth = Math.max(...lines.map(line => context.measureText(line).width));
            
            if (widestLineWidth <= textAreaWidth && totalTextHeight <= textAreaHeight) {
              fits = true;
            } else {
              // Reduce font size by 10% and try again
              fontSize *= 0.9;
            }
          }
          
          // 5. Return all layout information
          return {
            fontSize,
            frameMargin,
            innerMargin,
            lines
          };
        };
        
        // Get text size and layout information
        const { fontSize, frameMargin, innerMargin, lines } = calculateTextSize();
        
        // Set final font for rendering - use normal instead of bold to reduce artifacts
        context.font = `normal ${fontSize}px ${chosenFont}`;
        context.textAlign = 'center';
        
        // Calculate line height and total text dimensions
        const lineHeight = fontSize * 1.2;
        const totalTextHeight = lines.length * lineHeight;
        
        // Calculate exact position to center text inside frame
        const frameHeight = height - (frameMargin * 2);
        const textTop = frameMargin + innerMargin + (frameHeight - (innerMargin * 2) - totalTextHeight) / 2;
        
        // Draw each line
        lines.forEach((line, index) => {
          // Position the line (accounting for text baseline)
          const y = textTop + (index * lineHeight) + (fontSize * 0.85);
          
          // Explicitly reset all canvas drawing settings
          context.globalAlpha = 1.0;
          context.shadowColor = 'transparent';
          context.shadowBlur = 0;
          context.shadowOffsetX = 0;
          context.shadowOffsetY = 0;
          
          // Draw a simple single outline
          context.strokeStyle = '#000000'; // Consistent black outline
          context.lineWidth = 2; // Slightly thicker outline
          context.strokeText(line, width / 2, y);
          
          // Draw text with white fill
          context.fillStyle = '#FFFFFF';
          context.fillText(line, width / 2, y);
        });
        
        // Convert the canvas to an image URL
        const imageUrl = canvas.toDataURL('image/jpeg');
        coverUrls.push(imageUrl);
        
        // Process the next font
        setTimeout(() => {
          generateNextCover(index + 1);
        }, 100);
      };
      
      // Start generating covers
      generateNextCover(0);
    };

    // Setup and start
    setupFonts();
  };

  // Function to generate text images
  const handleGenerateTextImages = () => {
    if (!inputText.trim()) return;
    
    setIsGeneratingTextImages(true);
    setTextImageUrls([]);
    
    // Use setTimeout to let the UI update before starting the intensive operation
    setTimeout(() => {
      generateTextImages(inputText);
    }, 100);
  };

  // Function to generate images from text
  const generateTextImages = (text: string) => {
    const canvas = textCanvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Set canvas dimensions (3:2 aspect ratio with height being larger)
    const width = 800;
    const height = 1200;  // Height is 1.5x width to make a 3:2 ratio
    canvas.width = width;
    canvas.height = height;
    
    // Constants for text formatting
    const margin = 70; // increased page margin in pixels
    const fontSize = 40; // increased font size for better readability
    const lineHeight = fontSize * 1.4; // line spacing
    const pageNumberSize = 20; // size of page number
    const maxLinesPerPage = Math.floor((height - (margin * 2) - pageNumberSize) / lineHeight) + 1;
    const maxWidth = width - (margin * 2);
    
    // Function to split text into pages
    const splitTextIntoPages = (textContent: string): string[] => {
      // First split text into lines that fit within page width
      const lines: string[] = [];
      const paragraphs = textContent.split('\n');
      
      paragraphs.forEach(paragraph => {
        // Skip empty paragraphs or handle them as line breaks
        if (!paragraph.trim()) {
          lines.push('');
          return;
        }
        
        // Handle word wrapping differently for English vs Chinese/Japanese/etc
        // For English, we need to respect word boundaries
        let currentLine = '';
        
        // First check if paragraph is in a mixed mode with both Chinese and English
        const hasChinese = /[\u4e00-\u9fa5]/.test(paragraph);
        const hasLatin = /[a-zA-Z0-9]/.test(paragraph);
        const isMixedMode = hasChinese && hasLatin;
        
        if (isMixedMode) {
          // For mixed content, we need to handle both Latin words and Chinese characters
          // First segment text into chunks of consecutive Latin characters or non-Latin characters
          const segments: {text: string, isLatin: boolean}[] = [];
          let currentSegment = '';
          let currentIsLatin = /[a-zA-Z0-9]/.test(paragraph[0] || '');
          
          Array.from(paragraph).forEach(char => {
            const charIsLatin = /[a-zA-Z0-9]/.test(char);
            
            if (charIsLatin !== currentIsLatin) {
              // Change in character type, create a new segment
              segments.push({text: currentSegment, isLatin: currentIsLatin});
              currentSegment = char;
              currentIsLatin = charIsLatin;
            } else {
              // Same character type, append to current segment
              currentSegment += char;
            }
          });
          
          // Add the last segment
          if (currentSegment) {
            segments.push({text: currentSegment, isLatin: currentIsLatin});
          }
          
          // Now handle each segment with its appropriate wrapping rules
          for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            
            if (segment.isLatin) {
              // Handle latin segment as a whole word - never add space between Chinese and English
              const testLine = currentLine + segment.text;
              context.font = `${fontSize}px Arial, sans-serif`;
              const testWidth = context.measureText(testLine).width;
              
              if (testWidth > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = segment.text;
              } else {
                currentLine = testLine;
              }
            } else {
              // Handle Chinese segment character by character
              const characters = Array.from(segment.text);
              
              for (let j = 0; j < characters.length; j++) {
                const char = characters[j];
                
                // Check if current character is Chinese punctuation
                const isChinesePunctuation = /[，。：；？！、）】」』'"〕］｝》〉]/.test(char);
                
                // Special case: If we're about to add punctuation but the line would be too long,
                // check if we can add it to the previous line
                const testLine = currentLine + char;
                context.font = `${fontSize}px Arial, sans-serif`;
                const testWidth = context.measureText(testLine).width;
                
                if (testWidth > maxWidth && currentLine && isChinesePunctuation) {
                  // Add the punctuation to the previous line regardless of width
                  // (we'll sacrifice the exact width limit to maintain proper punctuation flow)
                  lines.push(currentLine + char);
                  currentLine = '';
                  continue;
                } else if (testWidth > maxWidth && currentLine) {
                  // Normal wrapping for non-punctuation
                  lines.push(currentLine);
                  currentLine = char;
                } else {
                  // No wrapping needed, just append
                  currentLine = testLine;
                }
              }
            }
          }
        } else if (hasLatin && !hasChinese) { // This replaces isMainlyLatin
          // English/Latin text - split by words
          const words = paragraph.split(/\s+/);
          
          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            
            // Measure text width for wrapping
            context.font = `${fontSize}px Arial, sans-serif`;
            const testWidth = context.measureText(testLine).width;
            
            if (testWidth > maxWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
        } else {
          // For non-Latin characters (like Chinese), one character might already be a word
          const characters = Array.from(paragraph); // Properly handle multi-byte characters
          
          for (let i = 0; i < characters.length; i++) {
            const char = characters[i];
            
            // Check if current character is Chinese punctuation
            const isChinesePunctuation = /[，。：；？！、）】」』'"〕］｝》〉]/.test(char);
            
            // Special case: If we're about to add punctuation but the line would be too long,
            // check if we can add it to the previous line
            const testLine = currentLine + char;
            context.font = `${fontSize}px Arial, sans-serif`;
            const testWidth = context.measureText(testLine).width;
            
            if (testWidth > maxWidth && currentLine && isChinesePunctuation) {
              // Add the punctuation to the previous line regardless of width
              // (we'll sacrifice the exact width limit to maintain proper punctuation flow)
              lines.push(currentLine + char);
              currentLine = '';
              continue;
            } else if (testWidth > maxWidth && currentLine) {
              // Normal wrapping for non-punctuation
              lines.push(currentLine);
              currentLine = char;
            } else {
              // No wrapping needed, just append
              currentLine = testLine;
            }
          }
        }
        
        if (currentLine) {
          lines.push(currentLine);
        }
      });
      
      // Group lines into pages
      const pages: string[] = [];
      let currentPage: string[] = [];
      
      lines.forEach(line => {
        if (currentPage.length >= maxLinesPerPage) {
          pages.push(currentPage.join('\n'));
          currentPage = [line];
        } else {
          currentPage.push(line);
        }
      });
      
      // Add the last page if it has content
      if (currentPage.length > 0) {
        pages.push(currentPage.join('\n'));
      }
      
      return pages;
    };
    
    // Split text into pages
    const pages = splitTextIntoPages(text);
    const imageUrls: string[] = [];
    
    // Function to render a single page
    const renderPage = (pageContent: string, pageNumber: number): string => {
      // Clear canvas
      context.fillStyle = '#f8f8f8'; // very light background
      context.fillRect(0, 0, width, height);
      
      // Draw a subtle border
      context.strokeStyle = '#e0e0e0';
      context.lineWidth = 2;
      context.strokeRect(margin/2, margin/2, width - margin, height - margin);
      
      // Set text properties
      context.font = `${fontSize}px Arial, sans-serif`;
      context.fillStyle = '#333333'; // dark text color
      context.textBaseline = 'top';
      
      // Draw text lines
      const lines = pageContent.split('\n');
      lines.forEach((line, lineIndex) => {
        const y = margin + (lineIndex * lineHeight);
        context.fillText(line, margin, y);
      });
      
      // Draw page number (just the number, no "Page" text)
      context.font = `${pageNumberSize}px Arial, sans-serif`;
      context.fillStyle = '#888888'; // lighter color for page number
      context.fillText(`${pageNumber + 1}`, 15, height - 30);
      
      // Convert canvas to image URL with better quality
      return canvas.toDataURL('image/jpeg', 0.95);
    };
    
    // Render each page and collect image URLs
    pages.forEach((pageContent, index) => {
      const imageUrl = renderPage(pageContent, index);
      imageUrls.push(imageUrl);
    });
    
    // Update state with generated images
    setTextImageUrls(imageUrls);
    setIsGeneratingTextImages(false);
  };
  
  // Function to download a text image
  const downloadTextImage = (imageUrl: string, pageIndex: number) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `text-page-${pageIndex + 1}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Function to download all text images as a zip
  const downloadAllTextImages = () => {
    if (textImageUrls.length === 0) return;
    
    // For a single image, just download it directly
    if (textImageUrls.length === 1) {
      downloadTextImage(textImageUrls[0], 0);
      return;
    }
    
    // For multiple images, trigger downloads with a small delay between each
    textImageUrls.forEach((url, index) => {
      setTimeout(() => {
        downloadTextImage(url, index);
      }, index * 300); // 300ms delay between downloads
    });
  };

  return (
    <div className="converter-container">
      <div className="book-cover-section">
        <div className="title-input">
          <div style={{ display: 'flex', flex: 1, gap: '10px' }}>
            <textarea
              id="titleInput"
              value={titleText}
              onChange={handleTitleChange}
              placeholder="Enter your title..."
              rows={1}
              style={{ 
                resize: 'vertical',
                minHeight: '38px',
                fontFamily: 'inherit',
                flex: 1
              }}
            />
            <button 
              className="generate-button"
              onClick={handleGenerateBookCover}
              disabled={!titleText.trim() || isGeneratingCover}
            >
              {isGeneratingCover ? 'Generating...' : 'Generate Covers'}
            </button>
          </div>
        </div>
        
        {isGeneratingCover && <p className="generating-message">Generating 4 different cover designs...</p>}
        
        {bookCoverUrls.length > 0 && (
          <div className="covers-grid">
            {bookCoverUrls.map((url, index) => (
              <div 
                key={index} 
                className={`cover-preview-item ${selectedCoverIndex === index ? 'selected' : ''}`}
                onClick={() => setSelectedCoverIndex(index)}
              >
                <img 
                  src={url} 
                  alt={`Cover design ${index + 1}`} 
                  className="cover-thumbnail"
                />
              </div>
            ))}
          </div>
        )}
        
        {selectedCoverIndex !== null && bookCoverUrls[selectedCoverIndex] && (
          <div className="selected-cover-actions">
            <button className="download-button" onClick={() => {
              const a = document.createElement('a');
              a.href = bookCoverUrls[selectedCoverIndex!];
              a.download = `${titleText.replace(/\s+/g, '-').toLowerCase()}-cover.jpg`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}>
              Download Selected Cover
            </button>
          </div>
        )}
        
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      
      <div className="input-section">
        <div className="input-textarea">
          <label htmlFor="weiboText">Input Weibo Text:</label>
          <textarea
            id="weiboText"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Paste your Weibo text here..."
            rows={6}
          />
        </div>
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
      
      <button 
        className="convert-button" 
        onClick={handleConvert}
        disabled={!inputText.trim()}
      >
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

      {/* New Text-to-Image Feature */}
      <div className="text-to-image-section">
        <h3>Convert Text to Images</h3>
        
        <div className="text-image-controls">
          <button
            className="generate-images-button"
            onClick={handleGenerateTextImages}
            disabled={!inputText.trim() || isGeneratingTextImages}
          >
            {isGeneratingTextImages ? 'Generating...' : 'Generate Text Images'}
          </button>
        </div>
        
        <canvas ref={textCanvasRef} style={{ display: 'none' }} />
        
        {textImageUrls.length > 0 && (
          <div className="text-images-section">
            <div className="download-all-container">
              <button 
                className="download-all-button"
                onClick={downloadAllTextImages}
              >
                Download All Images ({textImageUrls.length})
              </button>
            </div>
            
            <div className="text-images-grid">
              {textImageUrls.map((url, index) => (
                <div key={index} className="text-image-item">
                  <img 
                    src={url} 
                    alt={`Text page ${index + 1}`} 
                    className="text-image-thumbnail"
                  />
                  <button 
                    className="download-button"
                    onClick={() => downloadTextImage(url, index)}
                  >
                    Download Page {index + 1}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeiboConverter; 