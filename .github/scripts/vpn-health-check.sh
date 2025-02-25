#!/bin/bash
# VPN Health Check Script

set -e

# Function to fix socket permission issues
fix_socket_permissions() {
  echo "Checking NordLayer socket permissions..."
  
  # Check if socket exists
  if [ ! -S /run/nordlayer/nordlayer.sock ]; then
    echo "Socket file missing. Asking system to restart service..."
    sudo systemctl restart nordlayer.service
    sleep 5
  fi
  
  # Set appropriate permissions
  echo "Setting socket permissions..."
  sudo chmod -R 777 /run/nordlayer/
  sudo chmod 666 /run/nordlayer/nordlayer.sock 2>/dev/null || true
  
  # Check if socket now exists and has correct permissions
  if [ -S /run/nordlayer/nordlayer.sock ] && [ -r /run/nordlayer/nordlayer.sock ]; then
    echo "Socket exists and is readable"
    return 0
  else
    echo "Socket still has issues after permission fix"
    return 1
  fi
}

check_vpn_connection() {
  echo "=== VPN Health Check ==="
  
  # First, ensure socket permissions are correct
  if ! nordlayer status &>/dev/null; then
    echo "❌ NordLayer status command failed. Checking socket permissions..."
    
    # Try to fix the socket permissions
    if ! fix_socket_permissions; then
      echo "❌ Failed to fix socket permissions, service may need to be reinstalled"
      sudo systemctl status nordlayer.service
      return 1
    fi
  fi
  
  # Check NordLayer connection status again
  echo "Checking NordLayer status..."
  if nordlayer status 2>&1 | grep -q "Connected"; then
    echo "✅ NordLayer reports connected status"
  else
    # If we get here, the command ran but reported disconnected
    echo "❌ NordLayer reports disconnected status"
    return 1
  fi
  
  # Check current IP address
  echo "Checking IP address..."
  CURRENT_IP=$(curl -s ifconfig.me)
  if [ -z "$CURRENT_IP" ]; then
    echo "❌ Failed to get IP address"
    return 1
  else
    echo "✅ Current IP: $CURRENT_IP"
  fi
  
  # Test connection to dYdX domain
  echo "Testing connection to dYdX domain..."
  if curl -s --connect-timeout 10 https://trade.dydx.exchange > /dev/null; then
    echo "✅ Connection to trade.dydx.exchange succeeded"
  else
    echo "❌ Connection to trade.dydx.exchange failed"
    return 1
  fi
  
  # Check DNS resolution
  echo "Testing DNS resolution..."
  if nslookup trade.dydx.exchange > /dev/null; then
    echo "✅ DNS resolution working"
  else
    echo "❌ DNS resolution failed"
    return 1
  fi
  
  # Check for packet loss
  echo "Checking for packet loss..."
  PACKET_LOSS=$(ping -c 10 trade.dydx.exchange | grep -oP '\d+(?=% packet loss)')
  if [ -z "$PACKET_LOSS" ]; then
    echo "❌ Failed to determine packet loss"
    return 1
  elif [ "$PACKET_LOSS" -gt 20 ]; then
    echo "❌ High packet loss: $PACKET_LOSS%"
    return 1
  else
    echo "✅ Packet loss acceptable: $PACKET_LOSS%"
  fi
  
  # Check network latency
  echo "Checking network latency..."
  AVG_LATENCY=$(ping -c 5 trade.dydx.exchange | tail -1 | awk -F '/' '{print $5}')
  if [ -z "$AVG_LATENCY" ]; then
    echo "❌ Failed to determine latency"
    return 1
  elif (( $(echo "$AVG_LATENCY > 300" | bc -l) )); then
    echo "❌ High latency: ${AVG_LATENCY}ms"
    return 1
  else
    echo "✅ Latency acceptable: ${AVG_LATENCY}ms"
  fi
  
  echo "=== All VPN health checks passed ==="
  return 0
}

# Function that performs service reinstall if needed
reinstall_service() {
  echo "Attempting complete service reinstallation..."
  
  # Remove and reinstall the service
  sudo apt-get remove -y nordlayer
  sudo apt-get install -y nordlayer
  sudo systemctl daemon-reload
  sudo systemctl restart nordlayer.service
  sleep 5
  
  # Set permissions again
  sudo chmod -R 777 /run/nordlayer/
  if [ -S /run/nordlayer/nordlayer.sock ]; then
    sudo chmod 666 /run/nordlayer/nordlayer.sock
  fi
  
  # Check if the service is now working
  if nordlayer status &>/dev/null; then
    echo "✅ Service reinstalled successfully"
    return 0
  else
    echo "❌ Service still not working after reinstall"
    return 1
  fi
}

# Auto-reconnect function with socket fixes
reconnect_vpn() {
  echo "Attempting to reconnect VPN..."
  MAX_ATTEMPTS=3
  
  # First fix the socket if needed
  if ! nordlayer status &>/dev/null; then
    echo "Socket issues detected, attempting to fix first..."
    fix_socket_permissions
    
    # If still not working, try reinstalling
    if ! nordlayer status &>/dev/null; then
      echo "Socket still not working, attempting service reinstall..."
      if ! reinstall_service; then
        echo "❌ Fatal error: Could not fix NordLayer service"
        return 1
      fi
    fi
  fi
  
  for i in $(seq 1 $MAX_ATTEMPTS); do
    echo "Reconnection attempt $i of $MAX_ATTEMPTS"
    
    # Try to disconnect gracefully, but continue even if it fails
    nordlayer disconnect 2>/dev/null || echo "[-] Disconnecting... (ignore errors)"
    sleep 5
    
    if nordlayer connect "dos-server-BQG2cKQV"; then
      echo "✅ Reconnection successful"
      sleep 10  # Allow connection to stabilize
      
      if check_vpn_connection; then
        echo "✅ VPN health checks passed after reconnection"
        return 0
      fi
    fi
    
    echo "❌ Reconnection attempt $i failed"
    sleep 5
    
    # If we're on the last attempt and still failing, try a service restart
    if [ $i -eq $MAX_ATTEMPTS ]; then
      echo "Final attempt - trying with service restart"
      sudo systemctl restart nordlayer.service
      sleep 5
      fix_socket_permissions
      
      # One last attempt after restart
      nordlayer disconnect 2>/dev/null || true
      sleep 2
      if nordlayer connect "dos-server-BQG2cKQV"; then
        echo "✅ Final reconnection attempt succeeded after service restart"
        sleep 10
        if check_vpn_connection; then
          echo "✅ VPN health checks passed after final reconnection"
          return 0
        fi
      fi
    fi
  done
  
  echo "❌ Failed to reconnect after $MAX_ATTEMPTS attempts"
  return 1
}

# Function to collect diagnostic information 
collect_diagnostics() {
  echo "=== Collecting VPN Diagnostics ==="
  echo "Socket file status:"
  ls -la /run/nordlayer/ || echo "Cannot access /run/nordlayer/"
  
  echo "Service status:"
  sudo systemctl status nordlayer.service || echo "Cannot get service status"
  
  echo "Network interfaces:"
  ip addr || echo "Cannot list network interfaces"
  
  echo "Routing table:"
  ip route || echo "Cannot list routing table"
  
  echo "Current user and groups:"
  id
  
  echo "NordLayer logs:"
  sudo journalctl -u nordlayer.service --no-pager -n 30 || echo "Cannot access logs"
  
  echo "=== End of Diagnostics ==="
}

# Main execution logic
if ! check_vpn_connection; then
  echo "❌ VPN health check failed, attempting reconnection"
  if ! reconnect_vpn; then
    echo "❌ VPN reconnection failed, collecting diagnostics..."
    collect_diagnostics
    exit 1
  fi
else
  echo "✅ VPN health check passed!"
fi 