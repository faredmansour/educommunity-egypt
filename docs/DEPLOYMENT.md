# EduCommunity Deployment Notes

## AWS prerequisites

Create/verify:

- S3 remote Terraform state bucket + DynamoDB lock table
- ACM certificate for the API hostname
- Secrets Manager secrets for MongoDB, JWT, JWT refresh, and Redis URLs
- ECR repository (Terraform creates it)
- ECS/Fargate and ALB networking (Terraform creates it)

The production Redis URL should use `rediss://` because Terraform enables Redis transit encryption.

## Bootstrap image

The Terraform task definition uses the `bootstrap` tag when `backend_image` is empty. Before the first ECS service becomes healthy, push a bootstrap image or supply an immutable image reference:

```bash
terraform -chdir=terraform apply \
  -var='backend_image=ACCOUNT.dkr.ecr.eu-central-1.amazonaws.com/educommunity-backend@sha256:...'
```

After the infrastructure exists, GitHub Actions manages ECS revisions using ECR image digests.

## GitHub Actions secrets

Configure the repository with the AWS credentials used by the deployment workflow and the two CloudFront distribution IDs. Prefer short-lived/federated credentials for a real production environment.

The workflow:

1. builds the backend image;
2. pushes a commit-tagged image;
3. resolves its immutable ECR digest;
4. registers a new ECS task definition;
5. waits for ECS stability;
6. builds both React applications;
7. syncs them to their private S3 buckets;
8. invalidates CloudFront.

## Socket.IO horizontal scaling

For one ECS task, leave:

```env
SOCKET_REDIS_ADAPTER=false
```

For multiple backend instances, install the optional packages and enable the adapter:

```bash
cd backend
npm install @socket.io/redis-adapter redis
```

```env
SOCKET_REDIS_ADAPTER=true
REDIS_URL=rediss://...
```

ALB stickiness is also enabled because long-lived Socket.IO connections benefit from session affinity.
