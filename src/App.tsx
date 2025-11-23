import { useState, useEffect, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'

interface OutfitPiece {
  type: string
  name: string
  color: string
  style: string
  details: string
  location?: {
    x: number
    y: number
    width: number
    height: number
  }
  croppedImageUrl?: string
}

interface ImageWithMetadata {
  image: string
  metadata: string
  timestamp: Date
  likeMessage?: string
  outfitPieces?: OutfitPiece[]
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
    // Convert timestamp strings back to Date objects and preserve outfitPieces
    return saved.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp),
      outfitPieces: item.outfitPieces || undefined // Preserve outfitPieces if they exist
    }));
  })

  const [selectedImageBlurb, setSelectedImageBlurb] = useState<string>('');
  const [isGeneratingBlurb, setIsGeneratingBlurb] = useState<boolean>(false);
  const [clickedImageIndex, setClickedImageIndex] = useState<number | null>(null);
  const [extractingPieces, setExtractingPieces] = useState<Set<string>>(new Set());
  
  // New state for color insights and clothing preferences
  const [colorInsights, setColorInsights] = useState<string>('');
  const [clothingPreferences, setClothingPreferences] = useState<string>('');
  
  // Separate loading state for AI analysis (not for image transitions)
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  
  // State for draggable box positions
  const [boxPositions, setBoxPositions] = useState({
    colorInsights: { x: 40, y: 80 },
    clothingPreferences: { x: 40, y: 200 }
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
          }
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);




  // Helper function to format tips as a numbered list
  const formatTipsAsNumberedList = (text: string) => {
    if (!text) return '';
    
    // Split text by lines
    const lines = text.split('\n').filter(line => line.trim());
    
    // Format each line as a list item if it starts with a number
    const formatted = lines.map(line => {
      const trimmed = line.trim();
      // Check if line starts with a number followed by a period or dot
      const numberedMatch = trimmed.match(/^\d+[\.\)]\s*(.+)$/);
      if (numberedMatch) {
        const content = numberedMatch[1];
        return `<li>${content}</li>`;
      }
      // If it doesn't match numbered format, try to preserve it
      if (trimmed) {
        return `<li>${trimmed}</li>`;
      }
      return '';
    }).filter(item => item).join('');
    
    return `<ol>${formatted}</ol>`;
  };

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
    '/cropped/cropped_220d562e59828a8c2870c43548d2f6f.jpg',
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


  // Get current images based on active filter
  const getCurrentImages = () => {
    return images;
  };

  // Get current image count for random index calculation
  const getCurrentImageCount = () => {
    return getCurrentImages().length;
  };

  // Generate color insights using GPT API
  const generateColorInsights = async (metadataList: string[]) => {
    console.log('Generating color insights with metadata:', metadataList)
    
    const requestData = { metadata: metadataList };
    
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
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Color insights API error response:', errorText);
        const error = `Failed to generate color insights: ${response.status} - ${errorText}`;
        
        // Log failed API call

        throw new Error(error);
      }

      const data = await response.json();
      console.log('Color insights API response:', data);
      
      // Log successful API call
      
      
      return data.insights;
    } catch (error) {
      console.error('Error generating color insights:', error)
      return 'Your color preferences are unique and evolving!'
    }
  }

  // Generate clothing preferences using GPT API
  const generateClothingPreferences = useCallback(async (metadataList: string[]) => {
    console.log('Generating clothing preferences with metadata:', metadataList)
    
    const requestData = { metadata: metadataList };
    
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
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Clothing preferences API error response:', errorText);
        const error = `Failed to generate clothing preferences: ${response.status} - ${errorText}`;
        
        // Log failed API call
        throw new Error(error);
      }

      const data = await response.json();
      console.log('Clothing preferences API response:', data);
      console.log('Clothing preferences extracted:', data.preferences);
      
      if (!data.preferences) {
        console.error('No preferences in API response:', data);
        return 'Your clothing style is distinctive and personal!';
      }
      
      // Log successful API call
      
      return data.preferences;
    } catch (error) {
      console.error('Error generating clothing preferences:', error)
      return 'Your clothing style is distinctive and personal!'
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

  // Handle current image index bounds when filter changes
  useEffect(() => {
    const currentCount = getCurrentImageCount();
    if (currentImageIndex >= currentCount) {
      setCurrentImageIndex(0);
    }
  }, [currentImageIndex]);

  // Generate insights whenever liked images change and we're on "Your Wall" page
  useEffect(() => {
    // Clear insights if we don't have enough liked images
    if (likedImages.length < 3) {
      setColorInsights('')
      setClothingPreferences('')
      return
    }
    
    // Only generate if we're on "Your Wall" page and have enough liked images
    if (activeTab === 'your wall' && likedImages.length >= 3) {
      // Add a longer delay to prevent showing loaders immediately when liking images
      const timeoutId = setTimeout(() => {
        // Filter images based on current wall filter
        const filteredImages = likedImages.filter(item => {
          return !item.image.includes('/shoes/');
        });

        // Only proceed if we have enough filtered images
        if (filteredImages.length < 2) {
          setColorInsights('')
          setClothingPreferences('')
          return;
        }

        const metadataList = filteredImages.map(item => item.metadata)
        console.log('🚀 REGENERATING INSIGHTS: Liked images changed')
        console.log('📊 Metadata count:', metadataList.length)
        console.log('📝 ACTUAL METADATA BEING SENT TO AI:')
        metadataList.forEach((metadata, index) => {
          console.log(`Image ${index + 1}:`, metadata.substring(0, 200) + '...')
        })
        
        // Set AI analysis loading state (not immediate image transition loading)
        setIsAnalyzingAI(true)
        
        // Generate all insights in parallel for speed
        Promise.all([
          generateColorInsights(metadataList),
          generateClothingPreferences(metadataList)
        ]).then(([colorInsights, clothingPrefs]) => {
          console.log('✅ All insights regenerated successfully based on current likes')
          console.log('Color insights received:', colorInsights ? 'Yes' : 'No', colorInsights?.substring(0, 50))
          console.log('Clothing preferences received:', clothingPrefs ? 'Yes' : 'No', clothingPrefs?.substring(0, 50))
          setColorInsights(colorInsights || '')
          setClothingPreferences(clothingPrefs || '')
          
          // Log AI insights for analysis
        }).catch(error => {
          console.error('❌ Error generating insights:', error)
          console.error('Error details:', error.message, error.stack)
          // Set fallback content on error
          setColorInsights('Unable to analyze color preferences at this time.')
          setClothingPreferences('Unable to analyze style preferences at this time.')
        }).finally(() => {
          // Clear AI analysis loading state
          setIsAnalyzingAI(false)
        })
      }, 2000) // 2 second delay to avoid showing loaders immediately when liking
      
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
      
      const requestData = { metadata: metadata };
      
      // Use localhost for local testing, production API for deployed app
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = isLocalhost ? 'http://localhost:3002/api/outfit-tips' : '/api/outfit-tips';
      
      console.log('Using outfit-tips API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Outfit tips API error response:', errorText);
        const error = `Failed to generate outfit tips: ${response.status} - ${errorText}`;
        
        // Log failed API call
        throw new Error(error);
      }

      const data = await response.json();
      console.log('Outfit tips API response:', data);
      
              // Log successful API call
      
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
      
      const requestData = { metadata: metadata };
      
      // Use localhost for local testing, production API for deployed app
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = isLocalhost ? 'http://localhost:3002/api/like-message' : '/api/like-message';
      
      console.log('Using like-message API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Like message API error response:', errorText);
        const error = `Failed to generate like message: ${response.status} - ${errorText}`;
        
        // Log failed API call
        throw new Error(error);
      }

      const data = await response.json();
      console.log('Like message API response:', data);
      
              // Log successful API call
      
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

  // Remove background from an image using improved algorithm
  const removeBackground = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;

        // Sample corner pixels to determine background color
        const sampleCorners = [
          data[0], data[1], data[2], // top-left
          data[(width - 1) * 4], data[(width - 1) * 4 + 1], data[(width - 1) * 4 + 2], // top-right
          data[(height - 1) * width * 4], data[(height - 1) * width * 4 + 1], data[(height - 1) * width * 4 + 2], // bottom-left
          data[((height - 1) * width + width - 1) * 4], data[((height - 1) * width + width - 1) * 4 + 1], data[((height - 1) * width + width - 1) * 4 + 2] // bottom-right
        ];

        // Calculate average background color from corners
        let avgR = 0, avgG = 0, avgB = 0;
        for (let i = 0; i < sampleCorners.length; i += 3) {
          avgR += sampleCorners[i];
          avgG += sampleCorners[i + 1];
          avgB += sampleCorners[i + 2];
        }
        avgR /= 4;
        avgG /= 4;
        avgB /= 4;

        // Remove background pixels that are similar to the corner colors
        const threshold = 30; // Color difference threshold
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Calculate color distance from background
          const colorDistance = Math.sqrt(
            Math.pow(r - avgR, 2) + 
            Math.pow(g - avgG, 2) + 
            Math.pow(b - avgB, 2)
          );
          
          // Also check if it's a very light/white pixel (common background)
          const brightness = (r + g + b) / 3;
          const isVeryLight = brightness > 230;
          
          // Make pixel transparent if it's similar to background or very light
          if (colorDistance < threshold || isVeryLight) {
            // Use a soft edge - gradually fade transparency
            const alpha = Math.min(1, colorDistance / threshold);
            data[i + 3] = Math.floor(alpha * 255);
          }
        }

        ctx.putImageData(imageData, 0, 0);

        // Convert to PNG to preserve transparency
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png');
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  };

  // Crop a piece from an image based on location percentages with padding
  const cropPieceFromImage = async (imagePath: string, location: {x: number, y: number, width: number, height: number}): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Convert percentages to pixel coordinates
        let x = (location.x / 100) * img.width;
        let y = (location.y / 100) * img.height;
        let width = (location.width / 100) * img.width;
        let height = (location.height / 100) * img.height;

        // Add padding (15% of the piece size) to ensure we capture the full piece
        const paddingX = width * 0.15;
        const paddingY = height * 0.15;
        
        // Adjust coordinates with padding, but stay within image bounds
        x = Math.max(0, x - paddingX);
        y = Math.max(0, y - paddingY);
        width = Math.min(img.width - x, width + (paddingX * 2));
        height = Math.min(img.height - y, height + (paddingY * 2));

        // Ensure minimum dimensions
        width = Math.max(width, 50);
        height = Math.max(height, 50);

        // Set canvas size to cropped dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw the cropped portion with better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

        // Convert to blob URL first
        canvas.toBlob(async (blob) => {
          if (blob) {
            const croppedUrl = URL.createObjectURL(blob);
            // Remove background from the cropped image
            try {
              const bgRemovedUrl = await removeBackground(croppedUrl);
              // Clean up the intermediate blob
              URL.revokeObjectURL(croppedUrl);
              resolve(bgRemovedUrl);
            } catch (error) {
              console.error('Failed to remove background, using cropped image:', error);
              resolve(croppedUrl);
            }
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/jpeg', 0.95);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imagePath;
    });
  };

  // Extract outfit pieces from an image using OpenAI API
  const extractOutfitPieces = useCallback(async (imagePath: string, updateState: boolean = false): Promise<OutfitPiece[]> => {
    try {
      if (updateState) {
        setExtractingPieces(prev => new Set(prev).add(imagePath));
      }

      // Convert image to base64 for API
      const response = await fetch(imagePath);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
        };
        reader.readAsDataURL(blob);
      });

      // Use localhost for local testing, production API for deployed app
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = isLocalhost ? 'http://localhost:3002/api/extract-outfit-pieces' : '/api/extract-outfit-pieces';
      
      console.log('🔍 Extracting outfit pieces from image:', imagePath);
      
      const extractResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64
        }),
      });

      if (!extractResponse.ok) {
        const errorText = await extractResponse.text();
        console.error('❌ Extract API error:', extractResponse.status, errorText);
        throw new Error(`Extract API failed: ${extractResponse.status} - ${errorText}`);
      }

      const extractData = await extractResponse.json();
      console.log(`✅ Extracted ${extractData.outfitPieces?.length || 0} outfit pieces:`, extractData);
      console.log('📦 Full response:', JSON.stringify(extractData, null, 2));
      
      let pieces = extractData.outfitPieces || [];
      console.log(`📋 Pieces array:`, pieces);
      console.log(`📊 Pieces length:`, pieces.length);
      
      // Crop images for pieces that have location data
      if (pieces.length > 0) {
        const piecesWithImages = await Promise.all(
          pieces.map(async (piece: OutfitPiece) => {
            if (piece.location) {
              try {
                const croppedUrl = await cropPieceFromImage(imagePath, piece.location);
                return { ...piece, croppedImageUrl: croppedUrl };
              } catch (error) {
                console.error(`Failed to crop piece ${piece.name}:`, error);
                return piece;
              }
            }
            return piece;
          })
        );
        pieces = piecesWithImages;
      }
      
      // Update the liked images with the extracted pieces
      // Use empty array if no pieces found to mark as "processed" and prevent re-extraction
      if (updateState) {
        console.log(`💾 Updating state for image: ${imagePath} with ${pieces.length} pieces`);
        setLikedImages(prev => {
          const updated = prev.map(item => {
            if (item.image === imagePath) {
              const updatedItem = { ...item, outfitPieces: pieces.length > 0 ? pieces : [] };
              console.log('🔄 Updated item:', updatedItem);
              return updatedItem;
            }
            return item;
          });
          console.log('📸 Updated likedImages:', updated);
          return updated;
        });
        
        // Remove from extracting set
        setExtractingPieces(prev => {
          const next = new Set(prev);
          next.delete(imagePath);
          return next;
        });
      }
      
      return pieces;
      
    } catch (error) {
      console.error('❌ Error extracting outfit pieces:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        imagePath,
        updateState
      });
      
      // Even on error, mark as processed with empty array to prevent infinite retries
      if (updateState) {
        setLikedImages(prev => prev.map(item => 
          item.image === imagePath 
            ? { ...item, outfitPieces: [] }
            : item
        ));
        
        setExtractingPieces(prev => {
          const next = new Set(prev);
          next.delete(imagePath);
          return next;
        });
      }
      return [];
    }
  }, []);

  // Extract outfit pieces for existing images that don't have them yet
  useEffect(() => {
    if (activeTab === 'your wall' && likedImages.length > 0) {
      const imagesNeedingExtraction = likedImages.filter(item => 
        !item.outfitPieces && 
        !extractingPieces.has(item.image) && 
        !item.image.includes('/shoes/')
      );
      
      if (imagesNeedingExtraction.length > 0) {
        console.log(`🔄 Extracting pieces for ${imagesNeedingExtraction.length} images`);
        imagesNeedingExtraction.forEach(item => {
          extractOutfitPieces(item.image, true);
        });
      }
    }
    // Only run when tab changes or when new images are added (not when pieces are updated)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, likedImages.length]);

  // Generate detailed metadata for an image using GPT Vision analysis
  const generateDetailedMetadata = async (imagePath: string, imageIndex: number): Promise<string> => {
    const filename = imagePath.split('/').pop() || '';
    
    try {
      // Convert image to base64 for GPT Vision API
      const response = await fetch(imagePath);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
        };
        reader.readAsDataURL(blob);
      });

      // Use localhost for local testing, production API for deployed app
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = isLocalhost ? 'http://localhost:3002/api/analyze-image' : '/api/analyze-image';
      
      console.log(`🔍 Analyzing image with GPT Vision: ${filename}`);
      
      // Determine the category for the image
      let category = 'outfit';
      let categoryPrompt = 'This is an OUTFIT image. Analyze the complete outfit including tops, bottoms, outerwear, accessories, and overall style. Focus on clothing items, colors, silhouettes, and styling.';
      
      const visionResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
          filename: filename,
          imageIndex: imageIndex,
          category: category,
          categoryPrompt: categoryPrompt
        }),
      });

      if (!visionResponse.ok) {
        throw new Error(`Vision API failed: ${visionResponse.status}`);
      }

      const visionData = await visionResponse.json();
      console.log(`✅ GPT Vision analysis result for ${category}:`, visionData);
      
      // Log the API call for analysis
      
      return visionData.metadata;
      
    } catch (error) {
      console.error('❌ Error analyzing image with GPT Vision:', error);
      
      // Fallback to basic description if vision analysis fails
      const fallbackMetadata = `Outfit ${imageIndex + 1}: Fashion inspiration image ${filename}. Style: contemporary and versatile.`;
      
      // Log the failed API call
      
      return fallbackMetadata;
    }
  };

  const handleLikeClick = () => {
    // Add current image immediately to liked images
    const currentImage = getCurrentImages()[currentImageIndex]
    
    // Create a temporary entry with basic info
    const tempImageWithMetadata: ImageWithMetadata = {
      image: currentImage,
      metadata: `Outfit ${currentImageIndex + 1}: Fashion inspiration image. Style: contemporary and versatile.`,
      timestamp: new Date(),
      likeMessage: 'You seem to like this outfit!'
    }
    
    // Check if image already exists
    const exists = likedImages.some(item => item.image === currentImage)
    if (!exists) {
      setLikedImages([...likedImages, tempImageWithMetadata])
    }

    // Move to next image quickly
    setTimeout(() => {
      setCurrentImageIndex((prev: number) => (prev + 1) % getCurrentImageCount());
    }, 300);
    
    // Run detailed analysis in the background (non-blocking)
    Promise.all([
      generateDetailedMetadata(currentImage, currentImageIndex),
      extractOutfitPieces(currentImage, false)
    ]).then(([detailedMetadata, outfitPieces]) => {
      console.log(`📸 Generated metadata for image ${currentImageIndex + 1}:`, detailedMetadata);
      console.log(`👕 Extracted ${outfitPieces.length} outfit pieces:`, outfitPieces);
      
      // Update the image with detailed metadata and outfit pieces
      setLikedImages(prev => prev.map(item => 
        item.image === currentImage 
          ? { ...item, metadata: detailedMetadata, outfitPieces }
          : item
      ));
      
      // Generate personalized like message in background
      generateLikeMessage(detailedMetadata).then(likeMessage => {
        // Update the image with the like message
        setLikedImages(prev => prev.map(item => 
          item.image === currentImage 
            ? { ...item, likeMessage }
            : item
        ));
      }).catch(error => {
        console.error('Failed to generate like message:', error);
      });
    }).catch(error => {
      console.error('Failed to generate detailed metadata or extract pieces:', error);
    });
  }

  const handleNoLikeClick = () => {
    // Move to next image quickly
    setTimeout(() => {
      setCurrentImageIndex((prev: number) => (prev + 1) % getCurrentImageCount());
    }, 300);
  }



  const handleResetAll = () => {
    setLikedImages([]);
    setColorInsights('');
    setClothingPreferences('');
    // Start from a random image instead of always starting from 0
    setCurrentImageIndex(Math.floor(Math.random() * getCurrentImageCount()));
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
        <div className="image-box-container">
          <div className="image-box">
            <img 
              src={getCurrentImages()[currentImageIndex]}
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
          <div className="button-row">
            <button className="like-button" onClick={handleLikeClick}>
              like
            </button>
            <button className="no-like-button" onClick={handleNoLikeClick}>
              no like
            </button>
          </div>
        </div>
      </div>

      <div className="button-container">
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
          {isAnalyzingAI ? (
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
          {isAnalyzingAI ? (
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
            {likedImages
              .filter(item => {
                // Filter out shoes
                return !item.image.includes('/shoes/');
              })
              .map((item, index) => {
                // Debug logging
                if (index === 0) {
                  console.log('🔍 Rendering item:', {
                    image: item.image,
                    hasPieces: !!item.outfitPieces,
                    piecesLength: item.outfitPieces?.length || 0,
                    pieces: item.outfitPieces,
                    isExtracting: extractingPieces.has(item.image)
                  });
                }
                
                return (
              <div 
                key={index} 
                className={`liked-image-container ${clickedImageIndex === index && selectedImageBlurb ? 'expanded' : ''}`}
              >
                {(() => {
                  const hasPieces = item.outfitPieces && Array.isArray(item.outfitPieces) && item.outfitPieces.length > 0;
                  const isExtracting = extractingPieces.has(item.image);
                  
                  // Debug: log the condition
                  if (index === 0) {
                    console.log('🎯 Display decision:', {
                      image: item.image,
                      hasPieces,
                      piecesCount: item.outfitPieces?.length || 0,
                      isExtracting,
                      willShowPieces: hasPieces && !isExtracting
                    });
                  }
                  
                  if (isExtracting) {
                    // Show loading state while extracting
                    return (
                      <div className="outfit-pieces-container">
                        <div className="pieces-loading">
                          <div className="loading-spinner"></div>
                          <p>Extracting outfit pieces...</p>
                        </div>
                      </div>
                    );
                  } else if (hasPieces) {
                    // Show outfit pieces
                    return (
                      <div className="outfit-pieces-container">
                        <div className="outfit-pieces-grid">
                          {item.outfitPieces!.map((piece, pieceIndex) => (
                            <div key={pieceIndex} className="outfit-piece-card">
                              {piece.croppedImageUrl ? (
                                <div className="piece-image-wrapper">
                                  <img 
                                    src={piece.croppedImageUrl} 
                                    alt={piece.name || piece.type}
                                    className="piece-image"
                                  />
                                  <div className="piece-type-badge-overlay">{piece.type || 'item'}</div>
                                </div>
                              ) : (
                                <div className="piece-type-badge">{piece.type || 'item'}</div>
                              )}
                              <div className="piece-name">{piece.name || 'Unknown piece'}</div>
                              <div className="piece-details">
                                {piece.color && (
                                  <div className="piece-color">
                                    <span className="color-label">Color:</span> {piece.color}
                                  </div>
                                )}
                                {piece.style && (
                                  <div className="piece-style">
                                    <span className="style-label">Style:</span> {piece.style}
                                  </div>
                                )}
                                {piece.details && (
                                  <div className="piece-additional-details">{piece.details}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                    <button 
                      className="hanger-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageClick(item.metadata, index);
                      }}
                      title="Get outfit tips"
                    >
                      🧥 Get Tips
                    </button>
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
                            <div className="recreation-tips" dangerouslySetInnerHTML={{ __html: formatTipsAsNumberedList(selectedImageBlurb) }} />
                          </div>
                        )}
                      </div>
                    )}
                      </div>
                    );
                  } else {
                    // Fallback to showing full image
                    return (
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
                      title="Get outfit tips"
                    >
                      🧥 Get Tips
                    </button>
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
                            <div className="recreation-tips" dangerouslySetInnerHTML={{ __html: formatTipsAsNumberedList(selectedImageBlurb) }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                    );
                  }
                })()}
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
                </div>
              </div>
            );
            })}
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
            </div>
          )}
        </>
      } />
    </Routes>
  )
}

export default App
