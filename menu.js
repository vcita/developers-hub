// Sidebar Accordion Script
(function() {
    'use strict';
    
    // Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        
        // Find all H2 headings in the sidebar
        const sidebarHeadings = document.querySelectorAll('.rm-Sidebar-heading');
        
        // Add click event listeners to each heading
        sidebarHeadings.forEach(function(heading) {
            // Find the next sibling UL element
            const nextElement = heading.nextElementSibling;
            const targetList = nextElement && nextElement.tagName === 'UL' ? nextElement : null;
            
            if (targetList) {
                // Add cursor pointer to indicate clickable
                heading.style.cursor = 'pointer';
                heading.style.userSelect = 'none';
                
                // Add visual indicator (optional - you can customize this)
                heading.style.position = 'relative';
                
                // Create and add arrow indicator
                const arrow = document.createElement('span');
                arrow.innerHTML = '▼';
                arrow.style.cssText = `
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    transition: transform 0.3s ease;
                    font-size: 12px;
                `;
                heading.appendChild(arrow);
                
                // Set initial state - you can modify this to start collapsed
                let isOpen = true; // Change to false if you want sections closed by default
                
                if (!isOpen) {
                    targetList.style.display = 'none';
                    arrow.style.transform = 'translateY(-50%) rotate(-90deg)';
                }
                
                // Add click event listener
                heading.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Toggle the list visibility
                    if (targetList.style.display === 'none') {
                        // Show the list
                        targetList.style.display = '';
                        arrow.style.transform = 'translateY(-50%) rotate(0deg)';
                        isOpen = true;
                    } else {
                        // Hide the list
                        targetList.style.display = 'none';
                        arrow.style.transform = 'translateY(-50%) rotate(-90deg)';
                        isOpen = false;
                    }
                });
                
                // Optional: Add hover effect
                heading.addEventListener('mouseenter', function() {
                    heading.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                });
                
                heading.addEventListener('mouseleave', function() {
                    heading.style.backgroundColor = '';
                });
            }
        });
    });
    
    // Alternative version with smooth slide animation
    // Uncomment the code below if you prefer sliding animation instead of show/hide
    
    
    // Enhanced version with slide animation
    function slideToggle(element, duration = 300) {
        if (element.style.display === 'none' || element.offsetHeight === 0) {
            // Slide down
            element.style.display = '';
            element.style.overflow = 'hidden';
            element.style.height = '0px';
            element.style.transition = `height ${duration}ms ease`;
            
            const fullHeight = element.scrollHeight + 'px';
            setTimeout(() => {
                element.style.height = fullHeight;
            }, 10);
            
            setTimeout(() => {
                element.style.height = '';
                element.style.overflow = '';
                element.style.transition = '';
            }, duration);
        } else {
            // Slide up
            element.style.overflow = 'hidden';
            element.style.height = element.offsetHeight + 'px';
            element.style.transition = `height ${duration}ms ease`;
            
            setTimeout(() => {
                element.style.height = '0px';
            }, 10);
            
            setTimeout(() => {
                element.style.display = 'none';
                element.style.height = '';
                element.style.overflow = '';
                element.style.transition = '';
            }, duration);
        }
    }
    
    
})();