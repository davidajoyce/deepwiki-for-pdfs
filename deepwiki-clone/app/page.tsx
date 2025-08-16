import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
          DeepWiki Clone
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          AI-powered code search and documentation interface
        </p>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
          <Link 
            href="/search/s3-models-example"
            className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            <h3 className="text-lg font-semibold mb-3">Search Example</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              View an example search result showing S3 models in the Misk framework
            </p>
          </Link>
          
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg opacity-75">
            <h3 className="text-lg font-semibold mb-3">Code Search</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Search across codebases with AI-powered understanding
            </p>
          </div>
          
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg opacity-75">
            <h3 className="text-lg font-semibold mb-3">Documentation</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Generate comprehensive documentation from code analysis
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