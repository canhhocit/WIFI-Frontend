// SIT branch — build Docker image, push Docker Hub, cập nhật GitOps → ArgoCD sync.
// Repo: https://git.dnt.group/dev/manage-wifi/source-code/front-end.git
// Jenkins job: Script Path = Jenkinsfile, branch = main (hoặc SIT)
pipeline {
    agent any

    environment {
        DOCKER_IMAGE    = 'kiakitakk/manage-wifi-frontend'
        IMAGE_TAG       = 'sit'
        DEPLOYMENT_NAME = 'manage-wifi-frontend'
        NAMESPACE       = 'manage-wifi'
        DOCKER_CLIENT_TIMEOUT = '300'

        GITOPS_CRED_ID  = 'gitlab-token'
        GITOPS_REPO     = 'git.dnt.group/k8s/k8s-gitops.git'
        GITOPS_BRANCH   = 'main'
        KUSTOMIZE_FILE  = 'apps/manage-wifi/frontend/overlays/sit/kustomization.yaml'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "SIT build → ${DOCKER_IMAGE}:${IMAGE_TAG}-* | namespace=${NAMESPACE}"
            }
        }

        stage('Build Docker Image') {
            steps {
                retry(3) {
                    sh """
                        export DOCKER_BUILDKIT=0
                        docker build --pull=false \
                            -t ${DOCKER_IMAGE}:${IMAGE_TAG}-\${BUILD_NUMBER} \
                            -t ${DOCKER_IMAGE}:${IMAGE_TAG}-latest \
                            .
                    """
                }
            }
        }

        stage('Push to Registry') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-hub-kiakitakk',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                        echo "\$DOCKER_PASS" | docker login -u "\$DOCKER_USER" --password-stdin
                        docker push ${DOCKER_IMAGE}:${IMAGE_TAG}-\${BUILD_NUMBER}
                        docker push ${DOCKER_IMAGE}:${IMAGE_TAG}-latest
                    """
                }
            }
        }

        stage('Update GitOps') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: GITOPS_CRED_ID,
                    usernameVariable: 'GIT_USER',
                    passwordVariable: 'GIT_TOKEN'
                )]) {
                    sh """
                        rm -rf gitops-tmp
                        AUTH=\$(printf '%s:%s' "\$GIT_USER" "\$GIT_TOKEN" | base64 | tr -d '\\n')
                        git -c http.extraheader="Authorization: Basic \$AUTH" clone https://${GITOPS_REPO} gitops-tmp
                        cd gitops-tmp

                        sed -i 's|newTag:.*|newTag: "${IMAGE_TAG}-${BUILD_NUMBER}"|' ${KUSTOMIZE_FILE}

                        git config user.email "jenkins@phuchoangmai.xyz"
                        git config user.name "Jenkins CI"
                        git add ${KUSTOMIZE_FILE}
                        git diff --cached --quiet || git commit -m "ci: update ${DEPLOYMENT_NAME} to ${IMAGE_TAG}-${BUILD_NUMBER}"
                        git -c http.extraheader="Authorization: Basic \$AUTH" push origin ${GITOPS_BRANCH}

                        cd ..
                        rm -rf gitops-tmp
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Build & push thành công: ${DOCKER_IMAGE}:${IMAGE_TAG}-\${BUILD_NUMBER}"
            echo "⏳ ArgoCD sẽ tự Sync trong vài phút..."
        }
        failure {
            echo "❌ Build thất bại! Xem log ở trên."
        }
        always {
            sh "docker rmi ${DOCKER_IMAGE}:${IMAGE_TAG}-\${BUILD_NUMBER} || true"
        }
    }
}
