// Hardcoded Configuration
const TARGET_CONFIG = {
    ip: '172.20.10.2',
    port: 80, // Default HTTP port
    protocol: 'http'
};

// Auto-connect logic for monitor page
document.addEventListener('DOMContentLoaded', () => {
    // Page Transition Logic
    
    // Check for previous page from sessionStorage
    const fromMonitor = sessionStorage.getItem('fromMonitor');
    const heroTextContent = document.querySelector('.hero-text-content');
    const heroVideoWrapper = document.querySelector('.hero-video-wrapper');
    const curvedBg = document.querySelector('.curved-bg-shape'); // Select background shape
    const mainCard = document.querySelector('.main-card');

    // Handle Entry Animations
    if (mainCard) {
        // We are on Monitor Page
        // Get all stagger items
        const staggerItems = mainCard.querySelectorAll('.stagger-item');
        
        // Always enter from bottom (Slide Up)
        // Stagger items
        staggerItems.forEach((item, index) => {
            item.style.animationDelay = `${index * 120}ms`; // Stagger delay
            item.classList.add('animate-enter-up');
        });
        
        sessionStorage.removeItem('fromMonitor'); // Clear flag
    } else if (heroTextContent && heroVideoWrapper) {
        // We are on Index Page
        const staggerItems = heroTextContent.querySelectorAll('.stagger-item');
        
        if (fromMonitor) {
            // Returning from Monitor: Slide Down In
            // Stagger items
            staggerItems.forEach((item, index) => {
                item.style.animationDelay = `${index * 100}ms`; // Faster stagger for wave effect
                item.classList.add('animate-enter-down');
            });
            
            // Background comes before video
            if (curvedBg) {
                curvedBg.style.animationDelay = '200ms';
                curvedBg.classList.add('animate-enter-right');
            }

            // Video comes last
            heroVideoWrapper.style.animationDelay = `${staggerItems.length * 100 + 200}ms`;
            heroVideoWrapper.classList.add('animate-enter-down');
            
            sessionStorage.removeItem('fromMonitor');
        } else {
            // Default Entry: Slide Up In (First load or refresh)
            // Stagger items
            staggerItems.forEach((item, index) => {
                item.style.animationDelay = `${index * 120}ms`; // Slightly faster stagger
                item.classList.add('animate-enter-up');
            });
            
            // Background comes before video
            if (curvedBg) {
                curvedBg.style.animationDelay = '300ms';
                curvedBg.classList.add('animate-enter-right');
            }

            // Video comes last
            heroVideoWrapper.style.animationDelay = `${staggerItems.length * 120 + 200}ms`;
            heroVideoWrapper.classList.add('animate-enter-up');
        }
    }

    // Handle "Enter System" (Index -> Monitor)
    const enterBtn = document.querySelector('.btn-enter');
    if (enterBtn) {
        enterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = enterBtn.getAttribute('href');
            
            // Add exit animation to main containers (Slide Up Out)
            // Animate items out
            const staggerItems = heroTextContent ? heroTextContent.querySelectorAll('.stagger-item') : [];
            staggerItems.forEach((item) => {
                item.style.animationDelay = '0ms'; // No delay on exit for snappier feel
                item.classList.add('animate-exit-up');
            });
            
            if (heroVideoWrapper) heroVideoWrapper.classList.add('animate-exit-up');
            if (curvedBg) curvedBg.classList.add('animate-exit-right');
            
            // Wait for animation then navigate
            setTimeout(() => {
                window.location.href = target;
            }, 750); 
        });
    }

    // Handle "Back to Home" (Monitor -> Index)
    const backBtn = document.querySelector('a[href="index.html"]');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = backBtn.getAttribute('href');
            
            // Set flag that we are coming from monitor
            sessionStorage.setItem('fromMonitor', 'true');

            // Add exit animation to stagger items (Slide Down Out)
            if (mainCard) {
                const staggerItems = mainCard.querySelectorAll('.stagger-item');
                staggerItems.forEach((item) => {
                    item.style.animationDelay = '0ms'; // No delay on exit
                    item.classList.add('animate-exit-down');
                });
            }
            
            // Wait for animation then navigate
            setTimeout(() => {
                window.location.href = target;
            }, 750);
        });
    }

    // Auto-Connect Logic (Only on Monitor Page)
    const cameraFeed = document.getElementById('camera-feed');
    const cameraPlaceholder = document.getElementById('camera-placeholder');
    const statusBadge = document.getElementById('system-status');
    const cameraStatusText = document.getElementById('camera-status-text');
    
    // Check Notification Permission on Load (Monitor Page Only)
    if (statusBadge) {
        checkNotifyPermission();
    }

    // If we are on the monitor page (elements exist)
    if (cameraFeed && cameraPlaceholder && statusBadge) {
        connectToCamera();
    }

    async function connectToCamera() {
        // Construct URL
        let url = `${TARGET_CONFIG.protocol}://${TARGET_CONFIG.ip}`;
        if (TARGET_CONFIG.port && TARGET_CONFIG.port !== 80) {
            url += `:${TARGET_CONFIG.port}`;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); 

            // Attempt Connection
            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
                mode: 'cors'
            });
            
            clearTimeout(timeoutId);

            if (response.ok) {
                // Success State
                statusBadge.className = 'badge-status status-normal';
                statusBadge.innerHTML = '<i class="fas fa-check-circle me-1"></i> Connected (Normal)';
                
                if(cameraStatusText) cameraStatusText.textContent = 'Live Feed';
                
                // Activate Camera Feed
                cameraPlaceholder.style.display = 'none';
                cameraFeed.style.display = 'block';
                
                // Try video_feed first, fallback to root
                cameraFeed.src = `${url}/video_feed`; 
                cameraFeed.onerror = () => {
                     console.log('Stream unavailable, trying static image/root...');
                     cameraFeed.src = `${url}/`; 
                };
                
            } else {
                throw new Error(`Server returned ${response.status}`);
            }
        } catch (error) {
            console.error(error);
            
            // Error State
            statusBadge.className = 'badge-status status-danger';
            statusBadge.innerHTML = '<i class="fas fa-times-circle me-1"></i> Connection Failed';
            
            if(cameraStatusText) cameraStatusText.textContent = 'Connection Error';
            
            // Retry automatically after 5 seconds
            setTimeout(connectToCamera, 5000);
        }
    }
});

// Demo Function to Toggle Status
function toggleStatusDemo() {
    const statusBadge = document.getElementById('system-status');
    const monitorFrame = document.querySelector('.monitor-frame');
    
    if (!statusBadge) return; // Guard clause

    const isNormal = statusBadge.innerHTML.includes('Normal') || statusBadge.innerHTML.includes('Standby') || statusBadge.innerHTML.includes('Connecting');
    
    if (isNormal) {
        // Switch to DANGER
        statusBadge.className = 'status-danger';
        statusBadge.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i> DANGER DETECTED';
        
        if (monitorFrame) monitorFrame.classList.add('danger-mode');
        
        // Log the danger event
        addAlertLog('Danger Detected');

        // Trigger notification manually for demo
        if (notifyEnabled) {
            sendNotification();
            
            // Start repeated notification timer for demo
            if (!dangerTimer) {
                dangerTimer = setInterval(sendNotification, 10000);
            }
        }

    } else {
        // Switch to NORMAL
        statusBadge.className = 'status-normal';
        statusBadge.innerHTML = '<i class="fas fa-check-circle me-1"></i> Connected (Normal)';
        
        if (monitorFrame) monitorFrame.classList.remove('danger-mode');

        // Stop repeated notification timer
        if (dangerTimer) {
            clearInterval(dangerTimer);
            dangerTimer = null;
        }
    }
}

// ==========================================
// Notification & Polling System (Added)
// ==========================================
let notifyEnabled = ("Notification" in window && Notification.permission === "granted");
let lastStatus = "normal";
let dangerTimer = null;

// Request Notification Permission
window.enableNotify = async function() {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
        return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
        notifyEnabled = true;
        alert("เปิดแจ้งเตือนแล้ว 🔔");
    }
}

// Modal Functions
function checkNotifyPermission() {
    // Only show if permission is default (not yet decided)
    if ("Notification" in window && Notification.permission === "default") {
        const modal = document.getElementById('notify-permission-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }
}

window.requestNotifyPermission = async function() {
    if (!("Notification" in window)) return;
    
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
        notifyEnabled = true;
        closeNotifyModal();
        alert("เปิดแจ้งเตือนเรียบร้อย 🔔");
    } else {
        closeNotifyModal();
    }
}

window.closeNotifyModal = function() {
    const modal = document.getElementById('notify-permission-modal');
    if (modal) {
        // Add fade out effect
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Send Notification
function sendNotification() {
    new Notification("🚨 แจ้งเตือนอันตราย", {
        body: "ตรวจพบสถานะอันตราย กรุณาตรวจสอบทันที",
        icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚨</text></svg>',
        vibrate: [200, 100, 200]
    });
}

// Poll Status from Backend (Every 1s)
setInterval(() => {
    fetch("/get_status")
        .then(res => {
            if (!res.ok) throw new Error("API not found");
            return res.json();
        })
        .then(data => {
            const statusBadge = document.getElementById('system-status');
            const monitorFrame = document.querySelector('.monitor-frame');

            // ====== Status: DANGER ======
            if (data.status === "danger") {
                if (statusBadge) {
                    statusBadge.className = 'status-danger';
                    statusBadge.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i> DANGER DETECTED';
                }
                if (monitorFrame) monitorFrame.classList.add('danger-mode');

                // Notify if changed to danger
                if (lastStatus !== "danger" && notifyEnabled) {
                    sendNotification();
                    addAlertLog('Danger Detected (API)');
                }

                // Repeat notification every 10s if danger persists
                if (!dangerTimer && notifyEnabled) {
                    dangerTimer = setInterval(sendNotification, 10000);
                }
            } 
            // ====== Status: NORMAL ======
            else {
                if (statusBadge) {
                    statusBadge.className = 'status-normal';
                    statusBadge.innerHTML = '<i class="fas fa-check-circle me-1"></i> Connected (Normal)';
                }
                if (monitorFrame) monitorFrame.classList.remove('danger-mode');

                // Clear timer
                if (dangerTimer) {
                    clearInterval(dangerTimer);
                    dangerTimer = null;
                }
            }
            lastStatus = data.status;
        })
        .catch(() => {
            // API not found or error - Silent fail (allows demo mode to work)
        });
}, 1000);

// Alert History Functions
function addAlertLog(message) {
    const tbody = document.getElementById('alert-history-body');
    if (!tbody) return;

    // Remove placeholder if it exists
    const placeholder = tbody.querySelector('.placeholder-row');
    if (placeholder) placeholder.remove();

    // Get current time
    const now = new Date();
    const timeString = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Create new row
    const row = document.createElement('tr');
    row.className = 'fade-in-row';
    row.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
    
    row.innerHTML = `
        <td class="ps-4 fw-bold" style="color: #000000 !important;">${timeString}</td>
        <td class="text-start">
            <span class="badge bg-danger bg-opacity-75 text-white">
                <i class="fas fa-exclamation-circle me-1"></i> ${message}
            </span>
        </td>
    `;

    // Prepend to top (newest first)
    tbody.prepend(row);

    // Limit to last 10 entries to prevent overflow
    if (tbody.children.length > 10) {
        tbody.lastElementChild.remove();
    }
}

function clearHistory() {
    const tbody = document.getElementById('alert-history-body');
    if (tbody) {
        tbody.innerHTML = `
            <tr class="text-center text-muted placeholder-row">
                <td colspan="2" class="py-3">No danger detected yet</td>
            </tr>
        `;
    }
}

function toggleHistory() {
    const historyBox = document.getElementById('history-content');
    const icon = document.getElementById('history-toggle-icon');
    
    if (historyBox.classList.contains('history-collapsed')) {
        // Open
        historyBox.classList.remove('history-collapsed');
        icon.classList.remove('icon-rotated');
    } else {
        // Close
        historyBox.classList.add('history-collapsed');
        icon.classList.add('icon-rotated');
    }
}

// YouTube Player API Logic for Custom Loop (78s -> 127s)
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
    // Only initialize if the element exists
    if (document.getElementById('hero-player')) {
        player = new YT.Player('hero-player', {
            events: {
                'onStateChange': onPlayerStateChange
            }
        });
    }
}

function onPlayerStateChange(event) {
    // When video ends (state=0), loop back to 78s
    if (event.data === YT.PlayerState.ENDED) {
        player.seekTo(78);
        player.playVideo();
    }
}