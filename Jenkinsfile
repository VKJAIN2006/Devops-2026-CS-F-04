pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/VKJAIN2006/Devops-2026-CS-F-04.git'
            }
        }

        stage('Verify Node.js and npm') {
            steps {
                bat '''
                    @echo off
                    where node
                    if errorlevel 1 (
                        echo ERROR: Node.js is not available to the Jenkins service.
                        exit /b 1
                    )
                    where npm
                    if errorlevel 1 (
                        echo ERROR: npm is not available to the Jenkins service.
                        exit /b 1
                    )
                    node --version
                    npm --version
                '''
            }
        }

        stage('Backend - Install and Test') {
            steps {
                dir('Backend') {
                    bat '''
                        @echo off
                        if not exist package.json (
                            echo ERROR: Backend/package.json not found.
                            exit /b 1
                        )

                        if exist package-lock.json (
                            call npm ci --no-audit --no-fund
                        ) else (
                            call npm install --no-audit --no-fund
                        )
                        if errorlevel 1 exit /b 1

                        call npm test
                        if errorlevel 1 exit /b 1
                    '''
                }
            }
        }

        stage('Frontend - Install and Test') {
            steps {
                dir('Frontend') {
                    bat '''
                        @echo off
                        if not exist package.json (
                            echo ERROR: Frontend/package.json not found.
                            exit /b 1
                        )

                        if exist package-lock.json (
                            call npm ci --no-audit --no-fund
                        ) else (
                            call npm install --no-audit --no-fund
                        )
                        if errorlevel 1 exit /b 1

                        call npm test -- --run
                        if errorlevel 1 exit /b 1
                    '''
                }
            }
        }

        stage('Docker - Validate Configuration') {
            steps {
                bat '''
                    @echo off
                    where docker-compose >nul 2>nul
                    if errorlevel 1 (
                        echo WARNING: docker-compose not found in PATH. Skipping Docker validation stage.
                        exit /b 0
                    )
                    echo Validating docker-compose configuration...
                    call docker-compose config
                    if errorlevel 1 (
                        echo ERROR: Docker Compose configuration validation failed.
                        exit /b 1
                    )
                    echo SUCCESS: Docker Compose configuration is valid.
                '''
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: Backend and frontend tests passed.'
        }
        failure {
            echo 'FAILURE: One or more checks/tests failed. Review the stage console output.'
        }
        always {
            echo "Build #${BUILD_NUMBER} finished with status: ${currentBuild.currentResult}"
        }
    }
}
