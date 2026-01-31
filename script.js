/**
 * MosquitoWatch - Minimal JavaScript
 * Lightweight interactions for accessibility and UX
 * No external dependencies - vanilla JS only
 */

(function() {
    'use strict';

    // ====================================
    // Mobile Navigation Toggle
    // ====================================

    const navToggle = document.querySelector('.cs-toggle');
    const navMenu = document.querySelector('.cs-nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            const isOpen = navMenu.classList.toggle('is-open');
            navToggle.setAttribute('aria-expanded', isOpen);
        });

        // Close menu when clicking a link
        navMenu.querySelectorAll('.cs-nav-link').forEach(function(link) {
            link.addEventListener('click', function() {
                navMenu.classList.remove('is-open');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });

        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
                navMenu.classList.remove('is-open');
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.focus();
            }
        });
    }

    // ====================================
    // Smooth Scroll for Anchor Links
    // ====================================

    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Set focus for accessibility
                target.setAttribute('tabindex', '-1');
                target.focus({ preventScroll: true });
            }
        });
    });

    // ====================================
    // Counter Animation (Intersection Observer)
    // ====================================

    function animateCounter(element, target, suffix) {
        const duration = 2000;
        const steps = 60;
        const stepDuration = duration / steps;
        const increment = target / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(function() {
            step++;
            current = Math.min(target, increment * step);

            // Format number
            if (target >= 100) {
                element.textContent = Math.round(current).toLocaleString();
            } else if (target >= 10) {
                element.textContent = current.toFixed(1);
            } else {
                element.textContent = current.toFixed(1);
            }

            if (step >= steps) {
                clearInterval(timer);
                // Ensure final value is exact
                if (target >= 100) {
                    element.textContent = Math.round(target).toLocaleString();
                } else {
                    element.textContent = target;
                }
            }
        }, stepDuration);
    }

    // Observe stats for animation
    const statsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                const statValues = entry.target.querySelectorAll('.cs-stat-number[data-count]');
                statValues.forEach(function(stat) {
                    const target = parseFloat(stat.dataset.count);
                    if (!stat.classList.contains('animated')) {
                        stat.classList.add('animated');
                        animateCounter(stat, target);
                    }
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.cs-stats-group');
    if (heroStats) {
        statsObserver.observe(heroStats);
    }

    // ====================================
    // Last Updated Time
    // ====================================

    function updateLastUpdatedTime() {
        const element = document.getElementById('last-updated');
        if (element) {
            const now = new Date();
            const options = {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZoneName: 'short'
            };
            element.textContent = now.toLocaleTimeString('en-US', options);
        }
    }

    updateLastUpdatedTime();
    // Update every minute
    setInterval(updateLastUpdatedTime, 60000);

    // ====================================
    // Header Scroll Effect
    // ====================================

    let lastScroll = 0;
    const header = document.querySelector('.header');

    function handleScroll() {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        } else {
            header.style.boxShadow = 'none';
        }

        lastScroll = currentScroll;
    }

    // Throttle scroll events
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(function() {
                handleScroll();
                scrollTimeout = null;
            }, 100);
        }
    }, { passive: true });

    // ====================================
    // Feature Card Keyboard Navigation
    // ====================================

    document.querySelectorAll('.cs-item').forEach(function(card) {
        card.setAttribute('tabindex', '0');

        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                const link = card.querySelector('a');
                if (link) {
                    link.click();
                }
            }
        });
    });

    // ====================================
    // Reduced Motion Check
    // ====================================

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (prefersReducedMotion.matches) {
        // Disable animations for users who prefer reduced motion
        document.documentElement.style.setProperty('--transition-fast', '0ms');
        document.documentElement.style.setProperty('--transition-base', '0ms');
        document.documentElement.style.setProperty('--transition-slow', '0ms');
    }

    // ====================================
    // Service Worker Registration (for offline support)
    // ====================================

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            // Only register if service worker file exists
            // This is a placeholder for future PWA functionality
            // navigator.serviceWorker.register('/sw.js');
        });
    }

    // ====================================
    // Network Status Detection
    // ====================================

    function updateNetworkStatus() {
        if (!navigator.onLine) {
            console.log('MosquitoWatch: Offline mode - some features may be limited');
        }
    }

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // ====================================
    // Low Bandwidth Detection
    // ====================================

    if ('connection' in navigator) {
        const connection = navigator.connection;

        function handleConnectionChange() {
            const effectiveType = connection.effectiveType;

            // If on slow connection (2G or slow-2g), add low-bandwidth class
            if (effectiveType === '2g' || effectiveType === 'slow-2g') {
                document.body.classList.add('low-bandwidth');
                console.log('MosquitoWatch: Low bandwidth mode enabled');
            } else {
                document.body.classList.remove('low-bandwidth');
            }
        }

        connection.addEventListener('change', handleConnectionChange);
        handleConnectionChange();
    }

    // ====================================
    // Map Controls (placeholder functionality)
    // ====================================

    document.querySelectorAll('.cs-map-control').forEach(function(control) {
        control.addEventListener('click', function() {
            const label = this.getAttribute('aria-label');
            console.log('Map control clicked:', label);
            // Placeholder for actual map control functionality
        });
    });

    // ====================================
    // Performance: Lazy load images when they exist
    // ====================================

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(function(img) {
            imageObserver.observe(img);
        });
    }

    console.log('MosquitoWatch: Initialized successfully');

    // ====================================
    // Africa Map Layer Toggles
    // ====================================

    const layerToggles = document.querySelectorAll('.cs-layer-toggle input[type="checkbox"]');
    
    layerToggles.forEach(function(toggle) {
        toggle.addEventListener('change', function() {
            const layerName = this.dataset.layer;
            console.log('Toggle layer:', layerName, this.checked);
            
            // In a real implementation, this would show/hide actual data layers
            // For now, we'll just log the interaction
            const africaSvg = document.querySelector('.cs-africa-svg');
            if (africaSvg) {
                // Example: Toggle layer visibility
                const layerId = 'disease-layer'; // This could be dynamic based on layerName
                const layer = africaSvg.querySelector('#' + layerId);
                if (layer && layerName === 'diseases') {
                    layer.style.opacity = this.checked ? '0.7' : '0';
                }
            }
        });
    });

    // ====================================
    // Species Marker Interactions
    // ====================================

    const speciesMarkers = document.querySelectorAll('.cs-species-marker');
    
    speciesMarkers.forEach(function(marker) {
        marker.addEventListener('mouseenter', function() {
            const fill = this.getAttribute('fill');
            const species = fill === '#dc2626' ? 'Anopheles' : 
                          fill === '#ea580c' ? 'Aedes' : 
                          fill === '#7c3aed' ? 'Culex' : 'Unknown';
            
            // Create tooltip (simplified version)
            console.log('Hovering over', species, 'marker');
            this.style.cursor = 'pointer';
        });
        
        marker.addEventListener('click', function() {
            const fill = this.getAttribute('fill');
            const species = fill === '#dc2626' ? 'Anopheles' : 
                          fill === '#ea580c' ? 'Aedes' : 
                          fill === '#7c3aed' ? 'Culex' : 'Unknown';
            
            // Scroll to species info card
            const speciesSection = document.getElementById('species');
            if (speciesSection) {
                speciesSection.scrollIntoView({ behavior: 'smooth' });
            }
            console.log('Clicked on', species, 'marker');
        });
    });

    // ====================================
    // Africa Stats Animation on Scroll
    // ====================================

    const africaStatsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                const statCards = entry.target.querySelectorAll('.cs-stat-card');
                statCards.forEach(function(card, index) {
                    setTimeout(function() {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        card.style.transition = 'all 0.5s ease';
                        
                        setTimeout(function() {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 50);
                    }, index * 100);
                });
                africaStatsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    const africaStats = document.querySelector('.cs-africa-stats');
    if (africaStats) {
        africaStatsObserver.observe(africaStats);
    }

