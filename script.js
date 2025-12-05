// Initialize with current time and update timezone info
document.addEventListener('DOMContentLoaded', function() {
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    updateTimezoneInfo();
    
    const now = new Date();
    const localDateTime = formatDateTimeForInput(now);
    document.getElementById('datetimeInput').value = localDateTime;
    
    // Set default "from" zone to user's local timezone
    try {
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const fromZoneSelect = document.getElementById('fromZone');
        for (let i = 0; i < fromZoneSelect.options.length; i++) {
            if (fromZoneSelect.options[i].value === userTimeZone) {
                fromZoneSelect.selectedIndex = i;
                break;
            }
        }
    } catch (e) {
        console.log("Couldn't detect user timezone", e);
    }

    // Add welcome message to chat
    appendMessage("Assistant", "Hello! I'm your Time Zone Assistant. Ask me anything about time zones, conversions, or daylight saving time.");
});

function formatDateTimeForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function updateCurrentTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    };
    const currentTimeStr = new Intl.DateTimeFormat('en-US', options).format(now);
    document.getElementById('currentTime').textContent = `Current local time: ${currentTimeStr}`;
}

function updateTimezoneInfo() {
    const fromZone = document.getElementById("fromZone").value;
    const toZone = document.getElementById("toZone").value;
    
    const fromTzInfo = getTimezoneInfo(fromZone);
    const toTzInfo = getTimezoneInfo(toZone);
    
    document.getElementById("fromTzInfo").textContent = fromTzInfo;
    document.getElementById("toTzInfo").textContent = toTzInfo;
}

function getTimezoneInfo(timeZone) {
    try {
        const now = new Date();
        const options = { 
            timeZone, 
            timeZoneName: 'long' 
        };
        const tzName = new Intl.DateTimeFormat('en-US', options)
            .formatToParts(now)
            .find(part => part.type === 'timeZoneName').value;
        
        const offset = new Intl.DateTimeFormat('en-US', {
            timeZone,
            timeZoneName: 'shortOffset'
        }).formatToParts(now)
        .find(part => part.type === 'timeZoneName').value;
        
        return `${tzName} (${offset})`;
    } catch (e) {
        console.error("Error getting timezone info", e);
        return "";
    }
}

function showLoading(show) {
    document.getElementById('loadingIndicator').style.display = show ? 'block' : 'none';
}

function convertTime() {
    const datetimeInput = document.getElementById("datetimeInput").value;
    const fromZone = document.getElementById("fromZone").value;
    const toZone = document.getElementById("toZone").value;

    if (!datetimeInput) {
        alert("Please enter a valid date and time.");
        return;
    }

    showLoading(true);
    
    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
        try {
            // Create date object from input (local time)
            const date = new Date(datetimeInput);
            
            // Format options for detailed display
            const detailedOptions = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'long'
            };
            
            // Format options for short display
            const shortOptions = {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
            };
            
            // Get timezone info
            const fromTzInfo = getTimezoneInfo(fromZone);
            const toTzInfo = getTimezoneInfo(toZone);
            
            // Format times
            const fromTimeLong = new Intl.DateTimeFormat('en-US', {
                ...detailedOptions,
                timeZone: fromZone
            }).format(date);
            
            const fromTimeShort = new Intl.DateTimeFormat('en-US', {
                ...shortOptions,
                timeZone: fromZone
            }).format(date);
            
            const toTimeLong = new Intl.DateTimeFormat('en-US', {
                ...detailedOptions,
                timeZone: toZone
            }).format(date);
            
            const toTimeShort = new Intl.DateTimeFormat('en-US', {
                ...shortOptions,
                timeZone: toZone
            }).format(date);
            
            // Calculate time difference
            const fromOffset = getTimezoneOffset(date, fromZone);
            const toOffset = getTimezoneOffset(date, toZone);
            const diffHours = (toOffset - fromOffset) / 60;
            
            // Display results
            document.getElementById("convertedTime").innerHTML = `
                <strong>${toTimeShort}</strong><br>
                <small>${toTzInfo}</small>
            `;
            
            document.getElementById("timeDetails").innerHTML = `
                <p><strong>Original Time (${fromZone.split('/').pop()}):</strong><br>
                ${fromTimeLong}</p>
                
                <p><strong>Converted Time (${toZone.split('/').pop()}):</strong><br>
                ${toTimeLong}</p>
                
                <p><strong>Time Difference:</strong><br>
                ${diffHours >= 0 ? '+' : ''}${diffHours} hours</p>
                
                <p><strong>Equivalent:</strong><br>
                When it's ${fromTimeShort} in ${fromZone.split('/').pop()},<br>
                it's ${toTimeShort} in ${toZone.split('/').pop()}</p>
            `;
            
            // Update the timezone info displays
            document.getElementById("fromTzInfo").textContent = fromTzInfo;
            document.getElementById("toTzInfo").textContent = toTzInfo;
            
        } catch (error) {
            document.getElementById("convertedTime").textContent = "Error converting time";
            document.getElementById("timeDetails").innerHTML = `
                <p style="color: #ff5555">Error: ${error.message}</p>
            `;
            console.error("Conversion error:", error);
        } finally {
            showLoading(false);
        }
    }, 50);
}

function getTimezoneOffset(date, timeZone) {
    const options = { timeZone, timeZoneName: 'longOffset' };
    const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
    const tzPart = parts.find(part => part.type === 'timeZoneName');
    if (!tzPart) return 0;
    
    const offsetStr = tzPart.value.replace(/^GMT/, '').trim();
    if (!offsetStr) return 0;
    
    const [hours, minutes] = offsetStr.split(':').map(Number);
    return hours * 60 + (hours < 0 ? -minutes : minutes);
}

function useCurrentTime() {
    const now = new Date();
    const localDateTime = formatDateTimeForInput(now);
    document.getElementById('datetimeInput').value = localDateTime;
    convertTime();
}

function swapTimeZones() {
    const fromZone = document.getElementById("fromZone");
    const toZone = document.getElementById("toZone");
    const temp = fromZone.value;
    fromZone.value = toZone.value;
    toZone.value = temp;
    updateTimezoneInfo();
    convertTime();
}

// Update timezone info when selections change
document.getElementById("fromZone").addEventListener("change", updateTimezoneInfo);
document.getElementById("toZone").addEventListener("change", updateTimezoneInfo);

// Chatbot functionality
const chatbox = document.getElementById("chatbox");
const API_KEY = "AIzaSyA6Oho_qvebmmzbbsf-sMlTIPCrrI7elR4";

function appendMessage(sender, text) {
    const msg = document.createElement("div");
    msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatbox.appendChild(msg);
    chatbox.scrollTop = chatbox.scrollHeight;
    return msg;
}

function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

async function sendMessage() {
    const input = document.getElementById("chatInput");
    const message = input.value.trim();
    if (!message) return;

    appendMessage("You", message);
    input.value = "";

    // Disable button to prevent spam
    const sendBtn = document.getElementById("sendBtn");
    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";

    const assistantMsg = appendMessage("Assistant", "Thinking...");

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: message
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1000,
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error:", errorData);
            throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log("API Response:", data);

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response. Please try again.";
        assistantMsg.innerHTML = `<strong>Assistant:</strong> ${reply}`;

    } catch (error) {
        console.error("Detailed Error:", error);
        assistantMsg.innerHTML = `<strong>Assistant:</strong> Error: ${error.message}. Please try again.`;
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = "Send";
    }
}
