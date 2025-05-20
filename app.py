from flask import Flask, jsonify, render_template, request
import socket
import time
import random
import string
import threading
import http.server
import socketserver
import urllib.request
from datetime import datetime
import json
import os
from werkzeug.urls import quote
url_quote = quote  

app = Flask(__name__)

class InternetSpeedTester:
    def __init__(self, server="google.com", port=80, test_file_size_mb=10):
        self.server = server
        self.port = port
        self.test_file_size_mb = test_file_size_mb
        self.local_server_port = 8000
        self.local_server = None
        self.server_thread = None
        self.results = {
            "timestamp": "",
            "ping_ms": 0,
            "download_mbps": 0,
            "upload_mbps": 0
        }
    
    def generate_random_data(self, size_mb):
        """Generate random data of specified size in MB."""
        size_bytes = int(size_mb * 1024 * 1024)
        # Generate random string data (reduced size for efficiency)
        chars = string.ascii_letters + string.digits
        # Using a shorter string but repeated to reach desired size
        base_string = ''.join(random.choice(chars) for _ in range(1024))
        repeats = size_bytes // 1024
        return (base_string * repeats).encode()[:size_bytes]
    
    def measure_ping(self, count=5):
        """Measure ping to the specified server."""
        total_time = 0
        successful_pings = 0
        results = []
        
        for i in range(count):
            try:
                # Create a socket connection
                start_time = time.time()
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(2.0)
                s.connect((self.server, self.port))
                s.close()
                end_time = time.time()
                
                # Calculate round trip time in milliseconds
                rtt = (end_time - start_time) * 1000
                total_time += rtt
                successful_pings += 1
                results.append({"index": i+1, "time": round(rtt, 2)})
                
            except (socket.timeout, socket.error) as e:
                results.append({"index": i+1, "error": str(e)})
        
        # Calculate average ping if any successful pings
        if successful_pings > 0:
            avg_ping = total_time / successful_pings
            self.results["ping_ms"] = round(avg_ping, 2)
            return {"average": round(avg_ping, 2), "details": results}
        else:
            return {"error": "All pings failed", "details": results}
    
    def start_local_server(self):
        """Start a local HTTP server to handle upload tests."""
        # In cloud environments like Render.com, we can't start a local server
        # So we'll simulate the upload instead
        return {"status": "success", "port": self.local_server_port, "note": "Using simulated upload in cloud environment"}
    
    def stop_local_server(self):
        """Stop the local HTTP server."""
        # No need to stop anything as we're simulating
        return {"status": "stopped"}
    
    def measure_download_speed(self):
        """Measure download speed."""
        # Use a public file for download testing
        url = "https://download.thinkbroadband.com/10MB.zip"
        
        try:
            start_time = time.time()
            
            # Download the file
            with urllib.request.urlopen(url) as response:
                data = response.read()
            
            end_time = time.time()
            
            # Calculate download time and speed
            download_time = end_time - start_time
            file_size_mb = len(data) / (1024 * 1024)  # Size in MB
            download_speed_mbps = (file_size_mb * 8) / download_time  # Convert to Mbps
            
            self.results["download_mbps"] = round(download_speed_mbps, 2)
            return {
                "size_mb": round(file_size_mb, 2),
                "time_seconds": round(download_time, 2),
                "speed_mbps": round(download_speed_mbps, 2)
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    def measure_upload_speed(self):
        """Measure upload speed (Simulated in cloud environment)."""
        try:
            # Generate random data to simulate upload
            upload_size_mb = min(self.test_file_size_mb, 5)  # Use smaller size for upload
            data = self.generate_random_data(upload_size_mb)
            
            # Simulate upload by measuring how long it takes to generate the data
            start_time = time.time()
            # Simulate network latency and bandwidth limitations
            time.sleep(upload_size_mb * 0.2)  # 200ms per MB as a rough simulation
            end_time = time.time()
            
            # Calculate upload time and speed
            upload_time = end_time - start_time
            upload_speed_mbps = (upload_size_mb * 8) / upload_time  # Convert to Mbps
            
            self.results["upload_mbps"] = round(upload_speed_mbps, 2)
            return {
                "size_mb": round(upload_size_mb, 2),
                "time_seconds": round(upload_time, 2),
                "speed_mbps": round(upload_speed_mbps, 2),
                "note": "This is a simulated upload test for cloud environments"
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    def run_speed_test(self):
        """Run the complete speed test."""
        self.results["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        ping_results = self.measure_ping()
        download_results = self.measure_download_speed()
        upload_results = self.measure_upload_speed()
        
        return {
            "timestamp": self.results["timestamp"],
            "ping": ping_results,
            "download": download_results,
            "upload": upload_results,
            "summary": {
                "ping_ms": self.results["ping_ms"],
                "download_mbps": self.results["download_mbps"],
                "upload_mbps": self.results["upload_mbps"]
            }
        }
    
    def save_results(self, filename="speed_test_results.json"):
        """Save the test results to a JSON file."""
        # For Render.com, we need to use a writable directory
        filepath = os.path.join('/tmp', filename)
        
        if os.path.exists(filepath):
            # Load existing results
            try:
                with open(filepath, 'r') as f:
                    results_history = json.load(f)
            except:
                results_history = []
        else:
            results_history = []
        
        # Add current results
        results_history.append(self.results)
        
        # Save updated results
        try:
            with open(filepath, 'w') as f:
                json.dump(results_history, f, indent=2)
            return {"status": "saved", "file": filepath}
        except Exception as e:
            return {"status": "error", "message": str(e)}


# Flask routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/test-ping', methods=['POST'])
def test_ping():
    data = request.get_json()
    server = data.get('server', 'google.com')
    port = int(data.get('port', 80))
    
    tester = InternetSpeedTester(server=server, port=port)
    result = tester.measure_ping()
    
    return jsonify(result)

@app.route('/api/test-download', methods=['POST'])
def test_download():
    data = request.get_json()
    file_size = float(data.get('file_size', 10))
    
    tester = InternetSpeedTester(test_file_size_mb=file_size)
    result = tester.measure_download_speed()
    
    return jsonify(result)

@app.route('/api/test-upload', methods=['POST'])
def test_upload():
    data = request.get_json()
    file_size = float(data.get('file_size', 5))
    
    tester = InternetSpeedTester(test_file_size_mb=file_size)
    result = tester.measure_upload_speed()
    
    return jsonify(result)

@app.route('/api/test-all', methods=['POST'])
def test_all():
    data = request.get_json()
    server = data.get('server', 'google.com')
    port = int(data.get('port', 80))
    file_size = float(data.get('file_size', 10))
    
    tester = InternetSpeedTester(server=server, port=port, test_file_size_mb=file_size)
    result = tester.run_speed_test()
    
    # Optionally save results
    if data.get('save', False):
        tester.save_results()
    
    return jsonify(result)

@app.route('/api/history', methods=['GET'])
def get_history():
    filename = "speed_test_results.json"
    filepath = os.path.join('/tmp', filename)
    
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r') as f:
                results_history = json.load(f)
            return jsonify(results_history)
        except:
            return jsonify([])
    else:
        return jsonify([])

# Create template and static directories if they don't exist
import os
os.makedirs('templates', exist_ok=True)
os.makedirs('static', exist_ok=True)
os.makedirs('static/js', exist_ok=True)
os.makedirs('static/css', exist_ok=True)

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
