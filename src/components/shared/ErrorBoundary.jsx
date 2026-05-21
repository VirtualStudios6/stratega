import { Component } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        style={{ minHeight: "100dvh", backgroundColor: "var(--bg-main)" }}
        className="flex items-center justify-center px-6"
      >
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="flex justify-center">
            <AlertTriangle size={48} className="text-red-400 opacity-80" />
          </div>
          <h2 className="text-text-main font-bold text-xl">Algo salió mal</h2>
          <p className="text-text-muted text-sm">
            Ocurrió un error inesperado. Recarga la página para continuar.
          </p>
          {this.state.error?.message && (
            <p className="text-text-muted/50 text-xs font-mono bg-bg-card border border-border rounded-lg px-3 py-2 break-all">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition"
          >
            <RefreshCw size={16} />
            Recargar
          </button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
