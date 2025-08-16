import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
          PDF DeepWiki
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          AI-powered PDF document analysis and cross-referencing
        </p>
        
        <div className="flex justify-center gap-4 mb-12">
          <Link 
            href="/documents"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Upload Documents
          </Link>
          <Link 
            href="/search/s3-models-example"
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors font-medium"
          >
            View Demo
          </Link>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
          <Link 
            href="/documents"
            className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            <h3 className="text-lg font-semibold mb-3">📄 Document Upload</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Upload multiple PDFs and let AI analyze their content and relationships
            </p>
          </Link>
          
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg opacity-75">
            <h3 className="text-lg font-semibold mb-3">🔍 Smart Search</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Ask questions across all your documents with AI-powered understanding
            </p>
          </div>
          
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg opacity-75">
            <h3 className="text-lg font-semibold mb-3">🔗 Cross-References</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Discover connections and relationships between different documents
            </p>
          </div>
        </div>

        <div className="mt-16 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <div className="grid gap-4 md:grid-cols-2 text-left">
            <div>
              <h3 className="font-semibold text-primary mb-2">Split Panel Interface</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Clean split-panel design with AI responses on the left and code snippets on the right
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-2">Dark Mode Support</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Seamless dark/light mode switching with proper theme persistence
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-2">Code Highlighting</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Syntax-highlighted code blocks with line numbers and file references
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-2">Responsive Design</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Mobile-friendly interface that adapts to different screen sizes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}