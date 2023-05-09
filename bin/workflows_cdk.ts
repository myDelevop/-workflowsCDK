#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { WorkflowsCdkStack } from '../lib/workflows_cdk-stack';

const app = new cdk.App();
new WorkflowsCdkStack(app, 'WorkflowsCdkStack');
