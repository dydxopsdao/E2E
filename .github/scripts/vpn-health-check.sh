#!/bin/bash
# VPN Health Check Script

set -e

check_vpn_connection() {
  echo "=== VPN Health Check ==="
  
  # Check NordLayer connection status
  echo "Checking NordLayer status..."
  if nordlayer status | grep -q "Connected"; then
    echo "✅ NordLayer reports connected status"
  else
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

# Auto-reconnect function
reconnect_vpn() {
  echo "Attempting to reconnect VPN..."
  MAX_ATTEMPTS=3
  
  for i in $(seq 1 $MAX_ATTEMPTS); do
    echo "Reconnection attempt $i of $MAX_ATTEMPTS"
    
    nordlayer disconnect || true
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
  done
  
  echo "❌ Failed to reconnect after $MAX_ATTEMPTS attempts"
  return 1
}

# Main execution logic
if ! check_vpn_connection; then
  echo "❌ VPN health check failed, attempting reconnection"
  reconnect_vpn
else
  echo "✅ VPN health check passed!"
fi 