import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'

interface ImageWithMetadata {
  image: string
  metadata: string
  timestamp: Date
  likeMessage?: string
}

function App() {
  // Local storage keys
  const STORAGE_KEYS = {
    CURRENT_IMAGE_INDEX: 'fashion-taster-current-image-index',
    LIKED_IMAGES: 'fashion-taster-liked-images',
    ACTIVE_TAB: 'fashion-taster-active-tab'
  };

  // Helper functions for local storage
  const saveToLocalStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  const loadFromLocalStorage = (key: string, defaultValue: any) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return defaultValue;
    }
  };

  const [showSplash, setShowSplash] = useState(true)

  const [activeTab, setActiveTab] = useState(() => loadFromLocalStorage(STORAGE_KEYS.ACTIVE_TAB, 'play'))
  const [currentImageIndex, setCurrentImageIndex] = useState(() => loadFromLocalStorage(STORAGE_KEYS.CURRENT_IMAGE_INDEX, 0))
  const [likedImages, setLikedImages] = useState<ImageWithMetadata[]>(() => {
    const saved = loadFromLocalStorage(STORAGE_KEYS.LIKED_IMAGES, []);
    // Convert timestamp strings back to Date objects
    return saved.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp)
    }));
  })

  const [fashionThesis, setFashionThesis] = useState<string>('');
  const [isGeneratingThesis, setIsGeneratingThesis] = useState<boolean>(false);
  const [selectedImageBlurb, setSelectedImageBlurb] = useState<string>('');
  const [isGeneratingBlurb, setIsGeneratingBlurb] = useState<boolean>(false);
  const [clickedImageIndex, setClickedImageIndex] = useState<number | null>(null);
  
  // New state for color insights and clothing preferences
  const [colorInsights, setColorInsights] = useState<string>('');
  const [clothingPreferences, setClothingPreferences] = useState<string>('');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState<boolean>(false);
  
  // State for draggable box positions
  const [boxPositions, setBoxPositions] = useState({
    colorInsights: { x: 40, y: 80 },
    clothingPreferences: { x: 40, y: 200 },
    fashionThesis: { x: window.innerWidth - 320, y: 140 }
  });
  
  // State for tracking which box is being dragged
  const [draggedBox, setDraggedBox] = useState<string | null>(null);




  // Helper function to format AI-generated text with compact, readable layout
  const formatAIText = (text: string) => {
    if (!text) return '';
    
    // Split text into lines and process each line
    const lines = text.split('\n');
    const formattedLines = lines.map((line) => {
      const trimmedLine = line.trim();
      
      // Check if line is a heading (starts with ** or contains key phrases)
      const isHeading = trimmedLine.startsWith('**') || 
                       trimmedLine.match(/^(Style Patterns|Clothing Preferences|Color Preferences|Actionable Style Tips|Key Style Patterns|Fashion Summary|Key Clothing Items|How to Style|Styling and Layering|Accessories|Styling Tips)/);
      
      if (isHeading) {
        // Remove ** markers if present and make it a compact heading
        const cleanHeading = trimmedLine.replace(/\*\*/g, '').trim();
        return `<div class="ai-section-divider"></div><strong class="ai-section-label">${cleanHeading}:</strong>`;
      } else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
        // Convert bullet points to inline text with bold labels
        const cleanText = trimmedLine.replace(/^[•\-]\s*/, '').trim();
        return `<span class="ai-inline-text">${cleanText}</span>`;
      } else if (trimmedLine.match(/^\d+\./)) {
        // Convert numbered lists to inline text
        const cleanText = trimmedLine.replace(/^\d+\.\s*/, '').trim();
        return `<span class="ai-inline-text">${cleanText}</span>`;
      } else if (trimmedLine) {
        // Regular text
        return `<span class="ai-inline-text">${trimmedLine}</span>`;
      }
      return '';
    });
    
    return formattedLines.join('');
  };

  // All outfit and fashion images available in the app
  const images = [
    // Original screenshots
    '/screenshot.png',
    '/screenshot1.png',
    '/screenshot2.png',
    '/screenshot3.png',
    '/screenshot4.png',
    '/screenshot5.png',
    '/screenshot6.png',
    '/screenshot7.png',
    '/screenshot8.png',
    '/screenshot9.png',
    '/screenshot10.png',
    '/screenshot11.jpg',
    '/screenshot12.jpg',
    '/screenshot13.jpg',
    '/screenshot14.jpg',
    '/screenshot15.jpg',
    // Pinterest fashion outfit inspiration
    '/pinterest_outfit_001.jpg',
    '/pinterest_outfit_002.jpg',
    '/pinterest_outfit_003.jpg',
    '/pinterest_outfit_004.jpg',
    '/pinterest_outfit_005.jpg',
    '/pinterest_outfit_006.jpg',
    '/pinterest_outfit_007.jpg',
    '/pinterest_outfit_008.jpg',
    '/pinterest_outfit_009.jpg',
    '/pinterest_outfit_010.jpg',
    '/pinterest_outfit_011.jpg',
    '/pinterest_outfit_012.jpg',
    '/pinterest_outfit_014.jpg',
    '/pinterest_outfit_015.jpg'
  ]



  // Function to generate fashion thesis using GPT API
  const generateFashionThesis = async (metadataList: string[]) => {
    setIsGeneratingThesis(true)
    console.log('Generating thesis with metadata:', metadataList)
    try {
      // Use localhost for local testing, production API for deployed app
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = isLocalhost ? 'http://localhost:3002/api/fashion-thesis' : '/api/fashion-thesis';
      
      console.log('Using fashion-thesis API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: metadataList,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fashion thesis API error response:', errorText);
        throw new Error(`Failed to generate fashion thesis: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Fashion thesis API response:', data);
      
      return data.thesis;
    } catch (error) {
      console.error('Error generating thesis:', error)
      return 'Your fashion taste is evolving and unique!'
    } finally {
      setIsGeneratingThesis(false)
    }
  }

  // Generate color insights using GPT API
  const generateColorInsights = async (metadataList: string[]) => {
    setIsGeneratingInsights(true)
    console.log('Generating color insights with metadata:', metadataList)
    try {
      // Use localhost for local testing, production API for deployed app
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = isLocalhost ? 'http://localhost:3002/api/color-insights' : '/api/color-insights';
      
      console.log('Using color-insights API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: metadataList,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Color insights API error response:', errorText);
        throw new Error(`Failed to generate color insights: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Color insights API response:', data);
      
      return data.insights;
    } catch (error) {
      console.error('Error generating color insights:', error)
      return 'Your color preferences are unique and evolving!'
    } finally {
      setIsGeneratingInsights(false)
    }
  }

  // Generate clothing preferences using GPT API
  const generateClothingPreferences = async (metadataList: string[]) => {
    setIsGeneratingInsights(true)
    console.log('Generating clothing preferences with metadata:', metadataList)
    try {
      // Use localhost for local testing, production API for deployed app
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = isLocalhost ? 'http://localhost:3002/api/clothing-preferences' : '/api/clothing-preferences';
      
      console.log('Using clothing-preferences API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: metadataList,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Clothing preferences API error response:', errorText);
        throw new Error(`Failed to generate clothing preferences: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Clothing preferences API response:', data);
      
      return data.preferences;
    } catch (error) {
      console.error('Error generating clothing preferences:', error)
      return 'Your clothing style is distinctive and personal!'
    } finally {
      setIsGeneratingInsights(false)
    }
  }

  // Hide splash screen after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  // Save current image index to local storage
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.CURRENT_IMAGE_INDEX, currentImageIndex);
  }, [currentImageIndex]);

  // Save liked images to local storage
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.LIKED_IMAGES, likedImages);
  }, [likedImages]);

  // Save active tab to local storage
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.ACTIVE_TAB, activeTab);
  }, [activeTab]);

  // Generate insights only when visiting "Your Wall" page
  useEffect(() => {
    if (activeTab === 'your wall' && likedImages.length >= 3 && !fashionThesis && !colorInsights && !clothingPreferences) {
      const metadataList = likedImages.map(item => item.metadata)
      console.log('Generating insights for Your Wall page with metadata:', metadataList)
      console.log('Starting insight generation...')
      
      // Generate all insights in parallel for speed
      Promise.all([
        generateFashionThesis(metadataList),
        generateColorInsights(metadataList),
        generateClothingPreferences(metadataList)
      ]).then(([thesis, colorInsights, clothingPrefs]) => {
        console.log('All insights generated:', { thesis, colorInsights, clothingPrefs })
        setFashionThesis(thesis)
        setColorInsights(colorInsights)
        setClothingPreferences(clothingPrefs)
      }).catch(error => {
        console.error('Error generating insights:', error)
      })
    }
  }, [activeTab, likedImages, generateFashionThesis, generateColorInsights, generateClothingPreferences])

  // Generate outfit implementation blurb
  const generateOutfitBlurb = async (metadata: string, index: number) => {
    try {
      console.log('Generating outfit blurb for index:', index, 'metadata:', metadata);
      setIsGeneratingBlurb(true);
      setClickedImageIndex(index);
      
      // Use localhost for local testing, production API for deployed app
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = isLocalhost ? 'http://localhost:3002/api/outfit-tips' : '/api/outfit-tips';
      
      console.log('Using outfit-tips API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: metadata,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Outfit tips API error response:', errorText);
        throw new Error(`Failed to generate outfit tips: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Outfit tips API response:', data);
      
      setSelectedImageBlurb(data.tips);
    } catch (error) {
      console.error('Error generating outfit blurb:', error);
      setSelectedImageBlurb('Click to see outfit tips!');
    } finally {
      setIsGeneratingBlurb(false);
    }
  };

  // Generate personalized like message using GPT API
  const generateLikeMessage = async (metadata: string) => {
    try {
      console.log('Generating like message for metadata:', metadata);
      
      // Use localhost for local testing, production API for deployed app
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = isLocalhost ? 'http://localhost:3002/api/like-message' : '/api/like-message';
      
      console.log('Using like-message API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: metadata,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Like message API error response:', errorText);
        throw new Error(`Failed to generate like message: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Like message API response:', data);
      
      return data.message;
    } catch (error) {
      console.error('Error generating like message:', error);
      return 'You seem to like this outfit!';
    }
  };

  const handleImageClick = (metadata: string, index: number) => {
    console.log('Image clicked:', index, 'current clicked index:', clickedImageIndex);
    if (clickedImageIndex === index && selectedImageBlurb && !isGeneratingBlurb) {
      console.log('Hiding blurb for index:', index);
      setSelectedImageBlurb('');
      setClickedImageIndex(null);
    } else {
      console.log('Generating blurb for index:', index);
      generateOutfitBlurb(metadata, index);
    }
  };

  // Drag and drop handlers for insight boxes
  const handleMouseDown = (e: React.MouseEvent, boxType: string) => {
    e.preventDefault();
    setDraggedBox(boxType);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedBox) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setBoxPositions(prev => ({
        ...prev,
        [draggedBox]: { x, y }
      }));
    }
  };

  const handleMouseUp = () => {
    setDraggedBox(null);
  };

  const handleLikeClick = async () => {
    // Add current image with metadata to liked images
    const currentImage = images[currentImageIndex]
    
    // Generate personalized like message first
    let likeMessage = '';
    try {
      likeMessage = await generateLikeMessage(`Fashion outfit ${currentImageIndex + 1} - Style inspiration from our collection`);
    } catch (error) {
      console.error('Failed to generate like message:', error);
      likeMessage = 'You seem to like this outfit!';
    }
    
    const newImageWithMetadata: ImageWithMetadata = {
      image: currentImage,
      metadata: `Fashion outfit ${currentImageIndex + 1} - Style inspiration from our collection`,
      timestamp: new Date(),
      likeMessage: likeMessage
    }
    
    // Check if image already exists
    const exists = likedImages.some(item => item.image === currentImage)
    if (!exists) {
      setLikedImages([...likedImages, newImageWithMetadata])
    }

    // Move to next image quickly
    setTimeout(() => {
      setCurrentImageIndex((prev: number) => (prev + 1) % images.length);
    }, 300);
  }

  const handleNoLikeClick = () => {
    // Move to next image quickly
    setTimeout(() => {
      setCurrentImageIndex((prev: number) => (prev + 1) % images.length);
    }, 300);
  }

  const handleResetAll = () => {
    setLikedImages([]);
    setFashionThesis('');
    setColorInsights('');
    setClothingPreferences('');
    setCurrentImageIndex(0);
    setSelectedImageBlurb('');
    setClickedImageIndex(null);
    // Clear local storage
    localStorage.removeItem('fashion-taster-liked-images');
    localStorage.removeItem('fashion-taster-current-image-index');
    localStorage.removeItem('fashion-taster-active-tab');
  }

  // Parse GPT-generated color palette from color insights text
  const parseColorPalette = (colorInsights: string) => {
    if (!colorInsights) return [];
    
    // Look for hex codes in the format #HEXCODE - Color name
    const hexRegex = /#([A-Fa-f0-9]{6})\s*-\s*([^•\n]+)/g;
    const colors: Array<{hex: string, name: string}> = [];
    let match;
    
    while ((match = hexRegex.exec(colorInsights)) !== null) {
      // Validate hex code is complete
      if (match[1] && match[1].length === 6 && match[2]) {
        colors.push({
          hex: `#${match[1].toUpperCase()}`,
          name: match[2].trim()
        });
      }
    }
    
    // If no valid hex codes found, return a curated fallback palette
    if (colors.length === 0) {
      return [
        { hex: '#2C3E50', name: 'Deep Navy' },
        { hex: '#E8C39E', name: 'Warm Beige' },
        { hex: '#D35400', name: 'Rich Orange' },
        { hex: '#F8F9FA', name: 'Soft White' },
        { hex: '#9B59B6', name: 'Amethyst' },
        { hex: '#E67E22', name: 'Carrot Orange' }
      ];
    }
    
    // Ensure we have at least 6 colors
    while (colors.length < 6) {
      // Add complementary colors based on existing ones
      const fallbackColors = [
        { hex: '#95A5A6', name: 'Cool Gray' },
        { hex: '#E74C3C', name: 'Coral Red' },
        { hex: '#3498DB', name: 'Sky Blue' },
        { hex: '#F1C40F', name: 'Golden Yellow' },
        { hex: '#1ABC9C', name: 'Turquoise' },
        { hex: '#E91E63', name: 'Pink' }
      ];
      colors.push(fallbackColors[colors.length - 1]);
    }
    
    // Return up to 8 colors
    return colors.slice(0, 8);
  }



  const renderPlayContent = () => (
    <>
      <div className="placeholder-icon">
        <img 
          src="/Frame 31.png" 
          className="frame-icon"
        />
      </div>
      
      <div className="content-container">
        <div className="image-box">
          <img 
            src={images[currentImageIndex]}
            alt={`Screenshot ${currentImageIndex + 1}`}
            className="screenshot-image"
            onError={(e) => {
              console.error('Image failed to load');
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              // Add fallback text
              const fallback = document.createElement('div');
              fallback.textContent = 'Image not found';
              fallback.style.cssText = 'color: #666; font-size: 16px; text-align: center;';
              target.parentNode?.appendChild(fallback);
            }}
            onLoad={() => {
              console.log('Image loaded successfully');
            }}
          />
        </div>


      </div>

      <div className="button-container">
        <div className="button-row">
          <button className="like-button" onClick={handleLikeClick}>
            like
          </button>
          <button className="no-like-button" onClick={handleNoLikeClick}>
            no like
          </button>
        </div>
        <button className="reset-button" onClick={handleResetAll}>
          🔄 reset all
        </button>
      </div>


    </>
  )

  const renderYourWallContent = () => (
    <div 
      className="your-wall-content"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Color Insights Box */}
      {colorInsights && (
        <div 
          className="insight-box color-insights"
          style={{
            left: `${boxPositions.colorInsights.x}px`,
            top: `${boxPositions.colorInsights.y}px`
          }}
          onMouseDown={(e) => handleMouseDown(e, 'colorInsights')}
        >
          <h3>Your Color Palette</h3>
          <div className="insight-content">
            {/* Dynamic Color Swatches */}
            <div className="color-swatches">
              {parseColorPalette(colorInsights).map((color, index) => (
                <div key={index} className="color-swatch">
                  <div className="color-circle" style={{ backgroundColor: color.hex }}></div>
                  <div className="hex-code">{color.hex}</div>
                  <div className="color-name">{color.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clothing Preferences Box */}
      {clothingPreferences && (
        <div 
          className="insight-box clothing-preferences"
          style={{
            left: `${boxPositions.clothingPreferences.x}px`,
            top: `${boxPositions.clothingPreferences.y}px`
          }}
          onMouseDown={(e) => handleMouseDown(e, 'clothingPreferences')}
        >
          <h3>Your Style Pieces</h3>
          <div className="insight-content">
            {isGeneratingInsights ? (
              <div className="insight-loading">
                <div className="loading-spinner"></div>
                Analyzing your style preferences...
              </div>
            ) : (
              <div className="clothing-content">
                <div dangerouslySetInnerHTML={{ __html: formatAIText(clothingPreferences) }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fashion Thesis Box */}
      {fashionThesis && (
        <div 
          className="insight-box fashion-thesis"
          style={{
            left: `${boxPositions.fashionThesis.x}px`,
            top: `${boxPositions.fashionThesis.y}px`
          }}
          onMouseDown={(e) => handleMouseDown(e, 'fashionThesis')}
        >
          <h3>Your Fashion Thesis</h3>
          <div className="insight-content">
            {isGeneratingThesis ? (
              <div className="insight-loading">
                <div className="loading-spinner"></div>
                Generating your fashion thesis...
              </div>
            ) : (
              <div className="thesis-content">
                <div dangerouslySetInnerHTML={{ __html: formatAIText(fashionThesis) }} />
              </div>
            )}
          </div>
        </div>
      )}
      
      {likedImages.length === 0 ? (
        <div className="empty-state">
          <p>No liked images yet. Start voting to build your wall!</p>
        </div>
      ) : (
        <div className="liked-images">
          <div style={{ marginBottom: '20px' }}>
            <h3>Your Liked Outfits</h3>
          </div>
          <div className="images-grid">
            {likedImages.map((item, index) => (
              <div 
                key={index} 
                className={`liked-image-container ${clickedImageIndex === index && selectedImageBlurb ? 'expanded' : ''}`}
              >
                <div className="image-wrapper">
                  <img 
                    src={item.image} 
                    alt={`Liked outfit ${index + 1}`}
                    className="liked-image"
                    onClick={() => handleImageClick(item.metadata, index)}
                  />
                  <button 
                    className="hanger-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageClick(item.metadata, index);
                    }}
                    title="Get outfit recreation tips"
                  >
                    🧥 Get Tips
                  </button>
                </div>
                <div className="polaroid">
                  <div className="polaroid-metadata">
                    <div className="metadata-summary">
                      {item.likeMessage ? (
                        <div className="like-message-display">
                          {item.likeMessage}
                        </div>
                      ) : (
                        item.metadata.split('\n').slice(0, 2).map((line, index) => (
                          <div key={index} className="metadata-line">
                            {line.trim()}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  {clickedImageIndex === index && selectedImageBlurb && (
                    <div className="outfit-blurb">
                      {isGeneratingBlurb ? (
                        <div className="blurb-loading">
                          <div className="loading-spinner"></div>
                          Generating outfit tips...
                        </div>
                      ) : (
                        <div className="blurb-content">
                          <h4>How to Recreate This Look:</h4>
                          <div className="recreation-tips">
                            {selectedImageBlurb}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <Routes>
      <Route path="/" element={
        <>
          {/* Splash Screen */}
          {showSplash && (
            <div className="splash-screen">
              <div className="splash-content">
                <img src="/Frame 31.png" alt="Fashion Taster Logo" className="splash-logo" />
                <h1 className="splash-title">explore your fashion taste</h1>
                <p className="splash-subtitle">unpack your style and understand what you like. It can be a journey knowing what you like.</p>
              </div>
            </div>
          )}
          
          {/* Main App */}
          {!showSplash && (
            <div className="app">
              {/* Header with Logo */}
              {/* <div className="header">
                <img src="/Frame 31.png" alt="Fashion Taster Logo" className="app-logo" onError={(e) => console.error('Logo failed to load:', e)} />
              </div> */}
              
              {/* Tabs */}
              <div className="tabs">
                <button 
                  className={`tab ${activeTab === 'play' ? 'active' : ''}`}
                  onClick={() => setActiveTab('play')}
                >
                  play
                </button>
                <button 
                  className={`tab ${activeTab === 'your wall' ? 'active' : ''}`}
                  onClick={() => setActiveTab('your wall')}
                >
                  your wall
                </button>
              </div>

              {/* Content based on active tab */}
              {activeTab === 'play' ? renderPlayContent() : renderYourWallContent()}
              
              {/* Footer */}
              <footer className="app-footer">
                <div className="footer-content">
                  <div className="footer-left">
                    <p>&copy; 2024 Fashion Taster. All rights reserved.</p>
                  </div>
                </div>
              </footer>
            </div>
          )}
        </>
      } />
    </Routes>
  )
}

export default App
