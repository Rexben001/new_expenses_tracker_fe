import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

export class MyReactAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        account: "655187298276",
        region: "eu-west-1",
      },
    });

    // Create an S3 bucket for the React app
    const websiteBucket = new s3.Bucket(this, "ReactAppBucket", {
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html", // for client side routing
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production
      autoDeleteObjects: true, // cleans up bucket on stack destroy
    });

    // Deploy files from the React build directory to the bucket
    new s3deploy.BucketDeployment(this, "DeployReactApp", {
      sources: [s3deploy.Source.asset("../frontend/dist")], // path to React build directory
      destinationBucket: websiteBucket,
    });

    // Output the website URL
    new cdk.CfnOutput(this, "WebsiteURL", {
      value: websiteBucket.bucketWebsiteUrl,
    });
  }
}
