import { useEffect } from 'react';

export function TouchScrollFix() {
  useEffect(() => {
    // Create a style element
    const styleElement = document.createElement('style');
    
    // Add CSS rules to fix mobile scrolling issues
    styleElement.textContent = `
      html, body {
        height: 100%;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: none;
        position: relative;
      }
    `;
    
    // Add the style element to the document head
    document.head.appendChild(styleElement);
    
    // Prevent the elastic bounce effect on iOS
    const preventElasticBounce = (e: TouchEvent) => {
      // Prevent only if at the top of the page with momentum going up
      // or at the bottom with momentum going down
      const top = window.scrollY === 0;
      const bottom = window.scrollY + window.innerHeight >= document.body.scrollHeight;
      
      if (e.touches && e.touches[0] && e.target) {
        const target = e.target as HTMLElement;
        const goingUp = e.touches[0].clientY > target.getBoundingClientRect().top;
        const goingDown = e.touches[0].clientY < target.getBoundingClientRect().bottom;
        
        if ((top && goingUp) || (bottom && goingDown)) {
          e.preventDefault();
        }
      }
    };
    
    document.addEventListener('touchmove', preventElasticBounce, { passive: false });
    
    return () => {
      // Cleanup when component unmounts
      document.removeEventListener('touchmove', preventElasticBounce);
      document.head.removeChild(styleElement);
    };
  }, []);

  return null; // This component doesn't render anything
}