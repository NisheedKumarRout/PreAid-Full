document.addEventListener('DOMContentLoaded', function () {
    const healthIssueInput = document.getElementById('health-issue');
    const getAdviceButton = document.getElementById('get-advice');
    const adviceResult = document.getElementById('advice-result');
    const currentYearElement = document.getElementById('current-year');
    const themeToggle = document.getElementById('theme-toggle');

    currentYearElement.textContent = new Date().getFullYear();

    // Simple health advice database
    const healthAdvice = {
        'headache': 'Rest in a quiet, dark room. Stay hydrated. Apply a cold compress to your forehead. Consider over-the-counter pain relievers if needed.',
        'nosebleed': 'Sit upright and lean forward. Pinch the soft part of your nose for 10 minutes. Apply ice to the bridge of your nose. Avoid tilting your head back.',
        'cut': 'Clean the wound with water. Apply pressure with a clean cloth to stop bleeding. Cover with a bandage once bleeding stops.',
        'burn': 'Cool the burn with cold water for 10-20 minutes. Do not use ice. Cover with a clean, dry cloth. Seek medical help for severe burns.',
        'fever': 'Rest and stay hydrated. Take temperature regularly. Use fever-reducing medication if needed. Seek medical help if fever is very high.',
        'cough': 'Stay hydrated. Use honey to soothe throat. Rest and avoid irritants. See a doctor if cough persists or worsens.',
        'sore throat': 'Gargle with warm salt water. Stay hydrated. Use throat lozenges. Rest your voice. See a doctor if severe or persistent.'
    };

    // Theme management
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDarkMode ? 'dark' : 'light');
    }

    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    });

    // History management
    function getHistory() {
        return JSON.parse(localStorage.getItem('preaid-history') || '[]');
    }

    function saveHistory(history) {
        localStorage.setItem('preaid-history', JSON.stringify(history));
    }

    function addToHistory(issue, advice) {
        const history = getHistory();
        history.push({
            issue,
            advice,
            timestamp: new Date().toISOString()
        });
        saveHistory(history);
        loadHistoryPanel();
    }

    function loadHistoryPanel() {
        const history = getHistory();
        if (history.length > 0) {
            showHistoryPanel(history);
        }
    }

    function showHistoryPanel(history) {
        let historyPanel = document.getElementById('history-panel');
        if (!historyPanel) {
            historyPanel = document.createElement('div');
            historyPanel.id = 'history-panel';
            historyPanel.className = 'history-panel';
            document.querySelector('.form-container').appendChild(historyPanel);
        }
        
        const recentHistory = history.slice(-5).reverse();
        historyPanel.innerHTML = `
            <div class="history-header">
                <h3>Recent Consultations</h3>
                ${history.length >= 2 ? `<button id="analyze-history-btn" class="analyze-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 3v18h18"/>
                        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                    </svg>
                    Analyze Patterns
                </button>` : ''}
            </div>
            <div class="history-items">
                ${recentHistory.map((item, index) => `
                    <div class="history-item">
                        <div class="history-content" onclick="fillInput('${item.issue}')">
                            <div class="history-issue">${item.issue}</div>
                            <div class="history-date">${new Date(item.timestamp).toLocaleDateString()}</div>
                        </div>
                        <div class="history-actions">
                            <button class="history-btn delete-btn" onclick="deleteHistory(${history.length - 1 - index})" title="Delete">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                    <line x1="10" y1="11" x2="10" y2="17"/>
                                    <line x1="14" y1="11" x2="14" y2="17"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        const analyzeBtn = document.getElementById('analyze-history-btn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', analyzeHealthHistory);
        }
    }

    window.fillInput = function(issue) {
        healthIssueInput.value = issue;
        healthIssueInput.focus();
    }

    window.deleteHistory = function(index) {
        if (confirm('Delete this consultation?')) {
            const history = getHistory();
            history.splice(index, 1);
            saveHistory(history);
            loadHistoryPanel();
        }
    }

    function analyzeHealthHistory() {
        const history = getHistory();
        const issues = history.map(h => h.issue.toLowerCase());
        const issueCount = {};
        
        issues.forEach(issue => {
            issueCount[issue] = (issueCount[issue] || 0) + 1;
        });

        const mostCommon = Object.entries(issueCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);

        const analysis = `
            <h4>Health Pattern Analysis</h4>
            <p><strong>Total Consultations:</strong> ${history.length}</p>
            <p><strong>Most Common Issues:</strong></p>
            <ul>
                ${mostCommon.map(([issue, count]) => `<li>${issue} (${count} times)</li>`).join('')}
            </ul>
            <p><strong>Recommendations:</strong></p>
            <ul>
                <li>Keep track of triggers for recurring issues</li>
                <li>Consider lifestyle changes for prevention</li>
                <li>Consult a healthcare professional for persistent problems</li>
            </ul>
        `;

        showAnalysisResult(analysis, history.length);
    }

    function showAnalysisResult(analysis, totalConsultations) {
        const analysisHTML = `
            <div class="result-header">
                <div class="hex-icon" style="width: 32px; height: 28px; margin-right: 10px;">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon" style="width: 16px; height: 16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <h3 class="result-title">Health Pattern Analysis</h3>
            </div>
            <div class="result-content">${analysis}</div>
            <div class="disclaimer-note">
                <b>Note:</b> This is a basic analysis. Consult healthcare professionals for medical advice.
            </div>
        `;
        
        adviceResult.innerHTML = analysisHTML;
        adviceResult.classList.add('show');
        adviceResult.scrollIntoView({ behavior: 'smooth' });
    }

    function getHealthAdvice(issue) {
        const lowerIssue = issue.toLowerCase();
        
        // Find matching advice
        for (const [key, advice] of Object.entries(healthAdvice)) {
            if (lowerIssue.includes(key)) {
                return advice;
            }
        }
        
        return 'Please describe your symptoms more specifically. For serious conditions, consult a healthcare professional immediately.';
    }

    function displayAdvice(advice, query) {
        const adviceHTML = `
            <div class="result-header">
                <div class="hex-icon" style="width: 32px; height: 28px; margin-right: 10px;">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon" style="width: 16px; height: 16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 class="result-title">Health Advice for "${query}"</h3>
            </div>
            <div class="result-content">
                <p>${advice}</p>
            </div>
            <div class="disclaimer-note">
                <b>Note:</b> This is basic first aid information. Always consult healthcare professionals for medical advice.
            </div>
        `;

        adviceResult.innerHTML = adviceHTML;
        adviceResult.classList.add('show');
    }

    function showError(msg) {
        adviceResult.innerHTML = `
            <div class="warning">
                <div class="warning-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <div class="warning-message">${msg}</div>
            </div>
        `;
        adviceResult.classList.add('show');
    }

    getAdviceButton.addEventListener('click', function () {
        const healthIssue = healthIssueInput.value.trim();
        if (!healthIssue) {
            showError("Please describe your health issue to get advice.");
            return;
        }

        const advice = getHealthAdvice(healthIssue);
        displayAdvice(advice, healthIssue);
        addToHistory(healthIssue, advice);
    });

    healthIssueInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') getAdviceButton.click();
    });

    loadHistoryPanel();
});