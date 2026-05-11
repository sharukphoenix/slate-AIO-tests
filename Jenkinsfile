pipeline {
  agent {
    kubernetes { label 'jenkins-slave' }
  }

  environment {
    AWS_REGION          = 'us-east-1'
    AWS_DEFAULT_REGION  = 'us-east-1'
    S3_BUCKET           = 'slateai-ui-automation'
    REPORT_RECEIVERS    = "${env.REPORT_RECEIVERS}"
    DOCKER_IMAGE_NAME   = 'node_automation_cypress_qe:latest'
  }

  stages {

    stage('Docker Build') {
      steps {
        sh '''
set -eu

docker rm -f node_automation_cypress_qe || true

echo "Building Docker image..."
docker build --network host -t "$DOCKER_IMAGE_NAME" .
'''
      }
    }

    stage('Run Tests in Docker') {
      steps {
        script {
          sh '''
set +e

docker rm -f node_automation_cypress_qe || true

echo "Running Cypress QE tests..."

docker run --name node_automation_cypress_qe \
  --network host \
  "$DOCKER_IMAGE_NAME"

TEST_EXIT_CODE=$?

mkdir -p "$WORKSPACE/htmlreports"

docker cp node_automation_cypress_qe:/e2e/cypress/reports/html/index.html \
  "$WORKSPACE/htmlreports/index.html" || true

docker rm -f node_automation_cypress_qe || true

echo $TEST_EXIT_CODE > test_exit_code.txt
'''

          def testExit = readFile('test_exit_code.txt').trim()

          if (testExit != "0") {
            currentBuild.result = 'UNSTABLE'
            echo "Some Cypress tests failed — marking build UNSTABLE."
          } else {
            echo "All Cypress tests passed."
          }
        }
      }
    }

    stage('Upload & Presign (24h)') {
      steps {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding',
                          credentialsId: 'jenkins-user-ec2',
                          accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                          secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {

          script {

            def SAFE_JOB = (env.JOB_NAME ?: '').replaceAll(/[\\\/\s]/, '_')
            SAFE_JOB = SAFE_JOB.replaceAll(/_demo\b/, '_qe')
            SAFE_JOB = SAFE_JOB.replaceAll(/\bDEMO\b/, 'QE')

            withEnv(["SAFE_JOB=${SAFE_JOB}"]) {

              sh '''
set -eu

DATE=$(date "+%Y%m%d-%H%M%S")
REPORT_KEY="reports/${SAFE_JOB}/${BUILD_NUMBER}/index-${DATE}.html"
SRC="${WORKSPACE}/htmlreports/index.html"

if [ ! -f "${SRC}" ]; then
  echo "Report file not found!"
  exit 1
fi

echo "Uploading report to S3..."
aws s3 cp "${SRC}" "s3://${S3_BUCKET}/${REPORT_KEY}" \
  --content-type "text/html" \
  --content-disposition "attachment; filename=\\"index-${DATE}.html\\"" \
  --acl private \
  --sse AES256

echo "Generating presigned URL..."
aws s3 presign "s3://${S3_BUCKET}/${REPORT_KEY}" \
  --expires-in 86400 > presigned_url.txt
'''
            }

            env.PRESIGNED_URL = sh(
              returnStdout: true,
              script: 'cat presigned_url.txt'
            ).trim()

            echo "Presigned URL generated."
          }
        }
      }
    }

    stage('Publish Reports') {
      steps {
        publishHTML target: [
          allowMissing: false,
          alwaysLinkToLastBuild: false,
          keepAll: true,
          reportDir: 'htmlreports',
          reportFiles: 'index.html',
          reportName: 'Automation Report (QE)'
        ]
      }
    }

    stage('Send Reports via Email') {
      steps {
        sh '''
set -e

BODY_FILE=/tmp/email_body.html

echo "Extracting stats from mochawesome report..."

REPORT="${WORKSPACE}/htmlreports/index.html"
chmod +x extract_stats.sh
eval "$(./extract_stats.sh "$REPORT")"

PASS_BANNER=""
if [ "${STAT_STATUS:-}" = "PASSED" ]; then
  PASS_BANNER='<div style="background:#e6f9ed; padding:12px 24px; text-align:center; border-radius:6px; margin-top:16px;"><b style="color:#1a7f37; font-size:16px;">✅ ALL TESTS PASSED</b></div>'
fi

cat > "$BODY_FILE" <<EOF
<div style="font-family:Arial,Helvetica,sans-serif; max-width:620px; margin:auto; border:1px solid #e0e0e0; border-radius:8px;">
<div style="background:#1a1f36; color:#ffffff; padding:18px 24px;">
<h2 style="margin:0; font-size:20px;">Report Summary</h2>
</div>
<div style="padding:20px 24px;">
<table style="width:100%; border-collapse:collapse; font-size:14px;">
<tr style="background:#f6f8fa;">
<td style="padding:10px 14px; font-weight:bold;">Suites</td>
<td style="padding:10px 14px;">${STAT_SUITES:-N/A}</td>
</tr>
<tr>
<td style="padding:10px 14px; font-weight:bold;">Tests</td>
<td style="padding:10px 14px;">${STAT_TESTS:-N/A}</td>
</tr>
<tr style="background:#f6f8fa;">
<td style="padding:10px 14px; font-weight:bold;">Passed</td>
<td style="padding:10px 14px; color:#1a7f37;">${STAT_PASSES:-N/A}</td>
</tr>
<tr>
<td style="padding:10px 14px; font-weight:bold;">Failed</td>
<td style="padding:10px 14px; color:#cf222e;">${STAT_FAILURES:-N/A}</td>
</tr>
<tr style="background:#f6f8fa;">
<td style="padding:10px 14px; font-weight:bold;">Pending</td>
<td style="padding:10px 14px;">${STAT_PENDING:-N/A}</td>
</tr>
<tr>
<td style="padding:10px 14px; font-weight:bold;">Skipped</td>
<td style="padding:10px 14px;">${STAT_SKIPPED:-N/A}</td>
</tr>
<tr style="background:#f6f8fa;">
<td style="padding:10px 14px; font-weight:bold;">Pass Rate</td>
<td style="padding:10px 14px;">${STAT_PASS_PERCENT:-N/A}%</td>
</tr>
<tr>
<td style="padding:10px 14px; font-weight:bold;">Duration</td>
<td style="padding:10px 14px;">${STAT_DURATION:-N/A}</td>
</tr>
<tr style="background:#f6f8fa;">
<td style="padding:10px 14px; font-weight:bold;">Started</td>
<td style="padding:10px 14px;">${STAT_START:-N/A}</td>
</tr>
<tr>
<td style="padding:10px 14px; font-weight:bold;">Ended</td>
<td style="padding:10px 14px;">${STAT_END:-N/A}</td>
</tr>
</table>

${PASS_BANNER}

<div style="text-align:center; margin-top:20px;">
<a href="${PRESIGNED_URL}" style="background:#2563eb; color:#ffffff; padding:12px 28px; border-radius:6px; text-decoration:none; font-weight:bold;">
📄 Download Full Report
</a>
</div>

<p style="text-align:center; font-size:12px; color:#888; margin-top:12px;">
This link expires in 24 hours.
</p>
</div>
</div>
EOF

chmod +x send_email.sh

./send_email.sh \
  --subject "QE Automation Report - $(date -u +%Y-%m-%d-%H:%M:%S) UTC" \
  --from "notifications@dev.slate.ai" \
  --receivers "${REPORT_RECEIVERS}" \
  --body-file "$BODY_FILE"
'''
      }
    }
  }

  post {
    always {
      sh 'docker rm -f node_automation_cypress_qe || true'
      cleanWs()
    }
  }
}
