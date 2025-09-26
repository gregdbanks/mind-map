// Test script to debug PixiJS renderer
// Copy and paste this into your browser console

console.log('🔍 Testing PixiJS Renderer Setup...\n');

// Check current settings
console.log('📋 Current Settings:');
console.log('- Renderer:', localStorage.getItem('renderer') || 'konva');
console.log('- Performance:', localStorage.getItem('performanceMonitoring'));

// Check if functions are available
console.log('\n🔧 Available Functions:');
console.log('- enablePixiRenderer:', typeof enablePixiRenderer);
console.log('- enableKonvaRenderer:', typeof enableKonvaRenderer);
console.log('- toggleRenderer:', typeof toggleRenderer);

// Enable PixiJS
console.log('\n🚀 Enabling PixiJS...');
if (typeof enablePixiRenderer === 'function') {
    enablePixiRenderer();
} else {
    localStorage.setItem('renderer', 'pixi');
    localStorage.setItem('performanceMonitoring', 'true');
    console.log('✅ Set localStorage manually');
}

console.log('\n✨ PixiJS should now be enabled!');
console.log('👉 Please refresh the page to see changes');
console.log('👀 Look for:');
console.log('   - Green "PixiJS Renderer" badge in top-left');
console.log('   - Improved zoom buttons in bottom-right');
console.log('   - Click any node to see zoom effect');

// Quick diagnostic
console.log('\n🔍 Quick Diagnostic:');
if (document.querySelector('[data-renderer="pixi"]')) {
    console.log('✅ PixiJS container found!');
} else if (document.querySelector('[data-renderer="konva"]')) {
    console.log('⚠️  Still using Konva - refresh needed');
} else {
    console.log('❓ No renderer container found');
}

// Check for errors
if (window.__pixiError) {
    console.error('❌ PixiJS Error:', window.__pixiError);
}