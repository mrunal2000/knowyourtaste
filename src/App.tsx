import { useState, useEffect, useCallback } from 'react'
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
  const [currentImageIndex, setCurrentImageIndex] = useState(() => {
    const savedIndex = loadFromLocalStorage(STORAGE_KEYS.CURRENT_IMAGE_INDEX, null);
    // If no saved index, start from a random image for variety (59 total images)
    if (savedIndex === null) {
      return Math.floor(Math.random() * 59);
    }
    return savedIndex;
  })
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
    fashionThesis: { x: Math.max(40, window.innerWidth - 360), y: 140 }
  });
  
  // State for tracking which box is being dragged
  const [draggedBox, setDraggedBox] = useState<string | null>(null);
  
  // Flag to ensure insights are only generated once per session


  // Handle window resize to keep boxes within bounds
  useEffect(() => {
    const handleResize = () => {
      setBoxPositions(prev => {
        const boxWidth = 320;
        const boxHeight = 200;
        const margin = 20;
        
        return {
          colorInsights: {
            x: Math.max(margin, Math.min(prev.colorInsights.x, window.innerWidth - boxWidth - margin)),
            y: Math.max(margin, Math.min(prev.colorInsights.y, window.innerHeight - boxHeight - margin))
          },
          clothingPreferences: {
            x: Math.max(margin, Math.min(prev.clothingPreferences.x, window.innerWidth - boxWidth - margin)),
            y: Math.max(margin, Math.min(prev.clothingPreferences.y, window.innerHeight - boxHeight - margin))
          },
          fashionThesis: {
            x: Math.max(margin, Math.min(prev.fashionThesis.x, window.innerWidth - boxWidth - margin)),
            y: Math.max(margin, Math.min(prev.fashionThesis.y, window.innerHeight - boxHeight - margin))
          }
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);




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
        // Special handling for clothing preferences format: "• **Category** - Description"
        if (trimmedLine.includes('**') && trimmedLine.includes(' - ')) {
          const parts = trimmedLine.split(' - ');
          if (parts.length === 2) {
            const category = parts[0].replace(/^[•\-]\s*/, '').trim();
            const description = parts[1].trim();
            
            // Extract the category name from **Category** format
            const categoryName = category.replace(/\*\*/g, '').trim();
            
            return `<li><strong>${categoryName}</strong> - ${description}</li>`;
          }
        }
        
        // Handle lines that start with ** but don't have the - separator
        if (trimmedLine.includes('**')) {
          const categoryName = trimmedLine.replace(/^[•\-]\s*/, '').replace(/\*\*/g, '').trim();
          return `<li><strong>${categoryName}</strong></li>`;
        }
        
        // Regular bullet point handling
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

  // All outfit and fashion images available in the app (using cropped versions)
  const images = [
    // New fashion images (primary collection) - cropped versions
    '/cropped/cropped_1c623499be27e2195562655131e41175.jpg',
    '/cropped/cropped_1d0a99081666f4a119e115f1644479f9.jpg',
    '/cropped/cropped_1dbcb9365ffd38733a59a6ef8103d271.jpg',
    '/cropped/cropped_1e40320294fd6befef0d50b179b49e98.jpg',
    '/cropped/cropped_220d562e59828a8c287c0c43548d2f6f.jpg',
    '/cropped/cropped_29cefb0ef7853ed6c6faa68364506b53.jpg',
    '/cropped/cropped_2ce6c8460cdf4109769217e32120ec02.jpg',
    '/cropped/cropped_30d2fe0d9e859c6aac4abdbec48f8b1c.jpg',
    '/cropped/cropped_47f877955eec8b5b96afedb1889a56ff.jpg',
    '/cropped/cropped_505dd70ccb4338f90f1790ed46c85c1c.jpg',
    '/cropped/cropped_54e5c226dfcb149d97e1354117034d76.jpg',
    '/cropped/cropped_64fc81cd38149c3a306c029b16d31df7.jpg',
    '/cropped/cropped_679a46305477779418f6b490628a823d.jpg',
    '/cropped/cropped_6e6b55a0df548b8780f778f8eb990e95.jpg',
    '/cropped/cropped_6e6c39efe740ef818d270d49ebaa7e8c.jpg',
    '/cropped/cropped_719846b78e4fedce59debefd0604f24b.jpg',
    '/cropped/cropped_7bddea1debd393d9899de0f8ea938e2e.jpg',
    '/cropped/cropped_7e9f1f25c227816118998980f7e389b6.jpg',
    '/cropped/cropped_8d1a1b38b296f3a5735c21f1192d8295.jpg',
    '/cropped/cropped_93679253d5198ad65a50a9550aeb5a7b.jpg',
    '/cropped/cropped_9788e5417c2811c385ec99cde6146e06.jpg',
    '/cropped/cropped_9b6d2c71d04348b01850d493846938cd.jpg',
    '/cropped/cropped_a089c0a3a37f6127470f93692ce63a72.jpg',
    '/cropped/cropped_bc7b0d0d52a66d8f801aa3ed2d59dad5.jpg',
    '/cropped/cropped_ce069b6cdfbbe8fe2310f02932530b74.jpg',
    '/cropped/cropped_d273d88018015f4662e590ba66729f13.jpg',
    '/cropped/cropped_dc600dc551029b6fb111fac2a69be4db.jpg',
    '/cropped/cropped_dcb4f112f4d9dcc0eaa94478a5e627c.jpg',
    '/cropped/cropped_ed7e44cd1ccf31b36c1eea4a7e85963a.jpg',
    '/cropped/cropped_f4ec203b865bf79311ad67ed441d53cc.jpg',
    '/cropped/cropped_ff5e20358374067b9207ec6e278d8f28.jpg',
    // Original screenshots (secondary collection) - cropped versions
    '/cropped/cropped_screenshot.png',
    '/cropped/cropped_screenshot1.png',
    '/cropped/cropped_screenshot2.png',
    '/cropped/cropped_screenshot3.png',
    '/cropped/cropped_screenshot4.png',
    '/cropped/cropped_screenshot5.png',
    '/cropped/cropped_screenshot6.png',
    '/cropped/cropped_screenshot7.png',
    '/cropped/cropped_screenshot8.png',
    '/cropped/cropped_screenshot9.png',
    '/cropped/cropped_screenshot10.png',
    '/cropped/cropped_screenshot11.jpg',
    '/cropped/cropped_screenshot12.jpg',
    '/cropped/cropped_screenshot13.jpg',
    '/cropped/cropped_screenshot14.jpg',
    '/cropped/cropped_screenshot15.jpg',
    // Pinterest fashion outfit inspiration (tertiary collection) - cropped versions
    '/cropped/cropped_pinterest_outfit_001.jpg',
    '/cropped/cropped_pinterest_outfit_002.jpg',
    '/cropped/cropped_pinterest_outfit_004.jpg',
    '/cropped/cropped_pinterest_outfit_005.jpg',
    '/cropped/cropped_pinterest_outfit_006.jpg',
    '/cropped/cropped_pinterest_outfit_009.jpg',
    '/cropped/cropped_pinterest_outfit_011.jpg',
    '/cropped/cropped_pinterest_outfit_012.jpg',
    '/cropped/cropped_pinterest_outfit_014.jpg',
    '/cropped/cropped_pinterest_outfit_015.jpg'
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
  const generateClothingPreferences = useCallback(async (metadataList: string[]) => {
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
  }, [])

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

  // Generate insights whenever liked images change and we're on "Your Wall" page
  useEffect(() => {
    // Clear insights if we don't have enough liked images
    if (likedImages.length < 3) {
      setFashionThesis('')
      setColorInsights('')
      setClothingPreferences('')
      return
    }
    
    // Only generate if we're on "Your Wall" page and have enough liked images
    if (activeTab === 'your wall' && likedImages.length >= 3) {
      // Add a small delay to prevent rapid regeneration when liking multiple images quickly
      const timeoutId = setTimeout(() => {
        const metadataList = likedImages.map(item => item.metadata)
        console.log('🚀 REGENERATING INSIGHTS: Liked images changed')
        console.log('📊 Metadata count:', metadataList.length)
        console.log('📝 ACTUAL METADATA BEING SENT TO AI:')
        metadataList.forEach((metadata, index) => {
          console.log(`Image ${index + 1}:`, metadata.substring(0, 200) + '...')
        })
        
        // Set loading states
        setIsGeneratingThesis(true)
        setIsGeneratingInsights(true)
        
        // Generate all insights in parallel for speed
        Promise.all([
          generateFashionThesis(metadataList),
          generateColorInsights(metadataList),
          generateClothingPreferences(metadataList)
        ]).then(([thesis, colorInsights, clothingPrefs]) => {
          console.log('✅ All insights regenerated successfully based on current likes')
          setFashionThesis(thesis)
          setColorInsights(colorInsights)
          setClothingPreferences(clothingPrefs)
        }).catch(error => {
          console.error('❌ Error generating insights:', error)
          // Set fallback content on error
          setFashionThesis('Unable to generate fashion thesis at this time.')
          setColorInsights('Unable to analyze color preferences at this time.')
          setClothingPreferences('Unable to analyze style preferences at this time.')
        }).finally(() => {
          // Clear loading states
          setIsGeneratingInsights(false)
          setIsGeneratingThesis(false)
        })
      }, 1000) // 1 second delay
      
      // Cleanup timeout if component unmounts or effect runs again
      return () => clearTimeout(timeoutId)
    }
  }, [activeTab, likedImages.length, generateClothingPreferences])

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
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;
      
      // Add boundary constraints to prevent boxes from going outside screen
      const boxWidth = 320; // Width of insight boxes
      const boxHeight = 200; // Minimum height of insight boxes
      const margin = 20; // Minimum margin from screen edges
      
      // Constrain x position (left and right boundaries)
      x = Math.max(margin, Math.min(x, window.innerWidth - boxWidth - margin));
      
      // Constrain y position (top and bottom boundaries)
      y = Math.max(margin, Math.min(y, window.innerHeight - boxHeight - margin));
      
      setBoxPositions(prev => ({
        ...prev,
        [draggedBox]: { x, y }
      }));
    }
  };

  const handleMouseUp = () => {
    setDraggedBox(null);
  };

  // Generate detailed metadata for an image based on its filename and content
  const generateDetailedMetadata = (imagePath: string, imageIndex: number): string => {
    const filename = imagePath.split('/').pop() || '';
    
    // Create detailed metadata based on image characteristics
    let metadata = `Outfit ${imageIndex + 1}: `;
    
    if (filename.includes('pinterest_outfit')) {
      // Pinterest outfit images - create detailed descriptions
      const outfitNumber = filename.match(/\d+/)?.[0] || '';
      metadata += `Pinterest fashion inspiration #${outfitNumber}. `;
      
      // Add specific details based on outfit number patterns - focus on tops and pants, avoid dresses unless specifically shown
      if (['001', '002', '003'].includes(outfitNumber)) {
        metadata += `Features fitted tops, blazers, high-waisted trousers, and tailored jackets. Includes classic accessories like gold jewelry, leather bags, and pointed-toe shoes. Color palette: neutral tones, earth colors, classic blacks/navys.`;
      } else if (['004', '005', '006'].includes(outfitNumber)) {
        metadata += `Shows oversized sweaters, loose tops, high-waisted jeans, and statement coats. Includes bold accessories like chunky jewelry, statement bags, and chunky sneakers. Color scheme: vibrant accents with neutral bases.`;
      } else if (['007', '008', '009'].includes(outfitNumber)) {
        metadata += `Displays silk blouses, tailored pants, structured jackets, and elegant coats. Includes refined accessories like delicate jewelry, structured bags, and heeled shoes. Color scheme: sophisticated neutrals and rich tones.`;
      } else if (['010', '011', '012'].includes(outfitNumber)) {
        metadata += `Presents fitted tops, straight-leg jeans, clean-lined skirts, and simple coats. Includes subtle accessories like thin jewelry, neutral bags, and clean sneakers. Color scheme: monochromatic and neutral tones.`;
      } else if (['014', '015'].includes(outfitNumber)) {
        metadata += `Features unique tops, creative skirts, statement pants, and bold outerwear. Includes creative accessories like mixed jewelry, artistic bags, and distinctive shoes. Color scheme: bold combinations and artistic palettes.`;
      }
    } else if (filename.includes('screenshot')) {
      // Screenshot images - create detailed descriptions
      const screenshotNumber = filename.match(/\d+/)?.[0] || '';
      metadata += `Screenshot #${screenshotNumber} showing fashion content. `;
      
      // Add specific details based on screenshot patterns - focus on tops and pants
      if (['1', '2', '3', '4', '5'].includes(screenshotNumber)) {
        metadata += `Displays fitted tops, high-waisted pants, structured jackets, and versatile skirts. Includes classic accessories like gold jewelry, leather bags, and ankle boots. Style: contemporary trends with versatile pieces.`;
      } else if (['6', '7', '8', '9', '10'].includes(screenshotNumber)) {
        metadata += `Shows tailored blazers, fitted tops, straight-leg pants, and structured jackets. Includes refined accessories like delicate jewelry, structured bags, and heeled shoes. Style: sophisticated and refined aesthetics.`;
      } else if (['11', '12', '13', '14', '15'].includes(screenshotNumber)) {
        metadata += `Presents creative tops, unique pants, statement jackets, and bold skirts. Includes artistic accessories like mixed jewelry, creative bags, and distinctive shoes. Style: innovative and artistic expression.`;
      }
    } else if (filename.match(/^[a-f0-9]{32}\.jpg$/)) {
      // New fashion images with hash filenames - provide detailed, varied descriptions
      const imageHash = filename.split('.')[0];
      const hashNumber = parseInt(imageHash.slice(-2), 16) % 10; // Use last 2 chars to create variety
      
      if (hashNumber <= 3) {
        metadata += `Features fitted tops, high-waisted pants, structured jackets, and versatile skirts. Includes classic accessories like gold jewelry, leather bags, and ankle boots. Color palette: neutral tones, earth colors, classic blacks/navys. Style: contemporary and versatile.`;
      } else if (hashNumber <= 6) {
        metadata += `Shows oversized sweaters, loose tops, high-waisted jeans, and statement coats. Includes bold accessories like chunky jewelry, statement bags, and chunky sneakers. Color scheme: vibrant accents with neutral bases. Style: relaxed and bold.`;
      } else {
        metadata += `Displays silk blouses, tailored pants, structured jackets, and elegant coats. Includes refined accessories like delicate jewelry, structured bags, and heeled shoes. Color scheme: sophisticated neutrals and rich tones. Style: elegant and refined.`;
      }
    } else {
      // Generic images - focus on tops and pants, avoid dresses
      metadata += `Fashion inspiration image featuring fitted tops, versatile pants, and contemporary outerwear. Includes modern accessories like statement jewelry, trendy bags, and fashionable shoes. Style: contemporary and versatile.`;
    }
    
    // Add universal style characteristics with more specific details
    metadata += ` The outfit demonstrates attention to detail and personal expression through specific clothing choices. Style elements include consideration of fit, fabric quality, color harmony, and accessory coordination. The ensemble features a mix of classic and contemporary pieces with attention to seasonal appropriateness.`;
    
    return metadata;
  };

  const handleLikeClick = async () => {
    // Add current image with metadata to liked images
    const currentImage = images[currentImageIndex]
    
    // Generate detailed metadata for better AI analysis
    const detailedMetadata = generateDetailedMetadata(currentImage, currentImageIndex);
    
    // Generate personalized like message first
    let likeMessage = '';
    try {
      likeMessage = await generateLikeMessage(detailedMetadata);
    } catch (error) {
      console.error('Failed to generate like message:', error);
      likeMessage = 'You seem to like this outfit!';
    }
    
    const newImageWithMetadata: ImageWithMetadata = {
      image: currentImage,
      metadata: detailedMetadata,
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
    // Start from a random image instead of always starting from 0
    setCurrentImageIndex(Math.floor(Math.random() * 59));
    setSelectedImageBlurb('');
    setClickedImageIndex(null);
    
    // Clear local storage
    localStorage.removeItem('fashion-taster-liked-images');
    localStorage.removeItem('fashion-taster-current-image-index');
    localStorage.removeItem('fashion-taster-active-tab');
  }

  // Get responsive positioning for insight boxes
  const getResponsivePosition = (boxType: string) => {
    const isMobile = window.innerWidth <= 991;
    if (isMobile) {
      return { left: 'auto', top: 'auto' };
    }
    return {
      left: `${boxPositions[boxType as keyof typeof boxPositions].x}px`,
      top: `${boxPositions[boxType as keyof typeof boxPositions].y}px`
    };
  };

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
            alt={`Fashion image ${currentImageIndex + 1}`}
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
      {/* Container for draggable insight boxes */}
      <div className="insights-container">
        {/* Color Insights Box - Always Visible */}
        <div 
          className="insight-box color-insights"
          style={getResponsivePosition('colorInsights')}
          onMouseDown={(e) => handleMouseDown(e, 'colorInsights')}
        >
        <h3>Your Color Palette</h3>
        <div className="insight-content">
          {isGeneratingInsights ? (
            <div className="insight-loading">
              <div className="loading-spinner"></div>
              Analyzing your color preferences...
            </div>
          ) : colorInsights ? (
            /* Dynamic Color Swatches */
            <div className="color-swatches">
              {parseColorPalette(colorInsights).map((color, index) => (
                <div key={index} className="color-swatch">
                  <div className="color-circle" style={{ backgroundColor: color.hex }}></div>
                  <div className="hex-code">{color.hex}</div>
                  <div className="color-name">{color.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="insight-loading">
              <div className="loading-spinner"></div>
              Waiting for your style data...
            </div>
          )}
        </div>
      </div>

      {/* Clothing Preferences Box - Always Visible */}
      <div 
        className="insight-box clothing-preferences"
        style={getResponsivePosition('clothingPreferences')}
        onMouseDown={(e) => handleMouseDown(e, 'clothingPreferences')}
      >
        <h3>Your Style Blueprint</h3>
        <div className="insight-content">
          {isGeneratingInsights ? (
            <div className="insight-loading">
              <div className="loading-spinner"></div>
              Analyzing your style preferences...
            </div>
          ) : clothingPreferences ? (
            <div className="clothing-content">
              <ul dangerouslySetInnerHTML={{ __html: formatAIText(clothingPreferences) }} />
            </div>
          ) : (
            <div className="insight-loading">
              <div className="loading-spinner"></div>
              Waiting for your style data...
            </div>
          )}
        </div>
      </div>

      {/* Fashion Thesis Box - Always Visible */}
      <div 
        className="insight-box fashion-thesis"
        style={getResponsivePosition('fashionThesis')}
        onMouseDown={(e) => handleMouseDown(e, 'fashionThesis')}
      >
        <h3>Your Fashion Thesis</h3>
        <div className="insight-content">
          {isGeneratingThesis ? (
            <div className="insight-loading">
              <div className="loading-spinner"></div>
              Generating your fashion thesis...
            </div>
          ) : fashionThesis ? (
            <div className="thesis-content">
              <div dangerouslySetInnerHTML={{ __html: formatAIText(fashionThesis) }} />
            </div>
          ) : (
            <div className="insight-loading">
              <div className="loading-spinner"></div>
              Waiting for your style data...
            </div>
          )}
        </div>
      </div>
      </div> {/* Close insights-container */}
      
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
                  <div className="footer-right">
                    <p className="attribution">* Thanks to all the amazing fashion creators for sharing their incredible style. Photo sources: Pinterest.</p>
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
