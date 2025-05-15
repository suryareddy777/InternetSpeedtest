document.addEventListener('DOMContentLoaded', function() {
    // Initialize tabs
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Hide all tabs and remove active class
            tabContents.forEach(tab => {
                tab.classList.remove('active');
            });
            
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected tab and add active class
            document.getElementById(tabId).classList.add('active');
            button.classList.add('active');
            
            // Load history data if history tab is selected
            if (tabId === 'history') {
                loadHistoryData();
            }
        });
    });

    // Initialize gauges
    const pingGauge = new Gauge(document.getElementById('ping-gauge')).setOptions({
        angle: 0.15,
        lineWidth: 0.44,
        radiusScale: 1,
        pointer: {
            length: 0.6,
            strokeWidth: 0.035,
            color: '#000000'
        },
        limitMax: false,
        limitMin: false,
        colorStart: '#6FADCF',
        colorStop: '#8FC0DA',
        strokeColor: '#E0E0E0',
        generateGradient: true,
        highDpiSupport: true,
        percentColors: [[0.0, "#2ecc71"], [0.50, "#f39c12"], [1.0, "#e74c3c"]]
    });
    pingGauge.maxValue = 200;
    pingGauge.setMinValue(0);
    pingGauge.animationSpeed = 32;
    pingGauge.set(0);

    const downloadGauge = new Gauge(document.getElementById('download-gauge')).setOptions({
        angle: 0.15,
        lineWidth: 0.44,
        radiusScale: 1,
        pointer: {
            length: 0.6,
            strokeWidth: 0.035,
            color: '#000000'
        },
        limitMax: false,
        limitMin: false,
        colorStart: '#6FADCF',
        colorStop: '#8FC0DA',
        strokeColor: '#E0E0E0',
        generateGradient: true,
        highDpiSupport: true,
        percentColors: [[0.0, "#e74c3c"], [0.50, "#f39c12"], [1.0, "#2ecc71"]]
    });
    downloadGauge.maxValue = 100;
    downloadGauge.setMinValue(0);
    downloadGauge.animationSpeed = 32;
    downloadGauge.set(0);

    const uploadGauge = new Gauge(document.getElementById('upload-gauge')).setOptions({
        angle: 0.15,
        lineWidth: 0.44,
        radiusScale: 1,
        pointer: {
            length: 0.6,
            strokeWidth: 0.035,
            color: '#000000'
        },
        limitMax: false,
        limitMin: false,
        colorStart: '#6FADCF',
        colorStop: '#8FC0DA',
        strokeColor: '#E0E0E0',
        generateGradient: true,
        highDpiSupport: true,
        percentColors: [[0.0, "#e74c3c"], [0.50, "#f39c12"], [1.0, "#2ecc71"]]
    });
    uploadGauge.maxValue = 50;
    uploadGauge.setMinValue(0);
    uploadGauge.animationSpeed = 32;
    uploadGauge.set(0);

    // Run test button click handler
    document.getElementById('run-test').addEventListener('click', runSpeedTest);

    // Run speed test function
    function runSpeedTest() {
        // Get settings
        const server = document.getElementById('server').value;
        const port = parseInt(document.getElementById('port').value);
        const fileSize = parseFloat(document.getElementById('file-size').value);
        
        // Show progress
        document.getElementById('no-results-message').style.display = 'none';
        document.getElementById('test-results').style.display = 'none';
        document.getElementById('test-progress').style.display = 'block';
        document.getElementById('progress-bar').style.width = '0%';
        document.getElementById('progress-status').textContent = 'Starting test...';
        
        // Simulate progress updates
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 5;
            if (progress <= 100) {
                document.getElementById('progress-bar').style.width = progress + '%';
                
                if (progress < 25) {
                    document.getElementById('progress-status').textContent = 'Testing ping...';
                } else if (progress < 60) {
                    document.getElementById('progress-status').textContent = 'Testing download speed...';
                } else if (progress < 90) {
                    document.getElementById('progress-status').textContent = 'Testing upload speed...';
                } else {
                    document.getElementById('progress-status').textContent = 'Finalizing results...';
                }
            }
        }, 300);
        
        // Run actual test
        fetch('/api/test-all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                server: server,
                port: port,
                file_size: fileSize,
                save: true
            })
        })
        .then(response => response.json())
        .then(data => {
            // Stop progress simulation
            clearInterval(progressInterval);
            document.getElementById('progress-bar').style.width = '100%';
            
            // Display results
            setTimeout(() => {
                document.getElementById('test-progress').style.display = 'none';
                document.getElementById('test-results').style.display = 'block';
                
                // Update gauges
                pingGauge.set(data.summary.ping_ms);
                downloadGauge.set(data.summary.download_mbps);
                uploadGauge.set(data.summary.upload_mbps);
                
                // Update text values
                document.getElementById('ping-value').textContent = data.summary.ping_ms + ' ms';
                document.getElementById('download-value').textContent = data.summary.download_mbps + ' Mbps';
                document.getElementById('upload-value').textContent = data.summary.upload_mbps + ' Mbps';
                
                // Update details
                document.getElementById('test-timestamp').textContent = data.timestamp;
                document.getElementById('test-server').textContent = server + ':' + port;
            }, 500);
        })
        .catch(error => {
            clearInterval(progressInterval);
            document.getElementById('progress-status').textContent = 'Error: ' + error.message;
        });
    }
    
    // Function to load history data
    function loadHistoryData() {
        fetch('/api/history')
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                document.getElementById('no-history-message').style.display = 'none';
                document.querySelector('.chart-container').style.display = 'block';
                updateHistoryChart(data);
            } else {
                document.getElementById('no-history-message').style.display = 'block';
                document.querySelector('.chart-container').style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error loading history:', error);
        });
    }
    
    // Function to update history chart
    function updateHistoryChart(data) {
        const ctx = document.getElementById('history-chart').getContext('2d');
        
        // Extract data for chart
        const labels = data.map(item => {
            // Convert timestamp to shorter format
            const date = new Date(item.timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        });
        
        const pingData = data.map(item => item.ping_ms);
        const downloadData = data.map(item => item.download_mbps);
        const uploadData = data.map(item => item.upload_mbps);
        
        // Destroy existing chart if it exists
        if (window.historyChart) {
            window.historyChart.destroy();
        }
        
        // Create new chart
        window.historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ping (ms)',
                        data: pingData,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y-ping'
                    },
                    {
                        label: 'Download (Mbps)',
                        data: downloadData,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y-speed'
                    },
                    {
                        label: 'Upload (Mbps)',
                        data: uploadData,
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y-speed'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Speed Test History'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                    },
                    'y-ping': {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false,
                        },
                        title: {
                            display: true,
                            text: 'Ping (ms)'
                        },
                        min: 0
                    },
                    'y-speed': {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Speed (Mbps)'
                        },
                        min: 0
                    }
                }
            }
        });
    }
});