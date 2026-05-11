#!/bin/sh
# ------------------------------------------------------------------
#  extract_stats.sh
#  Parses the mochawesome HTML report and outputs test-run statistics
#  as KEY=VALUE pairs (safe to `eval` or `source` in bash scripts).
#
#  Usage:  ./extract_stats.sh <path-to-index.html>
#  Output: KEY=VALUE lines to stdout
#
#  Dependencies: grep, sed, awk (standard on any Linux/Alpine)
# ------------------------------------------------------------------

set -eu

REPORT="${1:-cypress/reports/html/index.html}"

if [ ! -f "$REPORT" ]; then
  echo "File not found: $REPORT" >&2
  exit 1
fi

# Extract the data-raw attribute value from the HTML
RAW=$(grep -o 'data-raw="[^"]*"' "$REPORT" | head -1 | sed 's/^data-raw="//;s/"$//')

if [ -z "$RAW" ]; then
  echo "ERROR: data-raw attribute not found in report" >&2
  exit 1
fi

# Decode HTML entities
RAW=$(echo "$RAW" | sed \
  -e 's/&quot;/"/g' \
  -e 's/&amp;/\&/g' \
  -e 's/&lt;/</g' \
  -e 's/&gt;/>/g' \
  -e "s/&#x27;/'/g" \
  -e "s/&#39;/'/g")

# Helper: extract a JSON value by key (handles strings and numbers)
json_val() {
  echo "$RAW" | grep -o "\"$1\":[^,}]*" | head -1 | sed "s/\"$1\"://;s/\"//g;s/ //g"
}

SUITES=$(json_val suites)
TESTS=$(json_val tests)
PASSES=$(json_val passes)
FAILURES=$(json_val failures)
PENDING=$(json_val pending)
SKIPPED=$(json_val skipped)
PASS_PERCENT=$(json_val passPercent)
DURATION_MS=$(json_val duration)
START=$(json_val start)
END=$(json_val end)

# Defaults
SUITES=${SUITES:-0}
TESTS=${TESTS:-0}
PASSES=${PASSES:-0}
FAILURES=${FAILURES:-0}
PENDING=${PENDING:-0}
SKIPPED=${SKIPPED:-0}
PASS_PERCENT=${PASS_PERCENT:-0}
DURATION_MS=${DURATION_MS:-0}

# Format duration: ms → Xm Ys
MINUTES=$((DURATION_MS / 60000))
SECONDS=$(( (DURATION_MS % 60000) / 1000 ))
DURATION_FMT="${MINUTES}m ${SECONDS}s"

# Format timestamps: 2025-01-01T12:00:00.000Z → 2025-01-01 12:00:00.000 UTC
format_ts() {
  if [ -z "$1" ] || [ "$1" = "null" ]; then
    echo "N/A"
  else
    echo "$1" | sed 's/T/ /;s/Z/ UTC/' | cut -c1-23 | xargs -I{} printf '%s UTC' {}
  fi
}

START_FMT=$(format_ts "$START")
END_FMT=$(format_ts "$END")

# Status
if [ "$FAILURES" = "0" ]; then
  STATUS="PASSED"
else
  STATUS="FAILED"
fi

# Output KEY=VALUE pairs
cat <<EOF
STAT_SUITES="$SUITES"
STAT_TESTS="$TESTS"
STAT_PASSES="$PASSES"
STAT_FAILURES="$FAILURES"
STAT_PENDING="$PENDING"
STAT_SKIPPED="$SKIPPED"
STAT_PASS_PERCENT="$PASS_PERCENT"
STAT_DURATION="$DURATION_FMT"
STAT_DURATION_MS="$DURATION_MS"
STAT_START="$START_FMT"
STAT_END="$END_FMT"
STAT_STATUS="$STATUS"
EOF
