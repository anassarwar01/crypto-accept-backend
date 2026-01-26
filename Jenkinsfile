pipeline {
    agent any
    environment {
        PROJECT_NAME = 'crypto-accept-backend'
        REPO_NAME = 'crypto-accept-backend'
        REMOTE_SERVER = 'jenkins@23.88.31.61'
        PLAYWRIGHT_BRANCH = 'test'
        SONARQUBE_ENABLED_BRANCH = 'test'
        PROJECT_TYPE = 'nestjs'
    }
    stages {
        stage('Get Git Info') {
            steps {
                script {
                    try {
                        def gitInfo = sh(returnStdout: true, script: '''
                            git log -1 --pretty=format:"COMMIT=%h%nMESSAGE=%s%nAUTHOR=%an%nEMAIL=%ae"
                            echo "BRANCH=$(git rev-parse --abbrev-ref HEAD)"
                            echo "CHANGES=$(git diff --name-only HEAD HEAD~1 | paste -sd ", " - || echo "No changes")"
                        ''').trim()
                        // Convert output to a Map manually
                        def gitData = [:]
                        gitInfo.split('\n').each { line ->
                            def parts = line.split('=', 2)
                            if (parts.size() == 2) {
                                gitData[parts[0].trim()] = parts[1].trim()
                            }
                        }
                        env.GIT_COMMIT = gitData.COMMIT ?: "Unknown Commit"
                        env.GIT_BRANCH = gitData.BRANCH ?: "Unknown Branch"
                        env.GIT_AUTHOR = gitData.AUTHOR ?: "Unknown Author"
                        env.GIT_EMAIL = gitData.EMAIL ?: "Unknown Email"
                        env.GIT_MESSAGE = gitData.MESSAGE ?: "No commit message"
                        env.GIT_CHANGES = gitData.CHANGES ?: "No changes"
                    } catch (Exception e) {
                        echo "Error fetching Git information: ${e.getMessage()}"
                        ["GIT_COMMIT", "GIT_BRANCH", "GIT_AUTHOR", "GIT_EMAIL", "GIT_MESSAGE", "GIT_CHANGES"].each { env[it] = "Unknown" }
                    }
                }
            }
        }
        stage('Pull from GitHub & Deploy') {
            steps {
                script {
                    try {
                        sh """
                            ssh -T -o StrictHostKeyChecking=no ${env.REMOTE_SERVER} " cd ${env.WORKSPACE_DIR}${env.GIT_BRANCH}/${env.REPO_NAME} && sudo git pull origin ${env.GIT_BRANCH} && case '${env.PROJECT_TYPE}' in laravel) sudo php artisan optimize:clear ;; nestjs) sudo npm i && sudo npm run build && sudo /root/.nvm/versions/node/v20.13.1/bin/pm2 restart ${env.REPO_NAME}-${env.GIT_BRANCH} ;; laravel-mix) sudo npm i && sudo npm run build && sudo php artisan optimize:clear ;; *) echo 'Invalid project type'; exit 1 ;; esac"
                        """
                    } catch (Exception e) {
                        env.FAILURE_STAGE = 'Pull from GitHub & Deploy'
                        env.FAILURE_REASON = "Git Pull or Deployment failed"
                        currentBuild.result = 'FAILURE'
                        error env.FAILURE_REASON
                    }
                }
            }
        }
        stage('Run Playwright Tests') {
            when {
                expression { env.GIT_BRANCH == env.PLAYWRIGHT_BRANCH && ['vue', 'laravel-mix'].contains(env.PROJECT_TYPE) }
            }
            steps {
                script {
                    try {
                        sh """
                            ssh -T -o StrictHostKeyChecking=no ${env.REMOTE_SERVER} "cd ${env.WORKSPACE_DIR}${env.GIT_BRANCH}/${env.FOLDER_NAME}/.automation && sudo npx playwright test tests --workers=1"
                        """
                        sh "scp ${env.REMOTE_SERVER}:${env.WORKSPACE_DIR}${env.GIT_BRANCH}${env.FOLDER_NAME}/.automation/playwright-report/index.html ."
                    } catch (Exception e) {
                        env.FAILURE_STAGE = 'Run Playwright Tests'
                        env.FAILURE_REASON = "Playwright tests failed"
                        currentBuild.result = 'FAILURE'
                        error env.FAILURE_REASON
                    }
                }
            }
        }
        stage('SonarQube Analysis') {
            when {
                expression { env.GIT_BRANCH == env.SONARQUBE_ENABLED_BRANCH && ['laravel', 'laravel-mix'].contains(env.PROJECT_TYPE) }
            }
            steps {
                script {
                    try {
                        def scannerHome = tool 'sonarqube'
                        withSonarQubeEnv('sonarqube') {
                            sh "${scannerHome}/bin/sonar-scanner"
                        }
                    } catch (Exception e) {
                        env.FAILURE_STAGE = 'SonarQube Analysis'
                        env.FAILURE_REASON = "SonarQube Scan failed"
                        currentBuild.result = 'FAILURE'
                        error env.FAILURE_REASON
                    }
                }
            }
        }
        stage('Quality Gate') {
            when {
                expression { env.GIT_BRANCH == env.SONARQUBE_ENABLED_BRANCH && ['laravel', 'laravel-mix'].contains(env.PROJECT_TYPE) }
            }
            steps {
                script {
                    try {
                        def qualityGate = waitForQualityGate()
                        echo "Quality Gate status: ${qualityGate.status}"
                        if (qualityGate.status != 'OK') {
                            env.FAILURE_STAGE = 'Quality Gate'
                            env.FAILURE_REASON = "Quality Gate failed: ${qualityGate.status}"
                            currentBuild.result = 'FAILURE'
                            error env.FAILURE_REASON
                        }
                    } catch (Exception e) {
                        env.FAILURE_STAGE = 'Quality Gate'
                        env.FAILURE_REASON = "Quality Gate check failed"
                        currentBuild.result = 'FAILURE'
                        error env.FAILURE_REASON
                    }
                }
            }
        }
    }
    post {
        success {
            script {
                if (env.GIT_BRANCH == env.PLAYWRIGHT_BRANCH && ['vue', 'laravel-mix'].contains(env.PROJECT_TYPE)) {
                    withCredentials([string(credentialsId: 'SLACK_TOKEN', variable: 'SLACK_TOKEN')]) {
                        sh """
                            curl -F file=@index.html -F "channels=${env.SLACK_CHANNEL}" -F token=${SLACK_TOKEN} https://slack.com/api/files.upload
                        """
                    }
                }
                sh """
                    curl -X POST -H 'Content-type: application/json' --data '{
                        "channel": "${env.SLACK_CHANNEL}",
                        "text": ":white_check_mark: Jenkins Build Successful for ${PROJECT_NAME} on branch ${env.GIT_BRANCH}\\n*Commit:* ${env.GIT_COMMIT}\\n*Author:* ${env.GIT_AUTHOR} <${env.GIT_EMAIL}>\\n*Message:* ${env.GIT_MESSAGE}\\n*Changes:* ${env.GIT_CHANGES}"
                    }' ${env.SLACK_WEBHOOK_URL}
                """
                sh """
                    curl -X POST https://slack.com/api/chat.postMessage -H 'Authorization: Bearer ${env.SLACK_TOKEN}' -H 'Content-type: application/json'  -d '{
                        "channel": "${env.RIDM_SLACK_CHANNEL}",
                        "text": ":white_check_mark: Jenkins Build Successful for ${PROJECT_NAME}\\n*Environment:* ${env.GIT_BRANCH}\\n*Commit:* ${env.GIT_COMMIT}\\n*Author:* ${env.GIT_AUTHOR} <${env.GIT_EMAIL}>\\n*Message:* ${env.GIT_MESSAGE}\\n*Changes:* ${env.GIT_CHANGES}"
                    }'
                """
            }
        }
        failure {
            script {
                sh """
                    curl -X POST -H 'Content-type: application/json' --data '{
                        "channel": "${env.SLACK_CHANNEL}",
                        "text": ":x: Jenkins Build Failed for ${env.PROJECT_NAME} on branch ${env.GIT_BRANCH}\\n*Commit:* ${env.GIT_COMMIT}\\n*Author:* ${env.GIT_AUTHOR} <${env.GIT_EMAIL}>\\n*Message:* ${env.GIT_MESSAGE}\\n*Changes:* ${env.GIT_CHANGES}\\n*Failed Stage:* ${env.FAILURE_STAGE}\\n*Reason:* ${env.FAILURE_REASON}"
                    }' ${env.SLACK_WEBHOOK_URL}
                """
               // RIDM_SLACK_CHANNEL notification 
                sh """
                    curl -X POST https://slack.com/api/chat.postMessage \\
                        -H 'Authorization: Bearer ${env.SLACK_TOKEN}' \\
                        -H 'Content-type: application/json' \\
                        -d '{
                            "channel": "${env.RIDM_SLACK_CHANNEL}",
                            "text": ":x: Jenkins Build Failed for ${PROJECT_NAME}\\n*Environment:* ${env.GIT_BRANCH}\\n*Commit:* ${env.GIT_COMMIT}\\n*Author:* ${env.GIT_AUTHOR} <${env.GIT_EMAIL}>\\n*Message:* ${env.GIT_MESSAGE}\\n*Changes:* ${env.GIT_CHANGES}\\n*Failed Stage:* ${env.FAILURE_STAGE}\\n*Reason:* ${env.FAILURE_REASON}"
                        }'
                """
            }
        }
    }
}