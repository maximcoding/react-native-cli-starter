#!/bin/bash
# Stress test for CliMobile - verify completed sections work correctly

set -e

echo "=== CliMobile Stress Test ==="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

TEST_DIR="stress-test-$(date +%s)"
PROJECT_NAME="StressTestApp"

# Cleanup function
cleanup() {
  if [ -d "$TEST_DIR" ]; then
    echo ""
    echo "Cleaning up test directory: $TEST_DIR"
    rm -rf "$TEST_DIR"
  fi
}

trap cleanup EXIT

echo "Test 1: Build CLI"
echo "-----------------"
if npm run build > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Build successful${NC}"
else
  echo -e "${RED}✗ Build failed${NC}"
  exit 1
fi
echo ""

echo "Test 2: Init command (create new project)"
echo "-----------------------------------------"
# Use non-interactive mode if possible, or create with defaults
cd /Users/maximlivshitz/Documents/Developments/CliMobile
npm run init -- --name "$PROJECT_NAME" --target bare --lang ts --pm npm --destination "$TEST_DIR" 2>&1 | head -50 || {
  echo "Note: Non-interactive init not available, will test manually"
}
echo ""

# Check if test directory was created
if [ -d "$TEST_DIR" ]; then
  echo -e "${GREEN}✓ Test directory created: $TEST_DIR${NC}"
  
  echo ""
  echo "Test 3: Verify Section 8 - Ownership, Backups, Idempotency"
  echo "-----------------------------------------------------------"
  
  # Check backup directory exists
  if [ -d "$TEST_DIR/.rns/backups" ]; then
    BACKUP_COUNT=$(ls -1 "$TEST_DIR/.rns/backups" 2>/dev/null | wc -l | tr -d ' ')
    echo -e "${GREEN}✓ Backup directory exists${NC}"
    echo "  Backup directories: $BACKUP_COUNT"
    
    if [ "$BACKUP_COUNT" -gt 0 ]; then
      echo -e "${GREEN}✓ Backups were created${NC}"
      # List backup directories
      echo "  Backup directories:"
      ls -1 "$TEST_DIR/.rns/backups" | head -3 | sed 's/^/    - /'
    else
      echo -e "${YELLOW}⚠ No backup directories found (might be OK if no files were modified)${NC}"
    fi
  else
    echo -e "${RED}✗ Backup directory not found${NC}"
  fi
  
  # Check for .rns-init.json (project state)
  if [ -f "$TEST_DIR/.rns/rn-init.json" ]; then
    echo -e "${GREEN}✓ Project state file exists${NC}"
  else
    echo -e "${YELLOW}⚠ Project state file not found${NC}"
  fi
  
  echo ""
  echo "Test 4: Verify Section 9 - Marker Contract"
  echo "-------------------------------------------"
  
  # Check for canonical markers in runtime files
  RUNTIME_INDEX="$TEST_DIR/packages/@rns/runtime/index.ts"
  RUNTIME_INIT="$TEST_DIR/packages/@rns/runtime/core-init.ts"
  
  MARKERS_FOUND=0
  MARKERS_EXPECTED=5
  
  if [ -f "$RUNTIME_INDEX" ]; then
    # Check for imports marker
    if grep -q "@rns-marker:imports:start" "$RUNTIME_INDEX"; then
      echo -e "${GREEN}✓ Marker 'imports' found${NC}"
      MARKERS_FOUND=$((MARKERS_FOUND + 1))
    fi
    
    # Check for providers marker
    if grep -q "@rns-marker:providers:start" "$RUNTIME_INDEX"; then
      echo -e "${GREEN}✓ Marker 'providers' found${NC}"
      MARKERS_FOUND=$((MARKERS_FOUND + 1))
    fi
    
    # Check for root marker
    if grep -q "@rns-marker:root:start" "$RUNTIME_INDEX"; then
      echo -e "${GREEN}✓ Marker 'root' found${NC}"
      MARKERS_FOUND=$((MARKERS_FOUND + 1))
    fi
  else
    echo -e "${RED}✗ Runtime index file not found${NC}"
  fi
  
  if [ -f "$RUNTIME_INIT" ]; then
    # Check for init-steps marker
    if grep -q "@rns-marker:init-steps:start" "$RUNTIME_INIT"; then
      echo -e "${GREEN}✓ Marker 'init-steps' found${NC}"
      MARKERS_FOUND=$((MARKERS_FOUND + 1))
    fi
    
    # Check for registrations marker
    if grep -q "@rns-marker:registrations:start" "$RUNTIME_INIT"; then
      echo -e "${GREEN}✓ Marker 'registrations' found${NC}"
      MARKERS_FOUND=$((MARKERS_FOUND + 1))
    fi
  else
    echo -e "${RED}✗ Runtime init file not found${NC}"
  fi
  
  echo "  Markers found: $MARKERS_FOUND/$MARKERS_EXPECTED"
  
  if [ "$MARKERS_FOUND" -eq "$MARKERS_EXPECTED" ]; then
    echo -e "${GREEN}✓ All canonical markers present${NC}"
  else
    echo -e "${YELLOW}⚠ Some markers missing${NC}"
  fi
  
  echo ""
  echo "Test 5: Verify Section 10 - Marker Patcher (code exists)"
  echo "--------------------------------------------------------"
  
  if [ -f "src/lib/marker-patcher.ts" ]; then
    echo -e "${GREEN}✓ Marker patcher file exists${NC}"
    
    # Check for key functions
    if grep -q "export function patchMarker" "src/lib/marker-patcher.ts"; then
      echo -e "${GREEN}✓ patchMarker function exists${NC}"
    fi
    
    if grep -q "export function patchMarkers" "src/lib/marker-patcher.ts"; then
      echo -e "${GREEN}✓ patchMarkers function exists${NC}"
    fi
    
    if grep -q "export function validatePatches" "src/lib/marker-patcher.ts"; then
      echo -e "${GREEN}✓ validatePatches function exists${NC}"
    fi
  else
    echo -e "${RED}✗ Marker patcher file not found${NC}"
  fi
  
  echo ""
  echo "Test 6: Verify Ownership Zones"
  echo "------------------------------"
  
  # Check System Zone files exist
  if [ -d "$TEST_DIR/packages/@rns" ]; then
    echo -e "${GREEN}✓ System Zone (packages/@rns) exists${NC}"
  else
    echo -e "${RED}✗ System Zone not found${NC}"
  fi
  
  if [ -d "$TEST_DIR/.rns" ]; then
    echo -e "${GREEN}✓ System Zone (.rns) exists${NC}"
  else
    echo -e "${RED}✗ System Zone (.rns) not found${NC}"
  fi
  
  # Check User Zone (should exist but be empty or minimal)
  if [ -d "$TEST_DIR/src" ]; then
    echo -e "${GREEN}✓ User Zone (src) exists${NC}"
  fi
  
  echo ""
  echo "Test 7: Verify Regression Fixes"
  echo "--------------------------------"
  
  # Test 1: projectRoot parameter fix
  if grep -q "projectRoot: string" "src/lib/attachment-engine.ts"; then
    echo -e "${GREEN}✓ projectRoot parameter fix verified${NC}"
  else
    echo -e "${RED}✗ projectRoot parameter fix missing${NC}"
  fi
  
  # Test 2: Blueprint optional fix
  if grep -q "getDepVersion" "src/lib/blueprint-deps.ts"; then
    echo -e "${GREEN}✓ Blueprint optional fix verified${NC}"
  else
    echo -e "${RED}✗ Blueprint optional fix missing${NC}"
  fi
  
  # Test 3: Preflight check fix
  if grep -q "userFiles.length > 0" "src/lib/init.ts"; then
    echo -e "${GREEN}✓ Preflight check fix verified${NC}"
  else
    echo -e "${RED}✗ Preflight check fix missing${NC}"
  fi
  
  echo ""
  echo "Test 8: Verify Core Files Structure"
  echo "-----------------------------------"
  
  REQUIRED_FILES=(
    "$TEST_DIR/package.json"
    "$TEST_DIR/App.tsx"
    "$TEST_DIR/packages/@rns/runtime/index.ts"
    "$TEST_DIR/packages/@rns/runtime/core-init.ts"
  )
  
  ALL_EXIST=true
  for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
      echo -e "${GREEN}✓ $(basename $file) exists${NC}"
    else
      echo -e "${RED}✗ $(basename $file) missing${NC}"
      ALL_EXIST=false
    fi
  done
  
  if [ "$ALL_EXIST" = true ]; then
    echo -e "${GREEN}✓ All required files present${NC}"
  fi
  
  echo ""
  echo "=== Stress Test Summary ==="
  echo "Test directory: $TEST_DIR"
  echo "All tests completed"
  
else
  echo -e "${RED}✗ Test directory not created - init may have failed${NC}"
  exit 1
fi

