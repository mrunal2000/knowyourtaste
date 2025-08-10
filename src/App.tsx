import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import './App.css'
import PrivacyPolicy from './components/PrivacyPolicy'

interface ImageWithMetadata {
  image: string
  metadata: string
  timestamp: Date
}

function App() {
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [activeTab, setActiveTab] = useState('play')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [likedImages, setLikedImages] = useState<ImageWithMetadata[]>([])
  const [currentMetadata, setCurrentMetadata] = useState('')
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false)
  const [fashionThesis, setFashionThesis] = useState<string>('');
  const [isGeneratingThesis, setIsGeneratingThesis] = useState<boolean>(false);
  const [selectedImageBlurb, setSelectedImageBlurb] = useState<string>('');
  const [isGeneratingBlurb, setIsGeneratingBlurb] = useState<boolean>(false);
  const [clickedImageIndex, setClickedImageIndex] = useState<number | null>(null);
  // New state variables for like message feature
  const [likeMessage, setLikeMessage] = useState<string>('');
  const [isGeneratingLikeMessage, setIsGeneratingLikeMessage] = useState<boolean>(false);

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

  // Function to generate metadata using OpenAI Vision API
  const generateMetadata = async (imageUrl: string) => {
    setIsGeneratingMetadata(true)
    try {
      console.log('Starting metadata generation for image:', imageUrl);
      
      // Convert image to base64
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob()
      console.log('Image blob size:', blob.size, 'bytes');
      
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })

      console.log('Base64 conversion complete, length:', base64.length);
      const base64Data = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      console.log('Base64 data length (without prefix):', base64Data.length);

      // Use localhost for local testing, production API for deployed app
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = isLocalhost ? 'http://localhost:3002/api/analyze' : '/api/analyze';
      
      console.log('Using API URL:', apiUrl);
      console.log('Calling analyze endpoint...');
      
      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Data,
        }),
      })

      console.log('API response status:', apiResponse.status);
      console.log('API response ok:', apiResponse.ok);

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to generate metadata: ${apiResponse.status} - ${errorText}`);
      }

      const data = await apiResponse.json()
      console.log('API response data:', data);
      console.log('Analysis content:', data.analysis);
      
      return data.analysis // Changed from data.metadata to data.analysis to match the API response
    } catch (error) {
      console.error('Error generating metadata:', error)
      return 'Casual outfit with mixed colors and patterns'
    } finally {
      setIsGeneratingMetadata(false)
    }
  }

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

  // Generate metadata when image changes
  useEffect(() => {
    const currentImage = images[currentImageIndex]
    generateMetadata(currentImage).then(setCurrentMetadata)
  }, [currentImageIndex])

  // Generate thesis when liked images reach 3 or more (for testing)
  useEffect(() => {
    console.log('Liked images count:', likedImages.length)
    if (likedImages.length >= 3) {
      const metadataList = likedImages.map(item => item.metadata)
      console.log('Metadata list for thesis:', metadataList)
      generateFashionThesis(metadataList).then(setFashionThesis)
    }
  }, [likedImages])

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
    setIsGeneratingLikeMessage(true);
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
    } finally {
      setIsGeneratingLikeMessage(false);
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

  const handleLikeClick = async () => {
    setShowAnalysis(true)
    // Add current image with metadata to liked images
    const currentImage = images[currentImageIndex]
    const newImageWithMetadata: ImageWithMetadata = {
      image: currentImage,
      metadata: currentMetadata,
      timestamp: new Date()
    }
    
    // Check if image already exists
    const exists = likedImages.some(item => item.image === currentImage)
    if (!exists) {
      setLikedImages([...likedImages, newImageWithMetadata])
    }

    // Generate personalized like message
    try {
      const message = await generateLikeMessage(currentMetadata);
      setLikeMessage(message);
      
      // Clear the like message after 3 seconds
      setTimeout(() => {
        setLikeMessage('');
      }, 3000);
    } catch (error) {
      console.error('Failed to generate like message:', error);
      // Set fallback message
      setLikeMessage('You seem to like this outfit!');
      setTimeout(() => {
        setLikeMessage('');
      }, 3000);
    }
  }

  const handleNoLikeClick = () => {
    // Just move to next image without adding to liked
  }

  const handleVote = (liked: boolean) => {
    if (liked) {
      handleLikeClick()
      setShowAnalysis(true) // Show analysis when liked
      
      // Move to next image after showing analysis
      setTimeout(() => {
        setShowAnalysis(false)
        setCurrentImageIndex((prev) => (prev + 1) % images.length)
      }, 2000) // Show analysis for 2 seconds before moving to next image
    } else {
      handleNoLikeClick()
      // Move to next image immediately for no like
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length)
      }, 500)
    }
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

        {showAnalysis && (
          <div className="analysis-text">
            <div className="smiley">❤️</div>
            <div className="analysis-content">
              {/* Display personalized like message if available */}
              {likeMessage && (
                <div className="like-message">
                  {isGeneratingLikeMessage ? (
                    <div className="like-message-loading">
                      <div className="loading-spinner"></div>
                      Generating your personalized message...
                    </div>
                  ) : (
                    <div className="like-message-content">
                      {likeMessage}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="button-container">
        <button className="like-button" onClick={() => handleVote(true)} disabled={isGeneratingMetadata || isGeneratingLikeMessage}>
          {isGeneratingMetadata || isGeneratingLikeMessage ? 'Generating...' : 'like'}
        </button>
        <button className="no-like-button" onClick={() => handleVote(false)} disabled={isGeneratingMetadata}>
          no like
        </button>
      </div>

      {isGeneratingMetadata && (
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>Analyzing outfit...</p>
        </div>
      )}
    </>
  )

  const renderYourWallContent = () => (
    <div className="your-wall-content">
      {fashionThesis && (
        <div className="fashion-thesis">
          <h3>Your Fashion Thesis</h3>
          <div className="thesis-content">
            {isGeneratingThesis ? (
              <div className="thesis-loading">
                <div className="loading-spinner"></div>
                Generating your fashion thesis...
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: formatAIText(fashionThesis) }} />
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
          <h3>Your Liked Outfits</h3>
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
                    🧥
                  </button>
                </div>
                <div className="polaroid">
                  <div className="polaroid-metadata">
                    <div className="metadata-summary">
                      {item.metadata.split('\n').slice(0, 2).map((line, index) => (
                        <div key={index} className="metadata-line">
                          {line.trim()}
                        </div>
                      ))}
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
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/" element={
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
              <div className="footer-right">
                <Link to="/privacy" className="privacy-policy-link">Privacy Policy</Link>
              </div>
            </div>
          </footer>
        </div>
      } />
    </Routes>
  )
}

export default App
