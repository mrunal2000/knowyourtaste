# Local Testing Guide

## Filter Functionality Test

### What to Test:
1. **Filter Buttons**: Three buttons should appear above the image box: "outfits", "shoes", and "bags"
2. **Active State**: The selected filter should be underlined and have a blue background
3. **Image Switching**: 
   - "outfits" should show all outfit images (59 total)
   - "shoes" should show only shoe images (100+ total)
   - "bags" should show bag/outfit images (10 total)
4. **Navigation**: Like/No Like buttons should work within each filter
5. **Reset**: Reset button should return to "outfits" filter

### Expected Behavior:
- Clicking "shoes" should show only shoe images from the `/shoes/` folder
- Clicking "bags" should show a subset of outfit images
- Clicking "outfits" should show all the original outfit images
- Current image index should reset to 0 when switching filters
- Active filter should be visually indicated with underline and blue background

### Test Steps:
1. Open the app and go to the "play" tab
2. Verify three filter buttons are visible above the image box
3. Click "shoes" - should see shoe images only
4. Click "bags" - should see bag/outfit images only  
5. Click "outfits" - should see all outfit images
6. Test like/no-like navigation within each filter
7. Test reset button returns to outfits filter

## Previous Tests
- Image analysis with GPT Vision API
- Fashion thesis generation
- Color insights generation
- Clothing preferences analysis
- Outfit tips generation
- Like message generation
- Local storage persistence
- Responsive design
- Draggable insight boxes
