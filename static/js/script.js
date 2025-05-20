document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const serverInput = document.getElementById('serverInput');
    const portInput = document.getElementById('portInput');
    const fileSizeInput = document.getElementById('fileSizeInput');
    const runAllBtn = document.getElementById('runAllBtn');
    const pingBtn = document.getElementById('pingBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const historyBtn = document.getElementById('historyBtn');
    const testingAlert = document.getElementById('testingAlert');
    const resultsSection = document.getElementById('resultsSection');
    const historySection = document.getElementById('historySection');
    
    // Results elements
    const pingResult = document.getElementById('pingResult');
    const downloadResult = document.getElementById('downloadResult');
    const uploadResult = document.getElementById('uploadResult');
    const pingDetailsContent = document.getElementById('pingDetailsContent');
    const downloadDetailsContent = document.getElementById('downloadDetailsContent');
    const uploadDetailsContent = document.getElementById('uploadDetailsContent');
    const historyTableBody = document.getElementById('historyTableBody');
    
    // Event Listeners
    pingBtn.addEventListener('click', testPing);
    downloadBtn.addEventListener('click', testDownload);
    uploadBtn.addEventListener('click', testUpload);
    runAllBtn.addEventListener('click', testAll);
    historyBtn.addEventListener('click', showHistory);
    
    // Function to show testing status
    function showTesting() {
        testingAlert.classList.remove('d-none');
        resultsSection.classList.add('d-none');
        historySection.classList.add('d-none');
    }
    
    // Function to hide testing status
    function hideTesting() {
        testingAlert.classList.add('d-none');
    }
    
    // Function to show results
    function showResults() {
        resultsSection.classList.remove('d-none');
        historySection.classList.add('d-none');
    }
    
    // Test ping
    async function testPing() {
        showTesting();
        
        try {
            const response = await fetch('/api/test-ping', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    server: serverInput.value,
                    port: portInput.value
                })
            });
            
            const data = await response.json();
            
            // Display ping result
            if (data.average) {
                pingResult.textContent = data.average;
                
                // Create details table
                let detailsHTML = '<table class="table table-sm">';
                detailsHTML += '<thead><tr><th>#</th><th>Time (ms)</th></tr></thead><tbody>';
                
                data.details.forEach(detail => {
                    detailsHTML += '<tr>';
                    detailsHTML += `<td>${detail.index}</td>`;
                    if (detail.time) {
                        detailsHTML += `<td>${detail.time} ms</td>`;
                    } else {
                        detailsHTML += `<td class="text-error">Error: ${detail.error}</td>`;
                    }
                    detailsHTML += '</tr>';
                });
                
                detailsHTML += '</tbody></table>';
                pingDetailsContent.innerHTML = detailsHTML;
            } else {
                pingResult.textContent = 'Error';
                pingDetailsContent.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
            }
            
            showResults();
        } catch (error) {
            pingResult.textContent = 'Error';
            pingDetailsContent.innerHTML = `<div class="alert alert-danger">Failed to complete ping test: ${error.message}</div>`;
            showResults();
        } finally {
            hideTesting();
        }
    }
    
    // Test download
    async function testDownload() {
        showTesting();
        
        try {
            const response = await fetch('/api/test-download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    file_size: fileSizeInput.value
                })
            });
            
            const data = await response.json();
            
            // Display download result
            if (data.speed_mbps) {
                downloadResult.textContent = data.speed_mbps;
                
                // Create details
                let detailsHTML = '<div class="card-body">';
                detailsHTML += `<p><strong>File Size:</strong> ${data.size_mb} MB</p>`;
                detailsHTML += `<p><strong>Download Time:</strong> ${data.time_seconds} seconds</p>`;
                detailsHTML += `<p><strong>Speed:</strong> ${data.speed_mbps} Mbps</p>`;
                detailsHTML += '</div>';
                
                downloadDetailsContent.innerHTML = detailsHTML;
            } else {
                downloadResult.textContent = 'Error';
                downloadDetailsContent.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
            }
            
            showResults();
        } catch (error) {
            downloadResult.textContent = 'Error';
            downloadDetailsContent.innerHTML = `<div class="alert alert-danger">Failed to complete download test: ${error.message}</div>`;
            showResults();
        } finally {
            hideTesting();
        }
    }
    
    // Test upload
    async function testUpload() {
        showTesting();
        
        try {
            const response = await fetch('/api/test-upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    file_size: Math.min(fileSizeInput.value, 5) // Cap at 5MB
                })
            });
            
            const data = await response.json();
            
            // Display upload result
            if (data.speed_mbps) {
                uploadResult.textContent = data.speed_mbps;
                
                // Create details
                let detailsHTML = '<div class="card-body">';
                detailsHTML += `<p><strong>File Size:</strong> ${data.size_mb} MB</p>`;
                detailsHTML += `<p><strong>Upload Time:</strong> ${data.time_seconds} seconds</p>`;
                detailsHTML += `<p><strong>Speed:</strong> ${data.speed_mbps} Mbps</p>`;
                detailsHTML += '</div>';
                
                uploadDetailsContent.innerHTML = detailsHTML;
            } else {
                uploadResult.textContent = 'Error';
                uploadDetailsContent.innerHTML = `<div class="alert alert-danger">${data.error || 'Upload test failed'}</div>`;
                if (data.details) {
                    uploadDetailsContent.innerHTML += `<div class="mt-2"><pre>${JSON.stringify(data.details, null, 2)}</pre></div>`;
                }
            }
            
            showResults();
        } catch (error) {
            uploadResult.textContent = 'Error';
            uploadDetailsContent.innerHTML = `<div class="alert alert-danger">Failed to complete upload test: ${error.message}</div>`;
            showResults();
        } finally {
            hideTesting();
        }
    }
    
    // Test all
    async function testAll() {
        showTesting();
        
        try {
            const response = await fetch('/api/test-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    server: serverInput.value,
                    port: portInput.value,
                    file_size: fileSizeInput.value,
                    save: true
                })
            });
            
            const data = await response.json();
            
            // Display results
            if (data.summary) {
                // Ping
                pingResult.textContent = data.summary.ping_ms;
                let pingDetailsHTML = '<table class="table table-sm">';
                pingDetailsHTML += '<thead><tr><th>#</th><th>Time (ms)</th></tr></thead><tbody>';
                
                if (data.ping && data.ping.details) {
                    data.ping.details.forEach(detail => {
                        pingDetailsHTML += '<tr>';
                        pingDetailsHTML += `<td>${detail.index}</td>`;
                        if (detail.time) {
                            pingDetailsHTML += `<td>${detail.time} ms</td>`;
                        } else {
                            pingDetailsHTML += `<td class="text-error">Error: ${detail.error}</td>`;
                        }
                        pingDetailsHTML += '</tr>';
                    });
                }
                
                pingDetailsHTML += '</tbody></table>';
                pingDetailsContent.innerHTML = pingDetailsHTML;
                
                // Download
                downloadResult.textContent = data.summary.download_mbps;
                if (data.download) {
                    let downloadDetailsHTML = '<div class="card-body">';
                    
                    if (data.download.size_mb) {
                        downloadDetailsHTML += `<p><strong>File Size:</strong> ${data.download.size_mb} MB</p>`;
                        downloadDetailsHTML += `<p><strong>Download Time:</strong> ${data.download.time_seconds} seconds</p>`;
                        downloadDetailsHTML += `<p><strong>Speed:</strong> ${data.download.speed_mbps} Mbps</p>`;
                    } else {
                        downloadDetailsHTML += `<div class="alert alert-danger">${data.download.error || 'Download test failed'}</div>`;
                    }
                    
                    downloadDetailsHTML += '</div>';
                    downloadDetailsContent.innerHTML = downloadDetailsHTML;
                }
                
                // Upload
                uploadResult.textContent = data.summary.upload_mbps;
                if (data.upload) {
                    let uploadDetailsHTML = '<div class="card-body">';
                    
                    if (data.upload.size_mb) {
                        uploadDetailsHTML += `<p><strong>File Size:</strong> ${data.upload.size_mb} MB</p>`;
                        uploadDetailsHTML += `<p><strong>Upload Time:</strong> ${data.upload.time_seconds} seconds</p>`;
                        uploadDetailsHTML += `<p><strong>Speed:</strong> ${data.upload.speed_mbps} Mbps</p>`;
                    } else {
                        uploadDetailsHTML += `<div class="alert alert-danger">${data.upload.error || 'Upload test failed'}</div>`;
                        if (data.upload.details) {
                            uploadDetailsHTML += `<div class="mt-2"><pre>${JSON.stringify(data.upload.details, null, 2)}</pre></div>`;
                        }
                    }
                    
                    uploadDetailsHTML += '</div>';
                    uploadDetailsContent.innerHTML = uploadDetailsHTML;
                }
            } else {
                pingResult.textContent = 'Error';
                downloadResult.textContent = 'Error';
                uploadResult.textContent = 'Error';
                pingDetailsContent.innerHTML = '<div class="alert alert-danger">Test failed</div>';
                downloadDetailsContent.innerHTML = '<div class="alert alert-danger">Test failed</div>';
                uploadDetailsContent.innerHTML = '<div class="alert alert-danger">Test failed</div>';
            }
            
            showResults();
        } catch (error) {
            pingResult.textContent = 'Error';
            downloadResult.textContent = 'Error';
            uploadResult.textContent = 'Error';
            pingDetailsContent.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
            downloadDetailsContent.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
            uploadDetailsContent.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
            showResults();
        } finally {
            hideTesting();
        }
    }
    
    // Show history
    async function showHistory() {
        showTesting();
        
        try {
            const response = await fetch('/api/history');
            const data = await response.json();
            
            if (data && data.length > 0) {
                let tableHTML = '';
                
                data.forEach(entry => {
                    tableHTML += '<tr>';
                    tableHTML += `<td>${entry.timestamp}</td>`;
                    tableHTML += `<td>${entry.ping_ms}</td>`;
                    tableHTML += `<td>${entry.download_mbps}</td>`;
                    tableHTML += `<td>${entry.upload_mbps}</td>`;
                    tableHTML += '</tr>';
                });
                
                historyTableBody.innerHTML = tableHTML;
            } else {
                historyTableBody.innerHTML = '<tr><td colspan="4" class="text-center">No history available</td></tr>';
            }
            
            hideTesting();
            resultsSection.classList.add('d-none');
            historySection.classList.remove('d-none');
        } catch (error) {
            historyTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-error">Failed to load history: ${error.message}</td></tr>`;
            hideTesting();
            resultsSection.classList.add('d-none');
            historySection.classList.remove('d-none');
        }
    }
});
