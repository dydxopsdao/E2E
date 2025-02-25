#!/bin/bash
# Optimized VPN Health Check Script

set -e

# Function to quickly fix socket permission issues
fix_socket_permissions() {
  if [ ! -S /run/nordlayer/nordlayer.sock ]; then
    sudo systemctl restart nordlayer.service
    sleep 1
  fi
  
  sudo chmod -R 777 /run/nordlayer/
  sudo chmod 666 /run/nordlayer/nordlayer.sock 2>/dev/null || true
  
  # Quick check
  if [ -S /run/nordlayer/nordlayer.sock ] && [ -r /run/nordlayer/nordlayer.sock ]; then
    return 0
  else
    return 1
  fi
}

# Fast VPN connection check
check_vpn_connection() {
  # Ensure socket permissions are correct
  if ! nordlayer status &>/dev/null; then
    fix_socket_permissions
  fi
  
  # Quick status check
  if ! nordlayer status 2>&1 | grep -q "Connected"; then
    return 1
  fi
  
  # Check current IP (with timeout to prevent hanging)
  EXPECTED_IP="94.101.112.199"
  CURRENT_IP=$(curl -s --max-time 3 ifconfig.me)
  
  if [ -z "$CURRENT_IP" ]; then
    return 1
  elif [ "$CURRENT_IP" != "$EXPECTED_IP" ]; then
    return 1
  fi
  
  # Fast routing check
  if ! ip route | grep -q nordlayer; then
    return 1
  fi
  
  # Minimal connectivity test
  if ! ping -c 1 -W 1 trade.dydx.exchange &>/dev/null; then
    return 1
  fi
  
  return 0
}

# Optimized reconnection function
reconnect_vpn() {
  # Fix socket if needed
  if ! nordlayer status &>/dev/null; then
    fix_socket_permissions
  fi
  
  # Quick disconnect
  nordlayer disconnect 2>/dev/null || true
  sleep 1
  
  # Connect
  if nordlayer connect "dos-server-BQG2cKQV"; then
    sleep 2  # Minimal wait
    
    if check_vpn_connection; then
      return 0
    fi
    
    # One more try with slightly longer wait
    sleep 2
    if check_vpn_connection; then
      return 0
    fi
  fi
  
  # Last attempt with service restart
  sudo systemctl restart nordlayer.service
  sleep 2
  fix_socket_permissions
  
  nordlayer disconnect 2>/dev/null || true
  sleep 1
  
  if nordlayer connect "dos-server-BQG2cKQV"; then
    sleep 3
    return check_vpn_connection
  fi
  
  return 1
}

# Minimal diagnostics when needed
collect_minimal_diagnostics() {
  echo "Socket exists: $(test -S /run/nordlayer/nordlayer.sock && echo 'Yes' || echo 'No')"
  echo "Current IP: $(curl -s --max-time 3 ifconfig.me)"
  echo "NordLayer status: $(nordlayer status 2>&1 || echo 'Failed')"
  echo "Routes: $(ip route | grep nordlayer || echo 'No nordlayer routes')"
}

# Main execution with faster logic
if ! check_vpn_connection; then
  echo "VPN check failed, attempting fast reconnection"
  if ! reconnect_vpn; then
    echo "VPN reconnection failed, basic diagnostics:"
    collect_minimal_diagnostics
    exit 1
  fi
fi 

echo "VPN check passed!"
exit 0 