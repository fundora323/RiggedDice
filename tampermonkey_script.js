// ==UserScript==
// @name         Dice Color Modifier
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Modify dice colors based on Discord bot commands - ULTRA-FAST Roll Again persistence
// @author       You
// @match        *://*.online-dice.com/*
// @match        *://online-dice.com/*
// @match        https://www.online-dice.com/roll-color-dice/4/
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      *
// @run-at       document-start
// ==/UserScript==

(function () {
    "use strict";
    
    // ULTRA-IMMEDIATE CSS INJECTION: Apply saved CSS instantly before anything else loads
    // This is critical for the "Roll Again" button case - must run before any DOM is available
    try {
        // Check if this is a page refresh by looking for a special flag
        // We want to reset colors on page refresh, but not on "Roll Again"
        const isPageRefresh = !sessionStorage.getItem('dice-roll-again-action');
        
        // Set the flag for future navigation actions
        sessionStorage.setItem('dice-roll-again-action', 'false');
        
        // On a genuine page refresh/reload, clear all rigging settings
        if (isPageRefresh) {
            console.log("PAGE REFRESH DETECTED - Clearing all dice rigging settings");
            localStorage.removeItem('dice-immediate-css');
            sessionStorage.removeItem('dice-immediate-css');
            localStorage.removeItem('dice-rig-color');
            sessionStorage.removeItem('dice-rig-quantity');
            localStorage.removeItem('dice-rig-enabled');
            sessionStorage.removeItem('diceRigColor');
            sessionStorage.removeItem('diceRigQuantity');
            sessionStorage.removeItem('diceRigEnabled');
            return; // Skip further CSS application on refresh
        }
        
        // Try both localStorage and sessionStorage for maximum compatibility
        let savedCss = localStorage.getItem('dice-immediate-css');
        if (!savedCss) {
            // Fall back to sessionStorage if localStorage doesn't have the CSS
            savedCss = sessionStorage.getItem('dice-immediate-css');
        }
        
        // Also check for older storage keys as a fallback
        if (!savedCss) {
            // Look for color and quantity in either storage type
            const color = localStorage.getItem('dice-rig-color') || sessionStorage.getItem('dice-rig-color') || 
                         localStorage.getItem('diceRigColor') || sessionStorage.getItem('diceRigColor');
            
            const quantityStr = localStorage.getItem('dice-rig-quantity') || sessionStorage.getItem('dice-rig-quantity') ||
                               localStorage.getItem('diceRigQuantity') || sessionStorage.getItem('diceRigQuantity');
            
            // If we have both values, generate the CSS on the fly
            if (color && quantityStr) {
                const quantity = parseInt(quantityStr, 10);
                if (!isNaN(quantity) && quantity > 0) {
                    // We have valid data, generate the CSS
                    console.log(`Generating CSS on-the-fly with stored values: color=${color}, quantity=${quantity}`);
                    savedCss = `
                        /* Base styles to ensure white dice backgrounds */
                        .tabletop .dice-wrapper.size-100.rounded-dice,
                        .dice-wrapper.size-100.rounded-dice {
                            background: #fff !important;
                        }
                        
                        /* Target pips with multiple selectors for maximum compatibility */
                        .tabletop .dice-wrapper.size-100.rounded-dice:nth-child(-n+${quantity}) i[class*="df-solid-small-dot"],
                        .dice-wrapper.size-100.rounded-dice:nth-child(-n+${quantity}) i[class*="df-solid-small-dot"],
                        .tabletop .dice-wrapper.size-100.rounded-dice:nth-child(-n+${quantity}) i[class*="dot"],
                        .dice-wrapper.size-100.rounded-dice:nth-child(-n+${quantity}) i[class*="dot"],
                        .tabletop .dice-wrapper.size-100.rounded-dice:nth-child(-n+${quantity}) i.df-solid-small-dot-d6-1,
                        .dice-wrapper.size-100.rounded-dice:nth-child(-n+${quantity}) i.df-solid-small-dot-d6-1 {
                            color: ${color} !important;
                            background-color: ${color} !important;
                        }
                    `;
                }
            }
        }
        
        if (savedCss) {
            // ULTRA-FAST METHOD 1: Create and inject style element as early as possible
            const style = document.createElement('style');
            style.id = 'dice-immediate-style';
            style.textContent = savedCss;
            
            // Add to document head or documentElement, whichever is available first
            (document.head || document.documentElement).appendChild(style);
            console.log("🚀 ULTRA EARLY CSS applied from storage!");
            
            // ULTRA-FAST METHOD 2: Set up multiple fail-safes to ensure the style is added
            // Create a counter variable outside of the interval to track iterations
            let styleCheckCount = 0;
            const MAX_STYLE_CHECKS = 200;
            
            // Use setInterval with the counter variable instead of trying to attach to the interval object
            const ensureStyleInterval = setInterval(() => {
                // Check if head exists but our style wasn't added to it yet
                if (document.head && !document.getElementById('dice-immediate-style')) {
                    const backupStyle = document.createElement('style');
                    backupStyle.id = 'dice-immediate-style-backup';
                    backupStyle.textContent = savedCss;
                    document.head.appendChild(backupStyle);
                    console.log("🚀 Backup CSS applied to document.head");
                }
                
                // Increment counter and check if we should stop
                styleCheckCount++;
                if (styleCheckCount >= MAX_STYLE_CHECKS) {
                    console.log("Stopping style checks after maximum iterations");
                    clearInterval(ensureStyleInterval);
                }
            }, 10); // Check every 10ms
            
            // ULTRA-FAST METHOD 3: Use document.write as absolute earliest injection method
            // This works even before the DOM is created, but can fail in certain contexts
            try {
                const safeCSS = savedCss.replace(/'/g, "\\'").replace(/\\/g, "\\\\").replace(/\n/g, "\\n");
                const scriptText = `
                    try {
                        var ultraEarlyStyle = document.createElement('style');
                        ultraEarlyStyle.id = 'dice-immediate-inline-style';
                        ultraEarlyStyle.textContent = '${safeCSS}';
                        (document.head || document.documentElement).appendChild(ultraEarlyStyle);
                    } catch (e) {
                        console.error("Ultra-early inline style injection failed:", e);
                    }
                `;
                const inlineScript = document.createElement('script');
                inlineScript.textContent = scriptText;
                (document.head || document.documentElement).appendChild(inlineScript);
            } catch (inlineError) {
                console.error("Failed to inject ultra-early inline script:", inlineError);
            }
        }
    } catch (e) {
        console.error("Early CSS injection failed:", e);
    }

    // Configuration for WebSocket server connection
    // Get the correct WebSocket URL (with fallback options)
    function getWebSocketUrl() {
        // For development and testing, allow a URL parameter to override the WebSocket URL
        const urlParams = new URLSearchParams(window.location.search);
        const overrideWsUrl = urlParams.get("wsUrl");

        if (overrideWsUrl) {
            console.log(`Using override WebSocket URL: ${overrideWsUrl}`);
            return overrideWsUrl;
        }

        // Determine protocol (wss for https, ws for http)
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

        // Get the Replit workspace URL that is currently working with our Discord bot
        // Note: This is the URL shown in the WebSocket server logs
        return `${protocol}//d276b14b-e99c-4e3e-ae4d-cb14be134df1-00-3lgks01sf6xva.worf.replit.dev:5000/ws`;
    }
    // We don't use this value directly anymore - it's just a placeholder
    // See the connectWebSocket function for the actual connection logic
    const WEBSOCKET_URL = getWebSocketUrl();

    // Store rig settings
    let rigSettings = {
        enabled: false,
        color: "",
        quantity: 0,
    };

    // CSS selectors for the dice elements on online-dice.com (using the exact selectors from the site)
    const DICE_SELECTORS = [
        ".tabletop", // Background container
        ".dice-wrapper.size-100.rounded-dice:nth-child(1)", // First dice
        ".dice-wrapper.size-100.rounded-dice:nth-child(2)", // Second dice
        ".dice-wrapper.size-100.rounded-dice:nth-child(3)", // Third dice
        ".dice-wrapper.size-100.rounded-dice:nth-child(4)", // Fourth dice
    ];

    // Connect to WebSocket server with fallback to polling when WebSocket fails
    function connectWebSocket() {
        console.log("Connecting to WebSocket server...");

        // Debug mode - set to true to see detailed logs
        const DEBUG = true;

        // Track connection attempts
        let connectionAttempts = 0;
        const MAX_ATTEMPTS = 5;
        const RETRY_DELAY = 3000; // 3 seconds
        const MAX_RETRY_DELAY = 30000; // 30 seconds

        // Polling interval when WebSocket fails (in milliseconds)
        const POLLING_INTERVAL = 5000; // 5 seconds
        let pollingActive = false;
        let pollingTimer = null;

        // List of WebSocket URLs to try in order
        const urlParams = new URLSearchParams(window.location.search);
        const overrideWsUrl = urlParams.get("wsUrl");

        let wsUrls = [];

        if (overrideWsUrl) {
            // If user has provided a URL parameter, use that first
            wsUrls.push(overrideWsUrl);
        }

        // Add primary URL - using the working URL that the Discord Bot is successfully using
        wsUrls.push(
            `wss://d276b14b-e99c-4e3e-ae4d-cb14be134df1-00-3lgks01sf6xva.worf.replit.dev:5000/ws`,
        );
        
        // Add fallback URLs in case the primary URL doesn't work
        wsUrls.push(`ws://localhost:5000/ws`);
        wsUrls.push(`ws://0.0.0.0:5000/ws`);
        wsUrls.push(`ws://127.0.0.1:5000/ws`);

        let currentUrlIndex = 0;
        let socket = null;

        // Function to try connecting via WebSocket
        function tryNextUrl() {
            if (currentUrlIndex >= wsUrls.length) {
                // We've tried all URLs, start over with the first one
                currentUrlIndex = 0;
                connectionAttempts++;

                if (connectionAttempts >= MAX_ATTEMPTS) {
                    // We've tried too many times, switch to polling mode
                    console.log(
                        "All WebSocket connection attempts failed. Switching to polling mode.",
                    );
                    showNotification(
                        "WebSocket connection failed. Using alternative method.",
                        "#ff9800",
                    );
                    startPolling();
                    return;
                }
            }

            const url = wsUrls[currentUrlIndex];
            if (DEBUG)
                console.log(
                    `Trying WebSocket connection to: ${url} (Attempt ${connectionAttempts + 1})`,
                );

            try {
                // Create a new WebSocket connection
                socket = new WebSocket(url);

                socket.onopen = function () {
                    console.log(`Connected to WebSocket server at ${url}`);
                    showNotification(
                        "Connected to dice server! Ready for commands.",
                        "#4CAF50",
                    );
                    // Reset connection attempts on successful connection
                    connectionAttempts = 0;

                    // Stop polling if it was active
                    if (pollingActive) {
                        stopPolling();
                    }
                };

                socket.onmessage = function (event) {
                    if (DEBUG) console.log("Received message:", event.data);
                    try {
                        // First, parse the JSON data
                        const data = JSON.parse(event.data);
                        
                        // Check if it's a Buffer type from our server
                        if (data && data.type === 'Buffer' && Array.isArray(data.data)) {
                            // Convert Buffer data to string and parse again
                            const bufferString = String.fromCharCode.apply(null, data.data);
                            try {
                                // Try to parse the buffer string as JSON
                                const parsedData = JSON.parse(bufferString);
                                console.log("Converted buffer data to:", parsedData);
                                handleCommand(parsedData);
                            } catch (bufferError) {
                                console.error("Error parsing buffer data:", bufferError);
                            }
                        } else {
                            // Regular JSON object, handle directly
                            handleCommand(data);
                        }
                    } catch (error) {
                        console.error("Error parsing message:", error);
                    }
                };

                socket.onclose = function (event) {
                    if (DEBUG)
                        console.log(
                            "WebSocket connection closed:",
                            event.code,
                            event.reason,
                        );
                    // Try the next URL
                    currentUrlIndex++;
                    setTimeout(tryNextUrl, 1000);
                };

                socket.onerror = function (error) {
                    console.error(`WebSocket error with ${url}:`, error);
                    // Don't do anything here, the onclose handler will be called next
                };
            } catch (error) {
                console.error(
                    `Error creating WebSocket connection to ${url}:`,
                    error,
                );
                currentUrlIndex++;
                setTimeout(tryNextUrl, 1000);
            }
        }

        // Fallback: Start HTTP polling when WebSocket fails
        function startPolling() {
            if (pollingActive) return;

            pollingActive = true;
            console.log("Starting HTTP polling as fallback");

            // Function to poll the server for new commands
            function pollServer() {
                const serverUrls = [
                    "https://d276b14b-e99c-4e3e-ae4d-cb14be134df1-00-3lgks01sf6xva.worf.replit.dev:5000/status",
                ];

                // Try each URL
                function tryNextPollUrl(index) {
                    if (index >= serverUrls.length) {
                        // All URLs failed, try again later
                        pollingTimer = setTimeout(
                            () => pollServer(),
                            POLLING_INTERVAL,
                        );
                        return;
                    }

                    const url = serverUrls[index];

                    // Use GM_xmlhttpRequest for cross-origin requests
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: url,
                        timeout: 5000,
                        onload: function (response) {
                            if (response.status === 200) {
                                if (DEBUG)
                                    console.log(
                                        "Poll successful:",
                                        response.responseText,
                                    );
                                // Successful poll - check for new commands
                                try {
                                    // Server might return commands in the response
                                    const data = JSON.parse(
                                        response.responseText,
                                    );
                                    if (data.lastCommand) {
                                        handleCommand(data.lastCommand);
                                    }
                                } catch (e) {
                                    console.error(
                                        "Error parsing poll response:",
                                        e,
                                    );
                                }

                                // Schedule next poll
                                pollingTimer = setTimeout(
                                    () => pollServer(),
                                    POLLING_INTERVAL,
                                );
                            } else {
                                console.warn(
                                    `Poll failed for ${url}: ${response.status}`,
                                );
                                tryNextPollUrl(index + 1);
                            }
                        },
                        onerror: function (error) {
                            console.error(`Poll error for ${url}:`, error);
                            tryNextPollUrl(index + 1);
                        },
                        ontimeout: function () {
                            console.warn(`Poll timeout for ${url}`);
                            tryNextPollUrl(index + 1);
                        },
                    });
                }

                tryNextPollUrl(0);
            }

            // Start polling immediately
            pollServer();

            // Try to reconnect WebSocket occasionally
            setTimeout(() => {
                console.log(
                    "Trying to reconnect WebSocket after polling period",
                );
                connectionAttempts = 0; // Reset counter
                currentUrlIndex = 0; // Start from first URL
                tryNextUrl();
            }, 60000); // Try again after 1 minute
        }

        // Stop polling
        function stopPolling() {
            if (!pollingActive) return;

            console.log("Stopping HTTP polling");
            pollingActive = false;
            if (pollingTimer) {
                clearTimeout(pollingTimer);
                pollingTimer = null;
            }
        }

        // Start trying WebSocket URLs first
        tryNextUrl();
    }

    // Handle commands from WebSocket
    // Show notification when commands are received
    function showNotification(message, color, duration = 3000) {
        // Create notification element if it doesn't exist
        let notification = document.getElementById("tm-dice-notification");
        if (!notification) {
            notification = document.createElement("div");
            notification.id = "tm-dice-notification";
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 10px 15px;
                background-color: rgba(0, 0, 0, 0.8);
                color: white;
                border-radius: 5px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                z-index: 9999;
                transition: opacity 0.3s ease-in-out;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                white-space: pre-line;
                max-width: 300px;
            `;
            document.body.appendChild(notification);
        }

        // Set notification content and show it
        notification.textContent = message;
        if (color) {
            notification.style.borderLeft = `4px solid ${color}`;
        }
        notification.style.opacity = "1";

        // Clear any existing timeout
        if (notification.hideTimeout) {
            clearTimeout(notification.hideTimeout);
        }

        // Hide notification after specified duration
        notification.hideTimeout = setTimeout(() => {
            notification.style.opacity = "0";
        }, duration);

        // Add click event to hide notification
        notification.onclick = function () {
            this.style.opacity = "0";
        };
    }

    function handleCommand(message) {
        console.log("Handling command:", message);

        if (message.command === "rig") {
            rigSettings.enabled = true;
            rigSettings.color = message.color || 'red';  // Default to red if no color specified
            rigSettings.quantity = message.quantity || 1;  // Default to 1 if no quantity specified
            console.log(
                `Dice rigged: ${rigSettings.quantity} dice will appear ${rigSettings.color}`,
            );

            // Show notification right away that we received the command
            showNotification(
                `Dice successfully rigged! ${rigSettings.quantity} dice are now set to ${rigSettings.color}. Colors will persist through your next roll.`,
                rigSettings.color,
            );
            
            // APPLY IMMEDIATELY: Apply rigging right away and make sure it persists for the first roll
            // Then store settings for persistence across page reloads
            try {
                // Important: Set the roll-again action flag to ensure changes aren't reset on Roll Again
                // Set one-time flag - this will apply colors on next roll only
                sessionStorage.setItem('dice-roll-again-action', 'true');
                sessionStorage.setItem('dice-rig-one-time', 'true');
                
                // Reset roll counter to zero for the new rig command
                sessionStorage.setItem('dice-roll-count', '0');
                
                // Store settings in sessionStorage for persistence
                sessionStorage.setItem('dice-rig-enabled', 'true');
                sessionStorage.setItem('dice-rig-color', rigSettings.color);
                sessionStorage.setItem('dice-rig-quantity', rigSettings.quantity.toString());
                
                // Generate CSS and apply it immediately
                const css = generateRollagainCss(rigSettings.color, rigSettings.quantity);
                sessionStorage.setItem('dice-immediate-css', css);
                
                // Apply the CSS immediately
                const immediateStyle = document.getElementById('dice-immediate-style') || document.createElement('style');
                immediateStyle.id = 'dice-immediate-style';
                immediateStyle.textContent = css;
                document.head.appendChild(immediateStyle);
                
                // Also create a backup style element to ensure it persists
                const backupStyle = document.getElementById('dice-immediate-style-backup') || document.createElement('style');
                backupStyle.id = 'dice-immediate-style-backup';
                backupStyle.textContent = css;
                document.body.appendChild(backupStyle);
                
                // Force immediate application
                applyRigging();
                
                // Schedule multiple attempts to apply the rigging to ensure it works
                setTimeout(applyRigging, 50);
                setTimeout(applyRigging, 200);
                setTimeout(applyRigging, 500);
                
                console.log("🔄 Saved and applied dice rigging settings immediately");
            } catch (e) {
                console.error("Failed to save dice settings to storage:", e);
            }
            
        } else if (message.command === "res") {
            resetRig();
            console.log("Dice reset to normal behavior");

            // Show notification
            showNotification("Dice colors have been reset to normal", "#4CAF50");
        }
    }

    // Reset rigging
    // ULTRA-FAST ROLL AGAIN ENHANCEMENT: Generate special CSS for immediate application
    // This CSS is critical for instant color application when "Roll Again" is clicked
    function generateRollagainCss(color, quantity) {
        // Get total number of dice (defaulting to 4 if we can't determine it)
        const totalDice = 4; // Standard configuration on online-dice.com
        
        // Validate quantity to ensure it's a positive number
        const validQuantity = Math.max(0, Math.min(totalDice, quantity || 0));
        
        // Create the CSS to color only specific dice and reset others
        return `
            /* Performance-optimized CSS with specific targeting */
            
            /* Base styles to ensure white dice backgrounds for ALL dice */
            .tabletop .dice-wrapper.size-100.rounded-dice,
            .dice-wrapper.size-100.rounded-dice,
            [class*="board"] .dice-wrapper.size-100.rounded-dice,
            [class*="dice-container"] .dice-wrapper.size-100.rounded-dice,
            [class*="dice-area"] .dice-wrapper.size-100.rounded-dice,
            /* Additional selectors for AMP version */
            div[class*="amphtml"] .dice-wrapper.size-100.rounded-dice {
                background: #fff !important;
            }
            
            /* ========== COLORED DICE STYLING ========== */
            /* Target only the first N dice based on quantity parameter */
            
            /* Use very specific selectors for pips for maximum compatibility */
            .tabletop .dice-wrapper.size-100.rounded-dice:nth-child(-n+${validQuantity}) i[class*="df-solid-small-dot"],
            .dice-wrapper.size-100.rounded-dice:nth-child(-n+${validQuantity}) i[class*="df-solid-small-dot"],
            .tabletop .dice-wrapper.size-100.rounded-dice:nth-child(-n+${validQuantity}) i[class*="dot"],
            .dice-wrapper.size-100.rounded-dice:nth-child(-n+${validQuantity}) i[class*="dot"],
            /* Exact selectors for all six dice faces in standard version */
            .dice-wrapper.size-100.rounded-dice:nth-child(-n+${validQuantity}) i.df-solid-small-dot-d6-1,
            .dice-wrapper.size-100.rounded-dice:nth-child(-n+${validQuantity}) i.df-solid-small-dot-d6-2,
            .dice-wrapper.size-100.rounded-dice:nth-child(-n+${validQuantity}) i.df-solid-small-dot-d6-3,
            .dice-wrapper.size-100.rounded-dice:nth-child(-n+${validQuantity}) i.df-solid-small-dot-d6-4,
            .dice-wrapper.size-100.rounded-dice:nth-child(-n+${validQuantity}) i.df-solid-small-dot-d6-5,
            .dice-wrapper.size-100.rounded-dice:nth-child(-n+${validQuantity}) i.df-solid-small-dot-d6-6 {
                color: ${color} !important;
            }
            
            /* ========== NO STYLE RESET FOR NORMAL DICE ========== */
            /* We don't change the remaining dice - leave them with normal styling */
            /* This ensures only the first N dice are colored, and the rest remain untouched */
            
            /* ========== AMP VERSION SPECIFIC SELECTORS ========== */
            /* For colored dice in AMP version */
            html.i-amphtml-singledoc .dice-wrapper.size-100.rounded-dice:nth-child(-n+${validQuantity}) i[class*="df-solid-small-dot"],
            html.i-amphtml-singledoc .dice-wrapper.size-100.rounded-dice:nth-child(-n+${validQuantity}) i[class*="dot"],
            html.i-amphtml-standalone .dice-wrapper.size-100.rounded-dice:nth-child(-n+${validQuantity}) i[class*="df-solid-small-dot"],
            html.i-amphtml-standalone .dice-wrapper.size-100.rounded-dice:nth-child(-n+${validQuantity}) i[class*="dot"] {
                color: ${color} !important;
            }
            
            /* ========== PERFORMANCE OPTIMIZATION ========== */
            /* Use minimal animation to trigger a repaint without causing freezes */
            @keyframes dice-flash {
                0% { opacity: 0.99; }
                100% { opacity: 1; }
            }
            
            /* Apply minimal animation to force a repaint */
            .dice-wrapper.size-100.rounded-dice i[class*="df-solid-small-dot"] {
                animation: dice-flash 0.01s;
            }
            
            /* ========== ROLL ICON FIXES ========== */
            /* Comprehensive fixes for roll icons and buttons */
            .roll-button i, 
            .btn i, 
            button i,
            .controls i,
            .btn span i,
            .roll-button span i,
            [class*="control"] i,
            [class*="button"] i,
            [class*="btn"] i,
            .roll-again-button i,
            .roll-again i,
            /* Additional selectors for UI elements */
            header i,
            nav i,
            footer i,
            .header i,
            .footer i,
            .navigation i {
                color: inherit !important;
                background-color: inherit !important;
                background: inherit !important;
            }
            
            /* Fix specifically for the roll buttons */
            button[class*="roll"],
            a[class*="roll"],
            div[class*="roll"] {
                color: inherit !important;
            }
        `;
    }
    
    function resetRig() {
        rigSettings.enabled = false;
        rigSettings.color = "";
        rigSettings.quantity = 0;

        // PERSISTENCE: Clear all stored rigging settings from localStorage and sessionStorage
        try {
            // Important: Clear the roll-again action flag so next page load is treated as a refresh
            sessionStorage.removeItem('dice-roll-again-action');
            
            // Clear from localStorage
            localStorage.removeItem('dice-rig-enabled');
            localStorage.removeItem('dice-rig-color');
            localStorage.removeItem('dice-rig-quantity');
            localStorage.removeItem('dice-immediate-css');
            localStorage.removeItem('diceRigEnabled');
            localStorage.removeItem('diceRigColor');
            localStorage.removeItem('diceRigQuantity');
            localStorage.removeItem('diceRigTimestamp');
            
            // Clear from sessionStorage
            sessionStorage.removeItem('dice-rig-enabled');
            sessionStorage.removeItem('dice-rig-color');
            sessionStorage.removeItem('dice-rig-quantity');
            sessionStorage.removeItem('dice-immediate-css');
            sessionStorage.removeItem('diceRigEnabled');
            sessionStorage.removeItem('diceRigColor');
            sessionStorage.removeItem('diceRigQuantity');
            sessionStorage.removeItem('diceRigTimestamp');
            sessionStorage.removeItem('dice-roll-count');
            
            console.log("🧹 Cleared all dice rigging settings from storage");
        } catch (e) {
            console.error("Failed to clear storage:", e);
        }
        
        // Remove any custom styles we've added
        const customStyleElement = document.getElementById("tm-dice-rig-styles");
        if (customStyleElement) {
            customStyleElement.remove();
        }
        
        // Also remove the immediate style if it exists
        const immediateStyle = document.getElementById("dice-immediate-style");
        if (immediateStyle) {
            immediateStyle.remove();
        }
        
        const backupStyle = document.getElementById("dice-immediate-style-backup");
        if (backupStyle) {
            backupStyle.remove();
        }

        console.log("Reset complete: Dice colors returned to normal");

        // Force a refresh of the dice styling by triggering a small CSS change and then removing it
        const refreshStyle = document.createElement("style");
        refreshStyle.textContent =
            ".dice-wrapper { transition: none !important; }";
        document.head.appendChild(refreshStyle);

        // Remove the refresh style after a brief moment
        setTimeout(() => {
            refreshStyle.remove();
        }, 50);
    }

    // Apply rigging to dice - ULTRA FAST APPROACH WITH ZERO DELAY
    function applyRigging() {
        // Check if a reset was requested (for one-time rigging)
        if (sessionStorage.getItem('dice-reset-requested') === 'true') {
            console.log("🧹 Reset requested - clearing rigging settings and returning to normal dice");
            
            // Clear the reset flag
            sessionStorage.removeItem('dice-reset-requested');
            
            // Reset all rigging settings
            rigSettings.enabled = false;
            rigSettings.color = "";
            rigSettings.quantity = 0;
            
            // Remove any styles we've added
            const stylesToRemove = [
                'dice-preemptive-style', 
                'dice-immediate-style', 
                'dice-immediate-style-backup',
                'dice-preload-style',
                'dice-preload-head-style',
                'tm-dice-rig-styles'
            ];
            
            for (const styleId of stylesToRemove) {
                const styleElement = document.getElementById(styleId);
                if (styleElement) {
                    styleElement.remove();
                }
            }
            
            // Show notification
            showNotification("Dice reset to normal appearance", "#4CAF50", 1500);
            
            return;
        }
        
        if (!rigSettings.enabled || rigSettings.quantity <= 0) {
            return;
        }
        
        // Enhanced rate limiting to prevent page freezing
        // Added more intelligent throttling with priority system
        const now = Date.now();
        const timeSinceLastApply = now - (applyRigging.lastApplied || 0);
        
        // Special handling for high-priority application (roll button vs background updates)
        if (window.diceRollButtonClicked) {
            // For roll button clicks, we still throttle but with a much shorter delay (5ms)
            // This prevents UI freezing while maintaining quick response
            if (timeSinceLastApply < 5) {
                return; // Silent return - no logging to reduce console spam
            }
        } else {
            // For background/passive updates, use standard throttling (50ms)
            if (timeSinceLastApply < 50) {
                return; // Silent return to reduce console spam
            }
        }
        
        // Track application time
        applyRigging.lastApplied = now;
        
        // Performance optimization: Clear any pending setTimeout operations
        // This prevents stacking too many operations when multiple calls happen in quick succession
        if (applyRigging.pendingTimeout) {
            clearTimeout(applyRigging.pendingTimeout);
            applyRigging.pendingTimeout = null;
        }
        
        // PERSISTENCE: Save rigging settings to localStorage and sessionStorage for persistence across page reloads
        try {
            localStorage.setItem('dice-rig-enabled', 'true');
            localStorage.setItem('dice-rig-color', rigSettings.color);
            localStorage.setItem('dice-rig-quantity', rigSettings.quantity.toString());
            sessionStorage.setItem('dice-rig-enabled', 'true');
            sessionStorage.setItem('dice-rig-color', rigSettings.color);
            sessionStorage.setItem('dice-rig-quantity', rigSettings.quantity.toString());
            
            // CRITICAL: Generate and save the CSS for immediate application during page load
            const css = generateRollagainCss(rigSettings.color, rigSettings.quantity);
            localStorage.setItem('dice-immediate-css', css);
            sessionStorage.setItem('dice-immediate-css', css);
            
            console.log("🔄 Saved dice rigging settings to storage for persistence");
        } catch (e) {
            console.error("Failed to save dice settings to storage:", e);
        }

        console.log("Applying rigging with color:", rigSettings.color, "quantity:", rigSettings.quantity);
        
        // ENHANCEMENT: Try multiple selectors for finding dice to improve reliability
        let tabletop = document.querySelector('.tabletop');
        if (!tabletop) {
            // Try alternate selectors if the primary one doesn't work
            const alternateSelectors = [
                '.board', '#dice-box', '#dice-container', '.dice-area',
                'div[class*="dice"]', 'div[id*="dice"]'
            ];
            
            for (const selector of alternateSelectors) {
                tabletop = document.querySelector(selector);
                if (tabletop) {
                    console.log(`Found dice container using alternate selector: ${selector}`);
                    break;
                }
            }
            
            if (!tabletop) {
                // If we still can't find it, just use the document.body as a last resort
                tabletop = document.body;
                console.log("No specific dice container found, using document.body");
            }
        }
        
        // ENHANCEMENT: Use multiple selectors to find dice elements
        let diceElements = tabletop.querySelectorAll('.dice-wrapper.size-100.rounded-dice');
        
        if (diceElements.length === 0) {
            // Try other selectors if the main one doesn't work
            const diceSelectors = [
                '.dice', 'div[class*="dice"]', '.die', 'div[class*="die"]',
                '[class*="dice-wrapper"]', '[class*="dice_wrapper"]'
            ];
            
            for (const selector of diceSelectors) {
                diceElements = tabletop.querySelectorAll(selector);
                if (diceElements.length > 0) {
                    console.log(`Found dice using alternate selector: ${selector}`);
                    break;
                }
            }
            
            if (diceElements.length === 0) {
                // As a last resort, look for any element with the word "dice" in its class or id
                const allElements = tabletop.querySelectorAll('*');
                const potentialDice = [];
                
                for (const element of allElements) {
                    if ((element.className && element.className.toLowerCase().includes('dice')) ||
                        (element.id && element.id.toLowerCase().includes('dice'))) {
                        potentialDice.push(element);
                    }
                }
                
                if (potentialDice.length > 0) {
                    diceElements = potentialDice;
                    console.log(`Found ${potentialDice.length} potential dice elements using heuristic search`);
                } else {
                    console.log("No dice elements found with any method");
                    return;
                }
            }
        }
        
        console.log(`Found ${diceElements.length} dice elements`);
        
        // Apply to each die based on the exact HTML structure you provided
        for (let i = 0; i < diceElements.length; i++) {
            const die = diceElements[i];
            
            // DIRECTLY SET STYLE ATTRIBUTE exactly as in your HTML
            // From the HTML: <div class="dice-wrapper size-100 rounded-dice" style="background:#fff!important;">
            die.setAttribute('style', 'background:#fff!important;');
            
            // ENHANCEMENT: Try multiple selectors for pips to improve reliability
            // First try the exact selector from the HTML
            let pip = die.querySelector('i.df-solid-small-dot-d6-1');
            
            if (!pip) {
                // Try more generic selectors if the specific one doesn't work
                const pipSelectors = [
                    'i[class*="dot"]', 'i[class*="pip"]', 'i[class*="dice"]', 
                    'span[class*="dot"]', 'span[class*="pip"]', 'div[class*="dot"]'
                ];
                
                for (const selector of pipSelectors) {
                    const pips = die.querySelectorAll(selector);
                    if (pips.length > 0) {
                        pip = pips[0]; // Just use the first one found
                        console.log(`Found pip using alternate selector: ${selector}`);
                        break;
                    }
                }
            }
            
            if (pip) {
                if (i < rigSettings.quantity) {
                    // For rigged dice, set the color with !important exactly as in your HTML
                    pip.setAttribute('style', `color:${rigSettings.color}!important;`);
                    console.log(`Set die ${i+1} to color: ${rigSettings.color}`);
                    
                    // Find ALL pips in this die, not just the first one
                    const allPips = die.querySelectorAll('i[class*="dot"], i[class*="pip"]');
                    if (allPips.length > 1) {
                        // If we have multiple pips (e.g., a 6-sided die showing 6), set all of them
                        for (const additionalPip of allPips) {
                            if (additionalPip !== pip) { // Skip the one we already set
                                additionalPip.setAttribute('style', `color:${rigSettings.color}!important;`);
                            }
                        }
                    }
                }
                // We don't make any changes to the remaining dice - leave them with normal styling
            } else {
                // If we still can't find the pip, try setting a CSS rule instead
                const dieId = `tm-die-${i}`;
                die.id = dieId;
                
                // Remove any previous style for this die
                const oldStyle = document.getElementById(`style-${dieId}`);
                if (oldStyle) {
                    oldStyle.remove();
                }
                
                const pipStyle = document.createElement('style');
                pipStyle.id = `style-${dieId}`;
                
                if (i < rigSettings.quantity) {
                    // Colored dice - only apply color to specified dice
                    pipStyle.textContent = `
                        #${dieId} i[class*="dot"],
                        #${dieId} i[class*="pip"],
                        #${dieId} i[class*="df-solid-small-dot"] {
                            color: ${rigSettings.color} !important;
                        }
                    `;
                } else {
                    // For dice beyond the requested quantity, don't apply any styling
                    // This leaves them with their normal appearance
                    // Empty style to remove any previous styling but not add new styling
                    pipStyle.textContent = `
                        /* No style changes for normal dice */
                    `;
                }
                
                document.head.appendChild(pipStyle);
                console.log(`Applied CSS rule to die ${i+1} as fallback - ${i < rigSettings.quantity ? 'colored' : 'normal'}`);
            }
        }
        
        // PERFORMANCE OPTIMIZATION: Less aggressive verification to prevent freezing
        // Use fewer follow-up checks with a single timeout
        // This prevents too many concurrent operations which can cause page freezing
        
        // Clear any previous verification timeouts to prevent stacking
        if (applyRigging.verifyTimeout) {
            clearTimeout(applyRigging.verifyTimeout);
        }
        
        // Use a single verification with debouncing
        applyRigging.verifyTimeout = setTimeout(() => {
            // After a delay, verify the colors are still applied correctly
            const diceElements = document.querySelectorAll('.tabletop .dice-wrapper.size-100.rounded-dice');
            
            // If we can't find dice with the primary selector, try alternative ones
            let dicesToVerify = diceElements.length > 0 ? diceElements : 
                               document.querySelectorAll('[class*="dice"], [class*="die"]');
            
            // Limit performance impact by checking only what's needed - only check the rigged dice
            const diesToCheck = Math.min(dicesToVerify.length, rigSettings.quantity);
            
            // ONLY verify and fix the dice that should be colored
            // Do not make any changes to normal dice beyond the requested quantity
            for (let i = 0; i < diesToCheck; i++) {
                const die = dicesToVerify[i];
                
                if (i < rigSettings.quantity) {
                    const pip = die.querySelector('i[class*="dot"], i[class*="pip"]');
                    if (pip) {
                        // Set color for the rigged dice
                        pip.setAttribute('style', `color:${rigSettings.color}!important;`);
                    }
                }
            }
        }, 100);
    }
    
    // Create a variable to track the last application time to avoid excessive calls
    if (typeof applyRigging.lastApplied === 'undefined') {
        applyRigging.lastApplied = 0;
    }

    // Observer to watch for dice roll events
    function setupDiceObserver() {
        // Create a MutationObserver to watch for changes
        const observer = new MutationObserver((mutations) => {
            let shouldApplyRigging = false;
            
            // Look for dice appearing in the DOM or attribute changes
            for (const mutation of mutations) {
                // Check for new nodes being added (like after a dice roll)
                if (mutation.type === "childList" && mutation.addedNodes.length) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check for any of our target dice elements (for online-dice.com)
                            const targetSelectors = [
                                ".tabletop",
                                ".dice-wrapper.size-100.rounded-dice",
                                ".roll-button",
                                "i.df-solid-small-dot-d6-1",
                            ];

                            // Check if this node matches any of our selectors
                            const matchesSelectors = targetSelectors.some(
                                (selector) => {
                                    return (
                                        (node.matches &&
                                            node.matches(selector)) ||
                                        (node.querySelector &&
                                            node.querySelector(selector))
                                    );
                                },
                            );

                            if (matchesSelectors) {
                                shouldApplyRigging = true;
                                break;
                            }
                        }
                    }
                }
                
                // Also check for attribute changes on dice elements (style or class changes)
                if (mutation.type === "attributes") {
                    const targetNode = mutation.target;
                    if (
                        targetNode.matches &&
                        (targetNode.matches(".dice-wrapper.size-100.rounded-dice") ||
                        targetNode.matches("i.df-solid-small-dot-d6-1") ||
                        targetNode.matches(".tabletop"))
                    ) {
                        shouldApplyRigging = true;
                        break;
                    }
                }
            }
            
            // Apply rigging if needed - using multiple delayed applications to ensure it sticks
            if (shouldApplyRigging && rigSettings.enabled) {
                console.log("Dice change detected, applying rigging");
                
                // Apply immediately
                applyRigging();
                
                // Apply again after short delays to catch all rendering cycles
                setTimeout(applyRigging, 50);
                setTimeout(applyRigging, 100);
                setTimeout(applyRigging, 250);
                setTimeout(applyRigging, 500);
            }
        });

        // Start observing the document with the configured parameters
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["class", "style"],
        });
        
        // CRITICAL: Enhanced page navigation detection for the "Roll Again" button click
        // This is the most important part of the script for preserving colors during page navigation
        window.addEventListener('beforeunload', function(event) {
            // This fires when the page is about to change - specifically when "Roll Again" is clicked
            console.log("⚠️ PAGE NAVIGATION DETECTED - Preparing for dice roll!");
            
            // Create a flag in both storages to indicate we came from a roll
            sessionStorage.setItem('cameFromRoll', 'true');
            localStorage.setItem('cameFromRoll', 'true');
            
            // Store last navigation time to detect fresh navigation
            const navigationTime = Date.now().toString();
            sessionStorage.setItem('lastNavigationTime', navigationTime);
            localStorage.setItem('lastNavigationTime', navigationTime);
            
            // Store in BOTH sessionStorage AND localStorage that we need to apply rigging after page load
            if (rigSettings.enabled) {
                try {
                    // Save current rig settings to sessionStorage
                    sessionStorage.setItem('diceRigEnabled', 'true');
                    sessionStorage.setItem('diceRigColor', rigSettings.color);
                    sessionStorage.setItem('diceRigQuantity', rigSettings.quantity);
                    sessionStorage.setItem('diceRigTimestamp', navigationTime);
                    
                    // Also save to localStorage for maximum persistence
                    localStorage.setItem('diceRigEnabled', 'true');
                    localStorage.setItem('diceRigColor', rigSettings.color);
                    localStorage.setItem('diceRigQuantity', rigSettings.quantity.toString());
                    localStorage.setItem('diceRigTimestamp', navigationTime);
                    
                    console.log("✅ SUCCESS: Saved rigging settings to BOTH storage types for after page navigation!");
                    
                    // Attempt to inject CSS directly into the next page
                    try {
                        // Create a style block that will be injected into the page
                        const styleContent = `
                            .dice-wrapper.size-100.rounded-dice {
                                background: #fff !important;
                            }
                            .dice-wrapper.size-100.rounded-dice:nth-child(-n+${rigSettings.quantity}) i[class*="df-solid-small-dot"] {
                                color: ${rigSettings.color} !important;
                            }
                        `;
                        
                        // Store in localStorage for retrieval on next page
                        localStorage.setItem('dice-immediate-css', styleContent);
                    } catch (cssErr) {
                        console.error("Failed to prepare CSS for next page:", cssErr);
                    }
                } catch (e) {
                    console.error("Failed to save to storage:", e);
                }
            }
        });
        
        // CRITICAL: Register for the earliest possible page load events to apply colors immediately
        // This runs BEFORE the DOMContentLoaded event
        document.onreadystatechange = function() {
            if (document.readyState === "interactive") {
                console.log("Document is interactive - checking for saved rig settings EARLY");
                applyRigSettingsFromStorage();
            }
        };
        
        // Check on page load if we need to apply rigging (if we came from a "Roll Again" click)
        // IMMEDIATE APPLICATION FUNCTION
        function applyRigSettingsFromStorage() {
            try {
                // Check both sessionStorage AND localStorage for maximum persistence
                const sessionEnabled = sessionStorage.getItem('diceRigEnabled') === 'true';
                const localEnabled = localStorage.getItem('diceRigEnabled') === 'true';
                
                if (sessionEnabled || localEnabled) {
                    // Get values from sessionStorage first (more recent), fall back to localStorage
                    const savedColor = sessionStorage.getItem('diceRigColor') || localStorage.getItem('diceRigColor');
                    const savedQuantity = parseInt(sessionStorage.getItem('diceRigQuantity'), 10) || 
                                         parseInt(localStorage.getItem('diceRigQuantity'), 10);
                    const timestamp = parseInt(sessionStorage.getItem('diceRollTimestamp'), 10) || 
                                     parseInt(localStorage.getItem('diceRollTimestamp'), 10);
                    
                    console.log(`IMMEDIATE: Found saved rigging settings from ${sessionEnabled ? 'sessionStorage' : 'localStorage'} after page navigation:`, savedColor, savedQuantity);
                    
                    // Apply the saved settings
                    rigSettings.enabled = true;
                    rigSettings.color = savedColor || 'red';
                    rigSettings.quantity = isNaN(savedQuantity) ? 1 : savedQuantity;
                    
                    // ULTRA-EARLY PRE-STYLING to prevent flash of normal dice
                    // This is critical for preventing the brief flash of normal dice
                    
                    // First, inject a style element directly into the document head
                    const preemptiveStyle = document.createElement('style');
                    preemptiveStyle.id = 'dice-preemptive-style';
                    
                    // This is more aggressive and specific styling to prevent any flicker
                    preemptiveStyle.textContent = `
                        /* White backgrounds for ALL dice */
                        .dice-wrapper.size-100.rounded-dice,
                        div[class*="dice"],
                        [class*="dice-wrapper"],
                        [class*="die"] {
                            background: #fff !important;
                        }
                        
                        /* Apply color IMMEDIATELY to first N dice with highest priority */
                        .dice-wrapper.size-100.rounded-dice:nth-child(-n+${rigSettings.quantity}) i[class*="df-solid-small-dot"],
                        .dice-wrapper.size-100.rounded-dice:nth-child(-n+${rigSettings.quantity}) i[class*="dot"],
                        div[class*="dice"]:nth-child(-n+${rigSettings.quantity}) i[class*="dot"],
                        [class*="dice-wrapper"]:nth-child(-n+${rigSettings.quantity}) i[class*="dot"],
                        [class*="die"]:nth-child(-n+${rigSettings.quantity}) i[class*="dot"],
                        
                        /* Extremely specific selectors for all possible dice faces */
                        .dice-wrapper.size-100.rounded-dice:nth-child(-n+${rigSettings.quantity}) i.df-solid-small-dot-d6-1,
                        .dice-wrapper.size-100.rounded-dice:nth-child(-n+${rigSettings.quantity}) i.df-solid-small-dot-d6-2,
                        .dice-wrapper.size-100.rounded-dice:nth-child(-n+${rigSettings.quantity}) i.df-solid-small-dot-d6-3,
                        .dice-wrapper.size-100.rounded-dice:nth-child(-n+${rigSettings.quantity}) i.df-solid-small-dot-d6-4,
                        .dice-wrapper.size-100.rounded-dice:nth-child(-n+${rigSettings.quantity}) i.df-solid-small-dot-d6-5,
                        .dice-wrapper.size-100.rounded-dice:nth-child(-n+${rigSettings.quantity}) i.df-solid-small-dot-d6-6 {
                            color: ${rigSettings.color} !important;
                        }
                        
                        /* Animation trick to force immediate repaint */
                        @keyframes instant-color {
                            0% { opacity: 0.99; }
                            100% { opacity: 1; }
                        }
                        
                        /* Apply to all dice elements to force repaint */
                        [class*="dice"] i {
                            animation: instant-color 0.001s;
                        }
                    `;
                    document.head.appendChild(preemptiveStyle);
                    
                    // ULTRA-AGGRESSIVE APPLICATION:
                    // 1. Apply immediately
                    applyRigging();
                    
                    // 2. Set up a more frequent and immediate retry schedule
                    // - Every 50ms for first second (20 attempts)
                    // - Every 100ms for next 2 seconds (20 attempts) 
                    // - Every 200ms for next 4 seconds (20 attempts)
                    for (let i = 1; i <= 20; i++) {
                        setTimeout(applyRigging, i * 50);  // 0-1 seconds
                        setTimeout(applyRigging, 1000 + (i * 100)); // 1-3 seconds
                        setTimeout(applyRigging, 3000 + (i * 200)); // 3-7 seconds
                    }
                    
                    // 3. Set up a MutationObserver to watch for dice appearance - most important!
                    const diceAppearanceObserver = new MutationObserver((mutations) => {
                        for (const mutation of mutations) {
                            if (mutation.addedNodes.length) {
                                // Check multiple selectors for dice elements
                                const diceSelectors = [
                                    '.tabletop .dice-wrapper', 
                                    '.dice-wrapper', 
                                    'div[class*="dice"]',
                                    'div[class*="die"]'
                                ];
                                
                                for (const selector of diceSelectors) {
                                    const diceElements = document.querySelectorAll(selector);
                                    if (diceElements.length > 0) {
                                        console.log(`DETECTED DICE APPEARANCE using selector '${selector}', applying colors NOW!`);
                                        applyRigging();
                                        break;
                                    }
                                }
                            }
                        }
                    });
                    
                    // Start the dice appearance observer immediately with aggressive config
                    diceAppearanceObserver.observe(document.documentElement, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        characterData: true
                    });
                    
                    // 4. Show a notification that we've restored settings after navigation
                    showNotification(
                        `Applying ${rigSettings.color} to ${rigSettings.quantity} dice after Roll Again!`,
                        rigSettings.color,
                        3000
                    );
                    
                    // 5. Set a timeout to disconnect the observer after a reasonable time
                    setTimeout(() => {
                        console.log("Disconnecting aggressive dice appearance observer");
                        diceAppearanceObserver.disconnect();
                    }, 10000); // Stop observing after 10 seconds
                }
            } catch (e) {
                console.error("Error checking sessionStorage:", e);
            }
        }
        
        // Call immediately in case the page is already loaded
        applyRigSettingsFromStorage();
        
        // Add event listener for the "Roll Again" button
        function setupRollButtonListener() {
            console.log("Setting up roll button listener with multiple approaches");

            // Try targeted approach first - by ID and class
            trySpecificButtonSelectors();
            
            // Also add an aggressive approach - capture all anchor clicks
            document.addEventListener('click', function(e) {
                // Intercept any click on elements that might be the roll button
                if (e.target && (
                    e.target.id === 'roll-button' || 
                    e.target.classList.contains('roll-button') ||
                    (e.target.tagName === 'A' && e.target.textContent.includes('Roll Again')) ||
                    (e.target.href && e.target.href.includes('roll-color-dice'))
                )) {
                    console.log("Roll button click captured via document listener", e.target);
                    rollButtonClickHandler();
                    
                    // Show feedback to confirm detection
                    showNotification("Roll detected via document click", rigSettings.color, 1000);
                }
            });
            
            // Inject special listener into page for the exact button you specified
            injectSpecialButtonListener();
        }
        
        function trySpecificButtonSelectors() {
            // Try multiple selectors to ensure we find the button
            const selectors = [
                '#roll-button', 
                '.roll-button', 
                'a[href*="roll-color-dice"]',
                'a.roll-button',
                'a[id="roll-button"]',
                'a[class="roll-button rounded"]'
            ];
            
            for (const selector of selectors) {
                const buttons = document.querySelectorAll(selector);
                if (buttons.length > 0) {
                    console.log(`Found ${buttons.length} roll buttons with selector: ${selector}`);
                    
                    buttons.forEach(button => {
                        // Remove any existing listeners first to avoid duplicates
                        button.removeEventListener('click', rollButtonClickHandler);
                        
                        // Add our click listener
                        button.addEventListener('click', rollButtonClickHandler);
                        console.log("Added click listener to button:", button);
                    });
                }
            }
            
            // If we didn't find any, try again later and also look for the roll button in the exact location from the HTML
            if (!document.querySelector(selectors.join(','))) {
                console.log("No roll buttons found yet, will try again soon");
                
                // Look for any <a> element that contains "Roll Again" text
                const links = document.querySelectorAll('a');
                for (const link of links) {
                    if (link.textContent && link.textContent.includes('Roll Again')) {
                        console.log("Found roll button by text content:", link);
                        link.removeEventListener('click', rollButtonClickHandler);
                        link.addEventListener('click', rollButtonClickHandler);
                    }
                }
                
                setTimeout(trySpecificButtonSelectors, 1000);
            }
        }
        
        function injectSpecialButtonListener() {
            console.log("Setting up roll button listener for exact HTML structure");
            
            // Based on the HTML you provided:
            // <a href="https://www.online-dice.com/roll-color-dice/4/" id="roll-button" class="roll-button rounded">Roll Again !</a>
            const exactButtonSelector = 'a[id="roll-button"][class="roll-button rounded"]';
            
            // Try direct approach first
            const exactButton = document.querySelector(exactButtonSelector);
            if (exactButton) {
                console.log("Found roll button directly:", exactButton);
                exactButton.addEventListener('click', rollButtonClickHandler);
            }
            
            // Create and inject a script that will directly access the DOM 
            const scriptElement = document.createElement('script');
            scriptElement.textContent = `
                // This runs in the page context to get direct access to the button
                (function() {
                    function findAndAttachToRollButton() {
                        // Look for the roll button with multiple selectors based on the HTML
                        const selectors = [
                            'a[id="roll-button"][class="roll-button rounded"]',
                            '#roll-button.roll-button',
                            'a.roll-button.rounded',
                            'a:contains("Roll Again")'
                        ];
                        
                        let found = false;
                        for (const selector of selectors) {
                            try {
                                const button = document.querySelector(selector);
                                if (button) {
                                    console.log("Found roll button with selector:", selector);
                                    
                                    // Add a click event listener that dispatches a custom event
                                    button.addEventListener('click', function(e) {
                                        console.log("Roll button clicked from injected script");
                                        
                                        // Create a custom event our TamperMonkey script can detect
                                        const rollEvent = new CustomEvent('dice-roll-action');
                                        document.dispatchEvent(rollEvent);
                                    });
                                    
                                    found = true;
                                    break;
                                }
                            } catch (err) {
                                // Some selectors might not be valid in some browsers
                                console.log("Error with selector:", selector, err);
                            }
                        }
                        
                        // If we don't find the button, try again soon
                        if (!found) {
                            setTimeout(findAndAttachToRollButton, 1000);
                        }
                    }
                    
                    // Start looking for the button
                    findAndAttachToRollButton();
                })();
            `;
            
            document.head.appendChild(scriptElement);
            
            // Listen for the custom event from our injected script
            document.addEventListener('dice-roll-action', function() {
                console.log("Detected roll via custom event");
                rollButtonClickHandler();
            });
        }
        
        // Handler for roll button clicks - ULTRA-ENHANCED FOR IMMEDIATE COLOR APPLICATION
        function rollButtonClickHandler() {
            console.log("🎲 Roll button clicked - Roll Again!");
            
            // Set roll-again action flag to ensure this is not treated as a page refresh
            sessionStorage.setItem('dice-roll-again-action', 'true');
            
            // Flag to bypass throttling in applyRigging
            window.diceRollButtonClicked = true;
            
            // Increment the roll count for each roll
            const rollCount = parseInt(sessionStorage.getItem('dice-roll-count') || '0', 10);
            const newRollCount = rollCount + 1;
            sessionStorage.setItem('dice-roll-count', newRollCount.toString());
            
            // Reset colors on the SECOND roll (when roll count reaches 2)
            if (rigSettings.enabled && newRollCount >= 2) {
                console.log("🧹 Second or later roll - resetting dice colors");
                
                // Reset all rigging settings
                rigSettings.enabled = false;
                rigSettings.color = "";
                rigSettings.quantity = 0;
                
                // Remove all storage items immediately
                sessionStorage.removeItem('dice-rig-one-time');
                sessionStorage.removeItem('dice-rig-enabled');
                sessionStorage.removeItem('dice-rig-color');
                sessionStorage.removeItem('dice-rig-quantity');
                sessionStorage.removeItem('dice-immediate-css');
                sessionStorage.removeItem('dice-roll-count');
                localStorage.removeItem('dice-rig-enabled');
                localStorage.removeItem('dice-rig-color');
                localStorage.removeItem('dice-rig-quantity');
                localStorage.removeItem('dice-immediate-css');
                
                // Remove any existing style elements
                const stylesToRemove = [
                    'dice-preemptive-style', 
                    'dice-immediate-style', 
                    'dice-immediate-style-backup',
                    'dice-preload-style',
                    'dice-preload-head-style',
                    'tm-dice-rig-styles'
                ];
                
                for (const styleId of stylesToRemove) {
                    const styleElement = document.getElementById(styleId);
                    if (styleElement) {
                        styleElement.remove();
                    }
                }
                
                // Show notification
                showNotification("Second roll detected - dice colors have been reset to normal", "#4CAF50", 1500);
                return; // Skip the rest of the function
            }
            
            // If this is the first roll after rigging, keep the colors but show a notification
            if (rigSettings.enabled && rollCount === 0) {
                // Show feedback to confirm roll detection
                showNotification("Dice roll detected - keeping your custom colors for this roll", rigSettings.color, 1500);
                
                // Create the CSS for this roll
                const cssContent = generateRollagainCss(rigSettings.color, rigSettings.quantity);
                
                // Apply colors for this roll - create multiple style elements to ensure it applies
                // First style in document head
                if (!document.getElementById('dice-preload-style')) {
                    const instantStyle = document.createElement('style');
                    instantStyle.id = 'dice-preload-style';
                    instantStyle.textContent = cssContent;
                    document.head.appendChild(instantStyle);
                }
                
                // Second style in document root for redundancy
                if (!document.getElementById('dice-preload-head-style')) {
                    const headStyle = document.createElement('style');
                    headStyle.id = 'dice-preload-head-style';
                    headStyle.textContent = cssContent;
                    document.documentElement.appendChild(headStyle);
                }
                
                // Force immediate application and schedule multiple attempts
                window.diceRollButtonClicked = true; // Flag to bypass throttling
                applyRigging(); // Apply immediately
                
                // Schedule multiple attempts to catch dice as they appear
                setTimeout(applyRigging, 10);
                setTimeout(applyRigging, 50);
                setTimeout(applyRigging, 200);
                setTimeout(applyRigging, 500);
            } else {
                console.log("Roll Again clicked - applying normal dice");
            }
        }
        
        // Start listening for button clicks
        setupRollButtonListener();

        // Apply rigging immediately in case elements already exist
        setTimeout(applyRigging, 500);
        
        // ENHANCEMENT: Add a MutationObserver to detect when dice are added to the DOM
        // This is the ultimate way to ensure colors are applied instantly as soon as dice appear
        try {
            const diceObserver = new MutationObserver((mutations) => {
                if (!rigSettings.enabled) return;
                
                let shouldApply = false;
                
                // Check if any dice elements were added
                for (const mutation of mutations) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                // Check if this node is a dice or contains dice
                                if ((node.className && 
                                    (node.className.includes('dice') || 
                                     node.className.includes('die') || 
                                     node.className.includes('tabletop'))) ||
                                    node.querySelector && (
                                        node.querySelector('[class*="dice"]') || 
                                        node.querySelector('[class*="die"]') ||
                                        node.querySelector('i[class*="df-solid-small-dot"]')
                                    )
                                ) {
                                    shouldApply = true;
                                    break;
                                }
                            }
                        }
                    }
                    
                    if (shouldApply) break;
                }
                
                if (shouldApply) {
                    console.log("🔍 MutationObserver detected dice added to DOM, applying colors immediately!");
                    window.diceRollButtonClicked = true; // Set flag to bypass throttling
                    applyRigging();
                    
                    // Apply multiple times to ensure it sticks
                    setTimeout(applyRigging, 10);
                    setTimeout(applyRigging, 50);
                    setTimeout(applyRigging, 100);
                }
            });
            
            // Start observing the entire document for any dice-related changes
            diceObserver.observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style']
            });
            
            console.log("🔍 MutationObserver set up to detect dice additions");
        } catch (e) {
            console.error("Failed to set up MutationObserver:", e);
        }
    }

    // Initialize the script
    function initialize() {
        console.log("🎲 Dice Color Modifier script v1.0 initialized 🎲");
        
        // PERSISTENCE: Check for stored rigging settings and restore them
        try {
            // First try getting from localStorage (more persistent)
            let storedEnabled = localStorage.getItem('dice-rig-enabled') === 'true';
            let storedColor = localStorage.getItem('dice-rig-color');
            let storedQuantity = parseInt(localStorage.getItem('dice-rig-quantity') || '0', 10);
            
            // If not found in localStorage, try sessionStorage
            if (!storedEnabled) {
                storedEnabled = sessionStorage.getItem('dice-rig-enabled') === 'true';
                storedColor = sessionStorage.getItem('dice-rig-color');
                storedQuantity = parseInt(sessionStorage.getItem('dice-rig-quantity') || '0', 10);
            }
            
            // Alternative storage keys from beforeunload handler
            if (!storedEnabled) {
                storedEnabled = localStorage.getItem('diceRigEnabled') === 'true';
                storedColor = localStorage.getItem('diceRigColor');
                storedQuantity = parseInt(localStorage.getItem('diceRigQuantity') || '0', 10);
                
                // Last resort: check sessionStorage
                if (!storedEnabled) {
                    storedEnabled = sessionStorage.getItem('diceRigEnabled') === 'true';
                    storedColor = sessionStorage.getItem('diceRigColor');
                    storedQuantity = parseInt(sessionStorage.getItem('diceRigQuantity') || '0', 10);
                }
            }
            
            // Apply settings if we found stored values
            if (storedEnabled && storedColor && storedQuantity > 0) {
                console.log("✅ Restoring saved dice rigging settings from storage!");
                console.log(`Found settings: enabled=${storedEnabled}, color=${storedColor}, quantity=${storedQuantity}`);
                
                // Update our settings object
                rigSettings.enabled = true;
                rigSettings.color = storedColor;
                rigSettings.quantity = storedQuantity;
                
                // Apply rigging with a slight delay to ensure the DOM is ready
                setTimeout(() => {
                    applyRigging();
                    // Also apply multiple times to ensure it sticks through any page reloads/transitions
                    setTimeout(applyRigging, 100);
                    setTimeout(applyRigging, 500);
                    setTimeout(applyRigging, 1000);
                }, 10);
            } else {
                console.log("No stored dice settings found to restore.");
            }
        } catch (e) {
            console.error("Error restoring dice settings from storage:", e);
        }

        // Create a small icon in the corner of the page to show script status
        const statusIcon = document.createElement("div");
        statusIcon.id = "dice-mod-status";
        statusIcon.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 20px;
            height: 20px;
            background-color: #4CAF50;
            border-radius: 50%;
            z-index: 9999;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        `;
        statusIcon.title = "Dice Color Modifier is active";

        // Add click event to show more information
        statusIcon.addEventListener("click", () => {
            showNotification(
                `Dice Color Modifier v1.0\nConnection status: ${socket && socket.readyState === 1 ? "Connected" : "Trying to connect..."}\nFallback mode: ${pollingActive ? "Active" : "Inactive"}\nClick for debug info`,
                "#4CAF50",
                5000,
            );
        });

        document.body.appendChild(statusIcon);

        // Connect to WebSocket server
        connectWebSocket();

        // Setup observer for dice rolls
        setupDiceObserver();

        // Show initial notification that script is ready
        setTimeout(() => {
            showNotification(
                "Dice Color Modifier v1.0 is active! Use Discord bot commands to change dice colors. Colors will persist through your first roll.",
                "#4CAF50",
                5000,
            );
        }, 1000);
    }

    // Run when the document is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }
})();
