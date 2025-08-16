import QueryDisplay from '@/components/QueryDisplay'
import SplitPanel from '@/components/SplitPanel'
import ResponsePanel from '@/components/ResponsePanel'
import CodePanel from '@/components/CodePanel'

// Mock data - in a real app, this would come from an API
const mockResponse = {
  query: "tell me about the s3 models",
  repo: "cashapp/misk",
  response: {
    content: `Based on the codebase context, you're asking about S3-related models in the Misk framework.

## S3 Models in Misk

Misk provides S3 integration primarily through the \`misk-aws\` module, which includes S3 client configuration and cryptographic key management.

### S3 Client Configuration

The main S3 model is provided through the \`RealS3Module\` class, which configures the AWS S3 client:

This module provides:
- S3 client configuration through \`configureClient()\` method
- S3 instance provisioning via \`provideS3()\` method that takes AWS region and credentials

### S3 Key Management

A more sophisticated S3 model exists in the crypto module through \`S3KeySource\`, which implements external key management using S3:

The \`S3KeySource\` class provides:
- Fetches Tink keysets from S3 buckets
- Uses envelope key encryption with KMS
- Organizes keys by alias and region in a specific bucket structure
- Handles cross-region bucket access with separate S3 clients when needed`,
    codeRefs: [
      { file: "README.md", line: 41 },
      { file: "misk-aws.api", lines: "232-237" },
      { file: "S3KeySource.kt", lines: "12-33" },
      { file: "S3KeySource.kt", lines: "49-58" },
      { file: "build.gradle.kts", lines: "10-12" }
    ]
  },
  codeSnippets: [
    {
      file: "misk-aws/api/misk-aws.api",
      repo: "cashapp/misk",
      lines: [
        { number: 232, content: "public class misk/s3/RealS3Module : misk/inject/KAbstractModule {" },
        { number: 233, content: "  public fun <init> ()V" },
        { number: 234, content: "  protected fun configure ()V" },
        { number: 235, content: "  public fun configureClient (Lcom/amazonaws/services/s3/AmazonS3ClientBuilder;)V" },
        { number: 236, content: "  public final fun provideS3 (Lmisk/cloud/aws/AwsRegion;Lcom/amazonaws/auth/AWSCredentialsProvider;)Lcom/amazonaws/services/s3/AmazonS3;" },
        { number: 237, content: "}" }
      ]
    },
    {
      file: "misk-crypto/src/main/kotlin/misk/crypto/S3KeySource.kt",
      repo: "cashapp/misk",
      lines: [
        { number: 34, content: "class S3KeySource @Inject constructor(" },
        { number: 35, content: "  private val deployment: Deployment," },
        { number: 36, content: "  defaultS3: AmazonS3," },
        { number: 49, content: "  private val s3: AmazonS3 = bucketNameSource.getBucketRegion(deployment)?.let { region ->" },
        { number: 50, content: "    if (region != defaultS3.regionName) {" },
        { number: 51, content: "      logger.info(\"creating S3ExternalKeyManager S3 client for $region\")" },
        { number: 52, content: "      AmazonS3ClientBuilder" },
        { number: 53, content: "        .standard()" },
        { number: 54, content: "        .withRegion(region)" },
        { number: 55, content: "        .withCredentials(awsCredentials)" },
        { number: 56, content: "        .build()" },
        { number: 57, content: "    } else null" },
        { number: 58, content: "  } ?: defaultS3" }
      ]
    }
  ]
}

interface PageProps {
  params: {
    slug: string
  }
}

export default function SearchPage({ params }: PageProps) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col">
      <QueryDisplay 
        query={mockResponse.query} 
        repo={mockResponse.repo}
      />
      
      <SplitPanel>
        <ResponsePanel content={mockResponse.response.content} />
        <CodePanel snippets={mockResponse.codeSnippets} />
      </SplitPanel>
    </div>
  )
}