#!/usr/bin/env bash
set -euo pipefail

SUBJECT=""
FROM=""
RECVS=""
BODY=""
BODY_FILE=""
ATTACHMENT=""
MIMETYPE=""

usage() {
  cat <<'USAGE' >&2
Usage:
  send_email.sh \
    --subject "Subject line" \
    --from sender@example.com \
    --receivers "a@ex.com,b@ex.com" \
    [--body "<html>...</html>" | --body-file /path/body.html] \
    [--attachment /path/file]

Notes:
- Provide either --body or --body-file (prefer --body-file for complex HTML).
- --attachment is optional.
USAGE
  exit 2
}

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    -s|--subject)     SUBJECT="${2:-}"; shift 2 ;;
    -f|--from)        FROM="${2:-}"; shift 2 ;;
    -r|--receiver|--receivers) RECVS="${2:-}"; shift 2 ;;
    -b|--body)        BODY="${2:-}"; shift 2 ;;
    --body-file)      BODY_FILE="${2:-}"; shift 2 ;;
    -a|--attachment)  ATTACHMENT="${2:-}"; shift 2 ;;
    -h|--help)        usage ;;
    *) echo "Unknown arg: $1" >&2; usage ;;
  esac
done

[[ -n "$SUBJECT" && -n "$FROM" && -n "$RECVS" ]] || usage
if [[ -z "$BODY" && -z "$BODY_FILE" ]]; then
  echo "Error: Provide --body or --body-file" >&2; exit 2
fi
if [[ -n "$BODY" && -n "$BODY_FILE" ]]; then
  echo "Error: Use only one of --body or --body-file" >&2; exit 2
fi

# Prepare and encode HTML body
if [[ -n "$BODY_FILE" ]]; then
  [[ -f "$BODY_FILE" ]] || { echo "Body file not found: $BODY_FILE" >&2; exit 2; }
  BODY_B64="$(base64 -w0 < "$BODY_FILE")"
else
  BODY_B64="$(printf '%s' "$BODY" | base64 -w0)"
fi

BOUNDARY="NextPart$(date +%s)"

RAW="From: ${FROM}
To: ${RECVS}
Subject: ${SUBJECT}
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary=\"${BOUNDARY}\"

--${BOUNDARY}
Content-Type: text/html; charset=UTF-8
Content-Transfer-Encoding: base64

${BODY_B64}
"

# Optional attachment
if [[ -n "$ATTACHMENT" ]]; then
  [[ -f "$ATTACHMENT" ]] || { echo "Attachment not found: $ATTACHMENT" >&2; exit 2; }
  FILENAME="$(basename "$ATTACHMENT")"
  if command -v file >/dev/null 2>&1; then
    MIMETYPE="$(file --mime-type -b "$ATTACHMENT" || true)"
  fi
  MIMETYPE="${MIMETYPE:-application/octet-stream}"
  ATTACH_B64="$(base64 -w0 < "$ATTACHMENT")"

  RAW+="
--${BOUNDARY}
Content-Type: ${MIMETYPE}; name=\"${FILENAME}\"
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename=\"${FILENAME}\"

${ATTACH_B64}
"
fi

RAW+="
--${BOUNDARY}--
"

# Wrap safely into JSON using jq
TMPFILE="/tmp/ses-$(date +%s).json"
printf '%s' "$RAW" | jq -Rn --arg data "$(cat)" '{Data: $data}' > "$TMPFILE"

aws ses send-raw-email \
  --cli-binary-format raw-in-base64-out \
  --raw-message "file://$TMPFILE"
