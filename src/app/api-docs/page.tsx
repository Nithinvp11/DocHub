import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Code, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'API Documentation - DocHub – Collaborative Documentation Platform',
  description: 'Interactive REST API documentation with OpenAPI specification',
};

export default function APIDocsPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold text-slate-900">API Documentation</h1>
        <p className="text-lg text-slate-600">
          Comprehensive REST API reference for the DocHub platform.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* OpenAPI Spec */}
        <Link
          href="/api/docs/openapi.json"
          target="_blank"
          className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
        >
          <div className="mb-4 flex items-center justify-between">
            <FileText className="h-8 w-8 text-blue-600" />
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              OpenAPI 3.0
            </span>
          </div>
          <h3 className="mb-2 text-xl font-semibold text-slate-900 group-hover:text-blue-600">
            OpenAPI Specification
          </h3>
          <p className="text-sm text-slate-600">
            Download the complete OpenAPI 3.0 specification in JSON format for use with API tools.
          </p>
          <div className="mt-4 flex items-center text-sm font-medium text-blue-600">
            View JSON →
          </div>
        </Link>

        {/* Swagger UI */}
        <a
          href="https://editor.swagger.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-green-300 hover:shadow-md"
        >
          <div className="mb-4 flex items-center justify-between">
            <Code className="h-8 w-8 text-green-600" />
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              External
            </span>
          </div>
          <h3 className="mb-2 text-xl font-semibold text-slate-900 group-hover:text-green-600">
            Swagger Editor
          </h3>
          <p className="text-sm text-slate-600">
            Import our OpenAPI spec into Swagger Editor for interactive API exploration and testing.
          </p>
          <div className="mt-4 flex items-center text-sm font-medium text-green-600">
            Open Editor →
          </div>
        </a>

        {/* Postman */}
        <a
          href="https://www.postman.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-orange-300 hover:shadow-md"
        >
          <div className="mb-4 flex items-center justify-between">
            <Zap className="h-8 w-8 text-orange-600" />
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              External
            </span>
          </div>
          <h3 className="mb-2 text-xl font-semibold text-slate-900 group-hover:text-orange-600">
            Import to Postman
          </h3>
          <p className="text-sm text-slate-600">
            Download the OpenAPI spec and import it into Postman for API testing and collection
            management.
          </p>
          <div className="mt-4 flex items-center text-sm font-medium text-orange-600">
            Open Postman →
          </div>
        </a>
      </div>

      {/* Quick Reference */}
      <div className="mt-12 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Quick Reference</h2>

        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Authentication</h3>
            <p className="mb-2 text-sm text-slate-600">
              All API endpoints require authentication using NextAuth session tokens.
            </p>
            <pre className="rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
              <code>
                {`Authorization: Bearer <session-token>
Content-Type: application/json`}
              </code>
            </pre>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Base URL</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-700">Development:</span>
                <code className="rounded bg-slate-100 px-2 py-1 text-sm text-slate-900">
                  http://localhost:3000/api
                </code>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-700">Production:</span>
                <code className="rounded bg-slate-100 px-2 py-1 text-sm text-slate-900">
                  https://your-domain.com/api
                </code>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Common Endpoints</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-4 rounded border border-slate-200 p-3">
                <span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                  GET
                </span>
                <div className="flex-1">
                  <code className="text-sm font-medium text-slate-900">/documents</code>
                  <p className="mt-1 text-xs text-slate-600">List all documents</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded border border-slate-200 p-3">
                <span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                  POST
                </span>
                <div className="flex-1">
                  <code className="text-sm font-medium text-slate-900">/documents</code>
                  <p className="mt-1 text-xs text-slate-600">Create new document</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded border border-slate-200 p-3">
                <span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                  GET
                </span>
                <div className="flex-1">
                  <code className="text-sm font-medium text-slate-900">/documents/{'{id}'}</code>
                  <p className="mt-1 text-xs text-slate-600">Get document details</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded border border-slate-200 p-3">
                <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
                  PUT
                </span>
                <div className="flex-1">
                  <code className="text-sm font-medium text-slate-900">/documents/{'{id}'}</code>
                  <p className="mt-1 text-xs text-slate-600">Update document</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded border border-slate-200 p-3">
                <span className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                  DELETE
                </span>
                <div className="flex-1">
                  <code className="text-sm font-medium text-slate-900">/documents/{'{id}'}</code>
                  <p className="mt-1 text-xs text-slate-600">Delete document</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Rate Limiting</h3>
            <p className="text-sm text-slate-600">
              API endpoints are rate-limited to prevent abuse:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                Authenticated: 1000 requests per hour
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                Unauthenticated: 100 requests per hour
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="mt-8 rounded-lg bg-blue-50 p-6">
        <h3 className="mb-3 text-lg font-semibold text-blue-900">Getting Started</h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li>1. Download the OpenAPI specification</li>
          <li>2. Import into your preferred API tool (Swagger, Postman, Insomnia)</li>
          <li>3. Obtain an authentication token from NextAuth</li>
          <li>4. Start making requests!</li>
        </ol>
      </div>
    </div>
  );
}
